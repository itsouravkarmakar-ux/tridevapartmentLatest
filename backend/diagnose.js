import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PaymentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    amount: Number,
    month: String,
    transactionDate: Date,
    paymentMethod: String
});
const OwnerSchema = new mongoose.Schema({
    flatNumber: String,
    ownerName: String
});

const Payment = mongoose.model('PaymentDiags', PaymentSchema, 'payments');
const Owner = mongoose.model('OwnerDiags', OwnerSchema, 'owners');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- DIAGNOSTIC START ---');
    
    const owners = await Owner.find({ flatNumber: { $in: ['1A', '1B'] } });
    for (const owner of owners) {
        const payments = await Payment.find({ owner: owner._id }).sort({ month: 1 });
        console.log(`\nOwner: ${owner.flatNumber} (${owner.ownerName})`);
        payments.forEach(p => {
            console.log(`- Month: [${p.month}] Amt: ${p.amount} Date: ${p.transactionDate ? p.transactionDate.toISOString().split('T')[0] : 'None'}`);
        });
    }
    
    console.log('\n--- DIAGNOSTIC END ---');
    await mongoose.disconnect();
}
run();
