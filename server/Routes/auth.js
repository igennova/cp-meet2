import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../Models/user.js';
import { UserRating } from '../Models/rating.js';
import { generateToken } from '../middleware/auth.js';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign In
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { sub: googleId, email, name: displayName, picture: profilePicture } = ticket.getPayload();

        // Check if user exists
        let user = await User.findOne({ googleId });

        if (!user) {
            // Create new user
            user = await new User({
                googleId,
                email,
                displayName,
                profilePicture
            }).save();

            // Initialize rating for new user
            const newRating = new UserRating({
                userId: user._id,
                ratings: {
                    BLITZ_2MIN: {
                        current: 1000,
                        peak: 1000,
                        matches: 0
                    },
                    RAPID_8MIN: {
                        current: 1000,
                        peak: 1000,
                        matches: 0
                    },
                    CLASSIC_12MIN: {
                        current: 1000,
                        peak: 1000,
                        matches: 0
                    }
                },
                overall: {
                    wins: 0,
                    losses: 0,
                    winRate: 0
                }
            });
            await newRating.save();
        }

        // Generate JWT
        const jwtToken = generateToken(user);

        res.json({
            token: jwtToken,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
});

// Get current user
router.get('/current_user', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).select('-googleId');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export default router; 