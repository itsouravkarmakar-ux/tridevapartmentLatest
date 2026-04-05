import mongoose from 'mongoose';
import Payment from './models/Payment.js';
import Owner from './models/Owner.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDetails() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find Satadal Saha
    const owner = await Owner.findOne({ ownerName: /Satadal/i });
    if (!owner) {
        console.log('Owner not found');
        process.exit(1);
    }
    console.log(`Checking details for ${owner.ownerName} (${owner.flatNumber}) - ID: ${owner._id}`);

    const payments = await Payment.find({ owner: owner._id }).sort({ transactionDate: -1 });
    console.log(`Total payments found in DB: ${payments.length}`);
    
    payments.forEach(p => {
        console.log(`- Month: ${p.month}, Amt: ${p.amount}, Date: ${p.transactionDate ? p.transactionDate.toISOString() : 'MISSING'}, Method: ${p.paymentMethod}, isAdj: ${p.isAdjustment}`);
    });

    process.exit(0);
}

checkDetails();
