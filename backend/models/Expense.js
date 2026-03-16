import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['Lift Maintenance', 'Swipper Cost', 'Electricity', 'Water', 'Repairs', 'Others']
    },
    amount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true // Format: 'YYYY-MM'
    },
    expenseDate: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    },
    bills: [{
        type: String // Optional paths to uploaded bill images
    }]
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
