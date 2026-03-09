import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true // Format: 'YYYY-MM'
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer'],
        default: 'UPI'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
