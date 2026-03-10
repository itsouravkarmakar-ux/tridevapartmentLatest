import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    }
}, { timestamps: true });

export default mongoose.model('ActionItem', actionItemSchema);
