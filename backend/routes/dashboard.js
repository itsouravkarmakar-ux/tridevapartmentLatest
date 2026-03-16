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

        // Define match stages to filter by month if passed
        const paymentMatch = month ? { $match: { month } } : { $match: {} };
        const expenseMatch = month ? { $match: { month } } : { $match: {} };

        // Run independent aggregations concurrently to speed up response time
        const [
            paymentsResult,
            expensesResult,
            setting,
            allPaymentsResult,
            allExpensesResult,
            monthlyPayments,
            monthlyExpenses
        ] = await Promise.all([
            // 1. Total payments for current view
            Payment.aggregate([paymentMatch, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            
            // 2. Total expenses for current view
            Expense.aggregate([expenseMatch, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            
            // 3. Initial balance setting
            Settings.findOne({ key: 'initialBalance' }),
            
            // 4. Lifetime payments (needed regardless of month filter)
            Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
            
            // 5. Lifetime expenses (needed regardless of month filter)
            Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
            
            // 6. Monthly breakdown of payments
            Payment.aggregate([{ $group: { _id: '$month', totalReceived: { $sum: '$amount' } } }]),
            
            // 7. Monthly breakdown of expenses
            Expense.aggregate([{ $group: { _id: '$month', totalExpenses: { $sum: '$amount' } } }])
        ]);

        // Extract values handling empty results safely
        const totalReceived = paymentsResult.length > 0 ? paymentsResult[0].total : 0;
        const totalExpenses = expensesResult.length > 0 ? expensesResult[0].total : 0;
        const initialBalance = setting ? setting.value : 0;
        
        const lifetimeReceived = allPaymentsResult.length > 0 ? allPaymentsResult[0].total : 0;
        const lifetimeExpenses = allExpensesResult.length > 0 ? allExpensesResult[0].total : 0;

        // Overall Remaining Balance calculation
        const remainingBalance = initialBalance + totalReceived - totalExpenses;
        const lifetimeBalance = initialBalance + lifetimeReceived - lifetimeExpenses;

        // Merge monthly data for the breakdown table
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

        // Convert to array and sort descending (latest month first)
        const monthlyBreakdown = Array.from(breakdownMap.values()).sort((a, b) => b.month.localeCompare(a.month));

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
