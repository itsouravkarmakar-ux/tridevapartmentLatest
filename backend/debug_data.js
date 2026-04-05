import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
}

const PaymentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    amount: Number,
    month: String,
    isAdjustment: Boolean,
    adjustmentBill: String,
    notes: String,
    transactionDate: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', PaymentSchema);

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const payments = await Payment.find({ isAdjustment: true });
        console.log(`Found ${payments.length} adjustments.`);

        payments.forEach((p, i) => {
            console.log(`\nAdjustment ${i + 1}:`);
            console.log(`ID: ${p._id}`);
            console.log(`Owner: ${p.owner}`);
            console.log(`Month: ${p.month}`);
            console.log(`Has Bill: ${!!p.adjustmentBill}`);
            if (p.adjustmentBill) {
                console.log(`Bill Type: ${typeof p.adjustmentBill}`);
                console.log(`Bill Length: ${p.adjustmentBill.length}`);
                console.log(`Bill Start: ${p.adjustmentBill.substring(0, 50)}...`);
            }
        });

        // Test the aggregation pipeline
        const month = payments.length > 0 ? payments[0].month : null;
        if (month) {
            console.log(`\nTesting aggregation for month: ${month}`);
            const agg = await Payment.aggregate([
                { $match: { month } },
                { $group: { 
                    _id: '$owner', 
                    hasAdjustment: { $max: { $cond: ['$isAdjustment', true, false] } },
                    adjustmentBill: { $max: '$adjustmentBill' },
                } }
            ]);
            console.log('Aggregation result (first 2):', JSON.stringify(agg.slice(0, 2), null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkData();
