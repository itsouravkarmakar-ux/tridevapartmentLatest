import express from 'express';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Owner from '../models/Owner.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Get summary for a specific month or overall
router.get('/', async (req, res) => {
    try {
        const { month } = req.query; // format YYYY-MM

        // Filter by month if provided
        let paymentFilter = {};
        let expenseFilter = {};
        if (month) {
            paymentFilter.month = month;
            expenseFilter.month = month;
        }

        // 1. Total payments received
        const payments = await Payment.aggregate([
            { $match: paymentFilter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalReceived = payments.length > 0 ? payments[0].total : 0;

        // 2. Total expenses incurred
        const expenses = await Expense.aggregate([
            { $match: expenseFilter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

        // Fetch initial balance setting
        const setting = await Settings.findOne({ key: 'initialBalance' });
        const initialBalance = setting ? setting.value : 0;

        // Overall Remaining Balance = Initial + Total Received - Total Expenses
        let remainingBalance = initialBalance + totalReceived - totalExpenses;

        // If month specific, we might still want the overall lifetime balance
        let lifetimeBalance = 0;
        let lifetimeReceived = 0;
        let monthlyBreakdown = [];

        if (month) {
            const allExpenses = await Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
            const allE = allExpenses.length > 0 ? allExpenses[0].total : 0;
            const allPayments = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
            const allP = allPayments.length > 0 ? allPayments[0].total : 0;
            
            lifetimeReceived = allP;
            lifetimeBalance = initialBalance + allP - allE;
        } else {
            const allPayments = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
            lifetimeReceived = allPayments.length > 0 ? allPayments[0].total : 0;
            lifetimeBalance = remainingBalance;
        }

        // Calculate monthly breakdown
        const monthlyPayments = await Payment.aggregate([
            {
                $group: {
                    _id: '$month',
                    totalReceived: { $sum: '$amount' }
                }
            }
        ]);

        const monthlyExpenses = await Expense.aggregate([
            {
                $group: {
                    _id: '$month',
                    totalExpenses: { $sum: '$amount' }
                }
            }
        ]);

        // Merge monthly data
        const breakdownMap = new Map();
        monthlyPayments.forEach(p => {
            breakdownMap.set(p._id, { month: p._id, totalReceived: p.totalReceived, totalExpenses: 0 });
        });
        monthlyExpenses.forEach(e => {
            if (breakdownMap.has(e._id)) {
                breakdownMap.get(e._id).totalExpenses = e.totalExpenses;
            } else {
                breakdownMap.set(e._id, { month: e._id, totalReceived: 0, totalExpenses: e.totalExpenses });
            }
        });

        // Convert to array and sort descending by month (YYYY-MM)
        monthlyBreakdown = Array.from(breakdownMap.values()).sort((a, b) => b.month.localeCompare(a.month));

        res.json({
            month: month || 'All Time',
            initialBalance,
            totalReceived,
            totalExpenses,
            remainingBalance,
            lifetimeBalance, // useful if month is passed
            lifetimeReceived,
            monthlyBreakdown
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
