import mongoose from 'mongoose';

const premiumSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    expectedAmount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true // Format: 'YYYY-MM'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Add compound index for fast premium lookups per flat/month
premiumSchema.index({ owner: 1, month: 1 });
premiumSchema.index({ month: 1 });

export default mongoose.model('Premium', premiumSchema);
