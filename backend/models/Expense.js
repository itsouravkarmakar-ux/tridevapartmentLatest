import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    month: {
        type: String, // Format: 'YYYY-MM'
        required: true
    },
    expenseDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Add index for reporting efficiency
expenseSchema.index({ month: 1 });

export default mongoose.model('Expense', expenseSchema);
