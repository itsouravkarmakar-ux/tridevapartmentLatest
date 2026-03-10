import express from 'express';
import ActionItem from '../models/ActionItem.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all action items
router.get('/', async (req, res) => {
    try {
        const items = await ActionItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new action item (Admin Only)
router.post('/', auth, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ message: "Title is required" });

        const newItem = new ActionItem({ title });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an action item (e.g. mark as completed, edit title) (Admin Only)
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;

        const updatedItem = await ActionItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedItem) return res.status(404).json({ message: "Action Item not found" });

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
