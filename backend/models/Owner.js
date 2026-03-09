import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
    flatNumber: {
        type: String,
        required: true,
        unique: true,
        enum: ['GA', 'GB', '1A', '1B', '2A', '2B', '3A', '3B']
    },
    ownerName: {
        type: String,
        default: 'Unknown'
    },
    phone: {
        type: String,
        default: ''
    },
    currentDue: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('Owner', ownerSchema);
