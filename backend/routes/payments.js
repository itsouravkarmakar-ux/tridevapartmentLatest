import express from 'express';
import Payment from '../models/Payment.js';
import Owner from '../models/Owner.js';
import Premium from '../models/Premium.js';
import authMiddleware from '../middleware/auth.js';
import multer from 'multer';

// Configure multer for file uploads in memory (for serverless compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// Add a premium adjustment (Admin Only)
router.post('/adjust', authMiddleware, upload.single('bill'), async (req, res) => {
    console.log('[DEBUG] Hit /adjust route! Body:', req.body, 'File:', req.file ? req.file.originalname : 'None');
    const { owner, month, notes } = req.body;

    if (!owner || !month) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const paymentData = {
            owner,
            amount: 0,
            month,
            paymentMethod: 'Adjustment',
            isAdjustment: true,
            notes
        };

        if (req.file) {
            const base64Data = req.file.buffer.toString('base64');
            paymentData.adjustmentBill = `data:${req.file.mimetype};base64,${base64Data}`;
        }

        const payment = new Payment(paymentData);
        const savedPayment = await payment.save();

        // Ensure expected premium is set to 0 to remove defaulter status
        await Premium.findOneAndUpdate(
            { owner, month },
            { expectedAmount: 0 },
            { upsert: true }
        );

        res.status(201).json(savedPayment);
    } catch (error) {
        console.error('Adjust error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Get adjustment bill for a specific owner and month
router.get('/adjustment/:ownerId/:month', async (req, res) => {
    try {
        const { ownerId, month } = req.params;
        const adjustment = await Payment.findOne({
            owner: ownerId,
            month,
            isAdjustment: true
        }).sort({ transactionDate: -1 });

        if (!adjustment || !adjustment.adjustmentBill) {
            return res.status(404).json({ message: 'Adjustment bill not found' });
        }

        res.json({ adjustmentBill: adjustment.adjustmentBill });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
