import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import express from 'express';
import supertest from 'supertest';
import app from './server.js';

dotenv.config();

async function run() {
    const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' }
    );

    console.log('Testing upload...');
    const res = await supertest(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .field('category', 'Others')
        .field('amount', 50)
        .field('month', '2026-03')
        .field('expenseDate', '2026-03-16')
        .attach('billImages', Buffer.from('dummy image content 1'), 'dummy1.png')
        .attach('billImages', Buffer.from('dummy image content 2'), 'dummy2.png');
    
    console.log('Response Status:', res.status);
    console.log('Response Body:', res.body);
    process.exit(0);
}

run().catch(console.dir);
