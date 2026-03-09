import mongoose from 'mongoose';

const premiumSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    month: {
        type: String,
        required: true // Format YYYY-MM
    },
    expectedAmount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Ensure distinct combination of owner and month
premiumSchema.index({ owner: 1, month: 1 }, { unique: true });

export default mongoose.model('Premium', premiumSchema);
