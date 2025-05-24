import express from 'express';
import passport from 'passport';
import { getProfile, updateProfile } from '../Controllers/profileController.js';

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Please login first' });
};

// Profile routes
router.get('/', isAuthenticated, getProfile);
router.put('/update', isAuthenticated, updateProfile);

// Add social link
router.post('/social', isAuthenticated, async (req, res) => {
    try {
        const { platform, url } = req.body;
        
        if (!platform || !url) {
            return res.status(400).json({ message: 'Platform and URL are required' });
        }

        const user = await User.findById(req.user._id);
        
        // Check if platform already exists
        const existingPlatform = user.social.find(s => s.platform === platform);
        if (existingPlatform) {
            existingPlatform.url = url;
        } else {
            user.social.push({ platform, url });
        }
        
        await user.save();
        res.json({ message: 'Social link added successfully', social: user.social });
    } catch (error) {
        res.status(500).json({ message: 'Error adding social link', error: error.message });
    }
});

// Remove social link
router.delete('/social/:platform', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.social = user.social.filter(s => s.platform !== req.params.platform);
        await user.save();
        res.json({ message: 'Social link removed successfully', social: user.social });
    } catch (error) {
        res.status(500).json({ message: 'Error removing social link', error: error.message });
    }
});

export default router; 