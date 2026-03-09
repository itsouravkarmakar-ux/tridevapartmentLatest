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
        const initialBalance = setting ? setting.value : 50557;

        // Overall Remaining Balance = Initial + Total Received - Total Expenses
        let remainingBalance = totalReceived - totalExpenses;
        if (!month) {
            remainingBalance += initialBalance;
        }

        // If month specific, we might still want the overall lifetime balance
        let lifetimeBalance = 0;
        if (month) {
            const allPayments = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
            const allExpenses = await Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
            const allP = allPayments.length > 0 ? allPayments[0].total : 0;
            const allE = allExpenses.length > 0 ? allExpenses[0].total : 0;
            lifetimeBalance = initialBalance + allP - allE;
        } else {
            lifetimeBalance = remainingBalance;
        }

        res.json({
            month: month || 'All Time',
            initialBalance,
            totalReceived,
            totalExpenses,
            remainingBalance,
            lifetimeBalance, // useful if month is passed
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
