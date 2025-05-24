import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    social: [{
        platform: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }]
});

export default mongoose.model('User', userSchema); 