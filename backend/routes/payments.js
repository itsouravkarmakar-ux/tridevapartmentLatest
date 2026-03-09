import express from 'express';
import Payment from '../models/Payment.js';
import Owner from '../models/Owner.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all payments (optional: filter by month)
router.get('/', async (req, res) => {
    try {
        const { month } = req.query; // format YYYY-MM
        let filter = {};
        if (month) filter.month = month;

        const payments = await Payment.find(filter).populate('owner').sort({ transactionDate: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new payment (Admin Only)
router.post('/', authMiddleware, async (req, res) => {
    const { owner, amount, paymentMethod, transactionDate, month, notes } = req.body;

    if (!owner || !amount || !month) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const payment = new Payment({ owner, amount, month, paymentMethod, notes });
        const savedPayment = await payment.save();

        // Decrease the due amount for this owner if they pay
        // Assuming currentDue tracks outstanding dues
        const ownerDoc = await Owner.findById(owner);
        if (ownerDoc) {
            ownerDoc.currentDue -= amount;
            await ownerDoc.save();
        }

        res.status(201).json(savedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
