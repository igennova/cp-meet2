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

export default router; 