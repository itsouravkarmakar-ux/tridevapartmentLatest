import express from 'express';
import jwt from 'jsonwebtoken';
import Settings from '../models/Settings.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { password } = req.body;
    let adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    try {
        const setting = await Settings.findOne({ key: 'adminPassword' });
        if (setting && setting.value) {
            adminPassword = setting.value;
        }
    } catch (err) {
        console.error('Failed to fetch password from settings', err);
    }

    if (password === adminPassword) {
        // Generate token
        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
        );
        res.json({ token, role: 'admin' });
    } else {
        res.status(401).json({ message: 'Invalid password' });
    }
});

export default router;
