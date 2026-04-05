import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const OwnerSchema = new mongoose.Schema({
    flatNumber: String,
    ownerName: String
});
const PaymentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    amount: Number,
    month: String,
    transactionDate: Date,
    paymentMethod: String
});

const Owner = mongoose.model('Owner', OwnerSchema);
const Payment = mongoose.model('Payment', PaymentSchema);

async function debug() {
    await mongoose.connect(MONGODB_URI);
    const owner = await Owner.findOne({ flatNumber: '1B' });
    console.log('Owner 1B:', JSON.stringify(owner, null, 2));
    
    if (owner) {
        const payments = await Payment.find({ owner: owner._id }).sort({ month: 1 });
        console.log('Payments for 1B:', JSON.stringify(payments, null, 2));
    }
    
    await mongoose.disconnect();
}

debug();
