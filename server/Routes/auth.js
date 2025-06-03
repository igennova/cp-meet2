import { Router } from 'express';
import passport from 'passport';
import * as dotenv from 'dotenv';

dotenv.config();

const router = Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Auth with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google auth callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: `${CLIENT_URL}` }),
    (req, res) => {
        // Redirect to frontend after authentication (success or failure)
        res.redirect(CLIENT_URL);
    }
);

// Auth logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.redirect(CLIENT_URL);
    });
});

// Get current user
router.get('/current_user', (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

export default router; 