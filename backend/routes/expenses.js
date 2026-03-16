import express from 'express';
import multer from 'multer';
import Expense from '../models/Expense.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads in memory (for serverless compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all expenses (optional: filter by month)
router.get('/', async (req, res) => {
    try {
        const { month } = req.query; // format YYYY-MM
        let filter = {};
        if (month) filter.month = month;

        const expenses = await Expense.aggregate([
            { $match: filter },
            { $sort: { expenseDate: -1 } },
            { 
                $project: {
                    category: 1,
                    amount: 1,
                    month: 1,
                    description: 1,
                    expenseDate: 1,
                    billCount: { $size: { $ifNull: ["$bills", []] } }
                }
            }
        ]);
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bills for a specific expense
router.get('/:id/bills', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id).select('bills');
        if (!expense || !expense.bills) {
            return res.status(404).json({ message: 'Bills not found' });
        }
        res.json({ bills: expense.bills });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new expense (Admin Only)
router.post('/', authMiddleware, upload.array('billImages'), async (req, res) => {
    const { category, amount, month, description, expenseDate } = req.body;

    if (!category || !amount || !month) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const expenseData = { category, amount, month, description };
        
        if (expenseDate) {
            expenseData.expenseDate = new Date(expenseDate);
        }

        if (req.files && req.files.length > 0) {
            expenseData.bills = req.files.map(file => {
                const base64Data = file.buffer.toString('base64');
                return `data:${file.mimetype};base64,${base64Data}`;
            });
        }

        const expense = new Expense(expenseData);
        const savedExpense = await expense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an expense (Admin Only) - allows modifying all fields and uploading new bill
router.put('/:id', authMiddleware, upload.array('billImages'), async (req, res) => {
    try {
        const { category, amount, month, description, expenseDate } = req.body;
        const updateData = {};
        if (category) updateData.category = category;
        if (amount) updateData.amount = amount;
        if (month) updateData.month = month;
        if (description !== undefined) updateData.description = description;
        if (expenseDate) {
            updateData.expenseDate = new Date(expenseDate);
        }

        if (req.files && req.files.length > 0) {
            updateData.bills = req.files.map(file => {
                const base64Data = file.buffer.toString('base64');
                return `data:${file.mimetype};base64,${base64Data}`;
            });
        }

        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        if (!updatedExpense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json(updatedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an expense (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
