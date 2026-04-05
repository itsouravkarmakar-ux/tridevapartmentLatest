import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Payment from './models/Payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const months = ['2025-12', '2026-01', '2026-02', '2026-03'];
    
    try {
        const paymentData = await Payment.aggregate([
            {
                $match: {
                    month: { $in: months }
                }
            },
            {
                $group: {
                    _id: '$owner',
                    totalPaid: { $sum: '$amount' },
                    transactions: { 
                        $push: { 
                            amount: '$amount', 
                            date: '$transactionDate', 
                            month: '$month'
                        } 
                    }
                }
            }
        ]);
        console.log('Aggregation successful. Count:', paymentData.length);
        
        paymentData.forEach(p => {
            if (p.transactions) {
                p.transactions.sort((a, b) => {
                    const monthComp = (a.month || "").localeCompare(b.month || "");
                    if (monthComp !== 0) return monthComp;
                    return new Date(a.date) - new Date(b.date);
                });
            }
        });
        console.log('Sorting successful.');
    } catch (err) {
        console.error('Aggregation failed:', err);
    }

    await mongoose.disconnect();
}
test();
