import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Owner from './models/Owner.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        const updates = {
            '1A': 'NA',
            '1B': 'Gopal Karmakar',
            '2A': 'Gautam kundu',
            '2B': 'Ranjit Saha',
            '3A': 'Tapas Saha',
            '3B': 'Satadal Saha',
            'GA': 'NA',
            'GB': 'NA'
        };

        for (const [flatNumber, ownerName] of Object.entries(updates)) {
            await Owner.findOneAndUpdate(
                { flatNumber },
                { ownerName },
                { new: true, upsert: false }
            );
        }

        console.log('Update complete');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
