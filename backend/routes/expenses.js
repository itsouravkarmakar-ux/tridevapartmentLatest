import express from 'express';
import multer from 'multer';
import path from 'path';
import Expense from '../models/Expense.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Get all expenses (optional: filter by month)
router.get('/', async (req, res) => {
    try {
        const { month } = req.query; // format YYYY-MM
        let filter = {};
        if (month) filter.month = month;

        const expenses = await Expense.find(filter).sort({ expenseDate: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new expense (Admin Only)
router.post('/', authMiddleware, upload.single('billImage'), async (req, res) => {
    const { category, amount, month, description } = req.body;

    if (!category || !amount || !month) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const expenseData = { category, amount, month, description };

        if (req.file) {
            expenseData.billUrl = `/uploads/${req.file.filename}`;
        }

        const expense = new Expense(expenseData);
        const savedExpense = await expense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
