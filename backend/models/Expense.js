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
    billUrl: {
        type: String // Optional path to uploaded bill image
    }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
