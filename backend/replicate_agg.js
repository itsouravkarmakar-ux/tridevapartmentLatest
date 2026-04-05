import mongoose from 'mongoose';
import Payment from './models/Payment.js';
import Owner from './models/Owner.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAggregation() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const startDate = '2025-11-30';
    const endDate = '2026-03-16';

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log(`Aggregating from ${start.toISOString()} to ${end.toISOString()}`);

    const results = await Payment.aggregate([
        {
            $match: {
                transactionDate: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: '$owner',
                totalPaid: { $sum: '$amount' },
                adjustmentCount: { $sum: { $cond: [{ $or: [{ $eq: ['$isAdjustment', true] }, { $eq: ['$paymentMethod', 'Adjustment'] }] }, 1, 0] } },
                transactions: { 
                    $push: { 
                        amount: '$amount', 
                        date: '$transactionDate', 
                        method: '$paymentMethod',
                        month: '$month',
                        isAdjustment: { $or: [{ $eq: ['$isAdjustment', true] }, { $eq: ['$paymentMethod', 'Adjustment'] }] },
                        notes: '$notes'
                    } 
                }
            }
        }
    ]);

    const satadal = results.find(r => r._id.toString() === '69aea32a7c8721828938aab9');
    if (satadal) {
        console.log('Found Satadal in aggregation result:');
        console.log(`Total Paid: ${satadal.totalPaid}`);
        console.log(`Adjustment Count: ${satadal.adjustmentCount}`);
        console.log(`Transactions found: ${satadal.transactions.length}`);
        satadal.transactions.forEach((t, i) => {
            console.log(`  [${i}] ${t.month} - ${t.method} Amt: ${t.amount} isAdj: ${t.isAdjustment} Date: ${t.date}`);
        });
    } else {
        console.log('Satadal not found in result');
    }

    process.exit(0);
}

checkAggregation();
