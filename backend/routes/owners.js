import express from 'express';
import Owner from '../models/Owner.js';
import Premium from '../models/Premium.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Get all owners and their due status for a specific month
router.get('/', async (req, res) => {
    try {
        const { month } = req.query; // format YYYY-MM
        let owners = await Owner.find().sort({ flatNumber: 1 }).lean();

        if (month) {
            // Fetch global default premium
            const setting = await Settings.findOne({ key: 'defaultPremium' });
            const globalPremium = setting ? setting.value : 600; // Default to 600 if not set

            // Find expected premiums for this month
            const premiums = await Premium.find({ month }).lean();
            const premiumMap = premiums.reduce((acc, p) => ({ ...acc, [p.owner.toString()]: p.expectedAmount }), {});

            // Find actual payments for this month
            const payments = await Payment.aggregate([
                { $match: { month } },
                { $group: { _id: '$owner', totalPaid: { $sum: '$amount' } } }
            ]);
            const paymentMap = payments.reduce((acc, p) => ({ ...acc, [p._id.toString()]: p.totalPaid }), {});

            owners = owners.map(o => {
                const id = o._id.toString();
                // Use explicit premium if set, otherwise fallback to global standard premium
                const expected = premiumMap[id] !== undefined ? premiumMap[id] : globalPremium;
                const paid = paymentMap[id] || 0;
                const due = expected - paid;

                return {
                    ...o,
                    expectedPremium: expected,
                    isExplicitPremium: premiumMap[id] !== undefined,
                    paidAmount: paid,
                    currentDueForMonth: due,
                    isDefaulter: due > 0, // Paid less than expected
                    isPaid: due <= 0 && expected > 0
                };
            });
        }

        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Set premium for an owner for a specific month
router.post('/premium', async (req, res) => {
    const { owner, month, expectedAmount } = req.body;
    if (!owner || !month || expectedAmount === undefined) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const premium = await Premium.findOneAndUpdate(
            { owner, month },
            { expectedAmount },
            { new: true, upsert: true }
        );
        res.json(premium);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an owner (e.g., name or due)
router.put('/:id', async (req, res) => {
    try {
        const updatedOwner = await Owner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedOwner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Seed data manually if owners don't exist
router.post('/seed', async (req, res) => {
    try {
        const flats = ['GA', 'GB', '1A', '1B', '2A', '2B', '3A', '3B'];
        const count = await Owner.countDocuments();
        if (count === 0) {
            const inserted = await Owner.insertMany(
                flats.map(flat => ({ flatNumber: flat, ownerName: `Owner ${flat}` }))
            );
            res.status(201).json(inserted);
        } else {
            res.status(400).json({ message: 'Flats already seeded' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
