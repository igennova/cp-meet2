import express from 'express';
import {
    getUserRating,
    getLeaderboard,
    getMatchHistory,
    submitMatchResult,
    initializeUserRating
} from '../Controllers/ratingController.js';
import { Match, UserRating } from '../Models/rating.js';

const router = express.Router();

// Get user rating and statistics
router.get('/user/:userId', getUserRating);

// Initialize user rating (useful for new users)
router.post('/user/:userId/initialize', async (req, res) => {
    try {
        const { userId } = req.params;
        const rating = await initializeUserRating(userId);
        res.json({
            message: 'User rating initialized successfully',
            rating
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Submit match result
router.post('/match', submitMatchResult);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Get match history for a user
router.get('/user/:userId/matches', getMatchHistory);

// Get rating statistics overview
router.get('/stats/overview', async (req, res) => {
    try {
        const totalUsers = await UserRating.countDocuments();
        const totalMatches = await Match.countDocuments();
        const avgRating = await UserRating.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$currentRating' } } }
        ]);
        
        const topRating = await UserRating.findOne()
            .sort({ currentRating: -1 })
            .populate('userId', 'displayName');

        res.json({
            totalUsers,
            totalMatches,
            averageRating: avgRating[0]?.avgRating || 1000,
            topPlayer: topRating
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;