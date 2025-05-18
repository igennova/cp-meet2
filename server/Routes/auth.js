import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Auth with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google auth callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
    (req, res) => {
        // Redirect to frontend after successful login
        res.redirect('http://localhost:3000');
    }
);

// Auth logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.redirect('http://localhost:3000');
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