import mongoose from 'mongoose';

async function checkDb() {
    await mongoose.connect('mongodb+srv://sourav:sourav@cluster0.svo7uss.mongodb.net/test?appName=Cluster0');

    // Check initialBalance
    const settings = await mongoose.connection.collection('settings').findOne({ key: 'initialBalance' });
    console.log('Settings:', settings);

    // Check sums
    const payments = await mongoose.connection.collection('payments').aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]).toArray();
    console.log('Payments:', payments);

    const expenses = await mongoose.connection.collection('expenses').aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]).toArray();
    console.log('Expenses:', expenses);

    process.exit(0);
}

checkDb();
