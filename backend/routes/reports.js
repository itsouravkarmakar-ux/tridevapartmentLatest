import express from 'express';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Owner from '../models/Owner.js';
import Premium from '../models/Premium.js';
import Settings from '../models/Settings.js';


const router = express.Router();

// Get aggregated report data
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const months = [];
        let currentMonthIter = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonthStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
        
        while (true) {
            const currentStr = `${currentMonthIter.getFullYear()}-${String(currentMonthIter.getMonth() + 1).padStart(2, '0')}`;
            months.push(currentStr);
            if (currentStr === endMonthStr) break;
            currentMonthIter.setMonth(currentMonthIter.getMonth() + 1);
            if (months.length > 60) break;
        }

        // 1. Flat-wise Payment Details
        const paymentData = await Payment.aggregate([
            {
                $match: {
                    month: { $in: months }
                }
            },
            {
                $group: {
                    _id: '$owner',
                    totalPaid: { $sum: '$amount' },
                    adjustmentCount: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'Adjustment'] }, 1, 0] } },
                    transactions: { 
                        $push: { 
                            amount: '$amount', 
                            date: '$transactionDate', 
                            method: '$paymentMethod',
                            month: '$month',
                            isAdjustment: { $eq: ['$paymentMethod', 'Adjustment'] },
                            notes: '$notes'
                        } 
                    }
                }
            },
            {
                $lookup: {
                    from: 'owners',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'ownerDetails'
                }
            },
            { $unwind: '$ownerDetails' },
            {
                $project: {
                    _id: 1,
                    totalPaid: 1,
                    adjustmentCount: 1,
                    transactions: 1,
                    flatNumber: '$ownerDetails.flatNumber',
                    ownerName: '$ownerDetails.ownerName'
                }
            },
            { $sort: { flatNumber: 1 } }
        ]);

        // Explicitly sort transactions within each payment record by month then date
        paymentData.forEach(p => {
            p.transactions.sort((a, b) => {
                const monthComp = a.month.localeCompare(b.month);
                if (monthComp !== 0) return monthComp;
                return new Date(a.date) - new Date(b.date);
            });
        });

        // 2. Month-wise Expense Totals
        const expenseData = await Expense.aggregate([
            {
                $match: {
                    month: { $in: months }
                }
            },
            {
                $group: {
                    _id: '$month',
                    totalExpense: { $sum: '$amount' },
                    categories: {
                        $push: {
                            category: '$category',
                            amount: '$amount',
                            date: '$expenseDate'
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.setHeader('X-Report-Logic', 'month-wise-v1.3');
        res.json({
            payments: paymentData,
            expenses: expenseData,
            lastDeploy: '2026-04-05T12:35'
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get month-wise defaulter and paid status report
router.get('/defaulters', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start and end dates are required' });
        }

        // Parse dates and get list of months in range
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const months = [];
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
        
        while (true) {
            const currentStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            months.push(currentStr);
            if (currentStr === endMonth) break;
            current.setMonth(current.getMonth() + 1);
            if (months.length > 60) break;
        }

        // Fetch all data in bulk to avoid N*M query problem
        const [owners, allPremiums, allPayments, setting] = await Promise.all([
            Owner.find().sort({ flatNumber: 1 }).lean(),
            Premium.find({ month: { $in: months } }).lean(),
            Payment.find({ month: { $in: months } }).lean(),
            Settings.findOne({ key: 'defaultPremium' })
        ]);

        const globalPremium = setting ? setting.value : 600;

        // Create lookup maps for fast access
        const premiumMap = {}; // key: ownerId-month
        allPremiums.forEach(p => {
            premiumMap[`${p.owner.toString()}-${p.month}`] = p.expectedAmount;
        });

        const paymentMap = {}; // key: ownerId-month -> { paid, hasAdjustment }
        allPayments.forEach(p => {
            const key = `${p.owner.toString()}-${p.month}`;
            if (!paymentMap[key]) {
                paymentMap[key] = { paid: 0, hasAdjustment: false };
            }
            paymentMap[key].paid += p.amount;
            if (p.isAdjustment || p.paymentMethod === 'Adjustment') {
                paymentMap[key].hasAdjustment = true;
            }
        });

        const results = owners.map(owner => {
            const monthlyStatus = {};
            const ownerId = owner._id.toString();

            months.forEach(month => {
                const key = `${ownerId}-${month}`;
                const explicitExpected = premiumMap[key];
                const expected = explicitExpected !== undefined ? explicitExpected : globalPremium;
                
                const paidData = paymentMap[key] || { paid: 0, hasAdjustment: false };
                const paid = paidData.paid;
                const hasAdjustment = paidData.hasAdjustment;

                let status = 'No Bill';
                if (expected > 0) {
                    if (hasAdjustment) status = 'Adjusted';
                    else if (paid >= expected) status = 'Paid';
                    else if (paid > 0) status = 'Partial';
                    else status = 'Defaulter';
                } else if (hasAdjustment) {
                    status = 'Adjusted';
                } else if (paid > 0) {
                    status = 'Paid'; 
                }

                monthlyStatus[month] = {
                    status,
                    paid,
                    expected,
                    shortfall: Math.max(0, expected - paid),
                    hasAdjustment
                };
            });

            return {
                _id: owner._id,
                flatNumber: owner.flatNumber,
                ownerName: owner.ownerName,
                monthlyStatus
            };
        });

        res.json({ months, data: results });
    } catch (error) {
        console.error('Defaulters report error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;

