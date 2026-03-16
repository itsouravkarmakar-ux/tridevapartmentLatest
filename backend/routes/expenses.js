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
                    hasBill: { 
                        $cond: { 
                            if: { $and: [ { $ne: ["$billUrl", null] }, { $ne: ["$billUrl", ""] } ] }, 
                            then: true, 
                            else: false 
                        } 
                    }
                }
            }
        ]);
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bill for a specific expense
router.get('/:id/bill', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id).select('billUrl');
        if (!expense || !expense.billUrl) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        res.json({ billUrl: expense.billUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new expense (Admin Only)
router.post('/', authMiddleware, upload.single('billImage'), async (req, res) => {
    const { category, amount, month, description, expenseDate } = req.body;

    if (!category || !amount || !month) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const expenseData = { category, amount, month, description };
        
        if (expenseDate) {
            expenseData.expenseDate = new Date(expenseDate);
        }

        if (req.file) {
            const base64Data = req.file.buffer.toString('base64');
            expenseData.billUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        }

        const expense = new Expense(expenseData);
        const savedExpense = await expense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an expense (Admin Only) - allows modifying all fields and uploading new bill
router.put('/:id', authMiddleware, upload.single('billImage'), async (req, res) => {
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

        if (req.file) {
            const base64Data = req.file.buffer.toString('base64');
            updateData.billUrl = `data:${req.file.mimetype};base64,${base64Data}`;
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

export default router;
