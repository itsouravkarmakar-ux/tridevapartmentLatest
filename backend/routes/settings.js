import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// Get a setting by key
router.get('/:key', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        if (!setting) {
            if (req.params.key === 'initialBalance') {
                return res.json({ key: 'initialBalance', value: 50557 }); // Default
            }
            return res.status(404).json({ message: 'Setting not found' });
        }
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update or create a setting
router.put('/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const setting = await Settings.findOneAndUpdate(
            { key: req.params.key },
            { value },
            { new: true, upsert: true }
        );
        res.json(setting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
