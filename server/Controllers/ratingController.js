import { Match, UserRating } from '../Models/rating.js';
import User from '../Models/user.js';
// Temporary UUID replacement until uuid package is installedconst generateUuid = () => {    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {        const r = Math.random() * 16 | 0;        const v = c == 'x' ? r : (r & 0x3 | 0x8);        return v.toString(16);    });};

// ELO Rating calculation constants
const K_FACTOR = 32; // Standard K-factor for chess rating
const INITIAL_RATING = 1000;

/**
 * Calculate expected score for ELO rating
 * @param {number} ratingA - Rating of player A
 * @param {number} ratingB - Rating of player B
 * @returns {number} Expected score (0-1)
 */
const calculateExpectedScore = (ratingA, ratingB) => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Calculate new ELO rating
 * @param {number} currentRating - Current rating
 * @param {number} expectedScore - Expected score (0-1)
 * @param {number} actualScore - Actual score (1 for win, 0.5 for draw, 0 for loss)
 * @returns {number} New rating
 */
const calculateNewRating = (currentRating, expectedScore, actualScore) => {
    return Math.round(currentRating + K_FACTOR * (actualScore - expectedScore));
};

/**
 * Initialize user rating when they first join
 */
export const initializeUserRating = async (userId) => {
    try {
        const existingRating = await UserRating.findOne({ userId });
        if (existingRating) {
            return existingRating;
        }

        const newRating = new UserRating({
            userId,
            currentRating: INITIAL_RATING,
            peakRating: INITIAL_RATING,
            ratingHistory: [{
                rating: INITIAL_RATING,
                date: new Date(),
                matchId: 'initial'
            }]
        });

        await newRating.save();
        return newRating;
    } catch (error) {
        throw new Error(`Error initializing user rating: ${error.message}`);
    }
};

/**
 * Record a match result and update ratings
 */
export const recordMatchResult = async (matchData) => {
    const { participants, questionId, duration, matchType = 'coding_contest' } = matchData;
    
    try {
        // Validate participants
        if (!participants || participants.length !== 2) {
            throw new Error('Match must have exactly 2 participants');
        }

        const [player1, player2] = participants;
        
        // Get current ratings for both players
        const player1Rating = await UserRating.findOne({ userId: player1.userId }) || 
                             await initializeUserRating(player1.userId);
        const player2Rating = await UserRating.findOne({ userId: player2.userId }) || 
                             await initializeUserRating(player2.userId);

        // Calculate expected scores
        const expectedScore1 = calculateExpectedScore(player1Rating.currentRating, player2Rating.currentRating);
        const expectedScore2 = calculateExpectedScore(player2Rating.currentRating, player1Rating.currentRating);

        // Determine actual scores based on results
        let actualScore1, actualScore2;
        if (player1.result === 'win') {
            actualScore1 = 1;
            actualScore2 = 0;
        } else if (player2.result === 'win') {
            actualScore1 = 0;
            actualScore2 = 1;
        } else { // draw
            actualScore1 = 0.5;
            actualScore2 = 0.5;
        }

        // Calculate new ratings
        const newRating1 = calculateNewRating(player1Rating.currentRating, expectedScore1, actualScore1);
        const newRating2 = calculateNewRating(player2Rating.currentRating, expectedScore2, actualScore2);

        // Calculate rating changes
        const ratingChange1 = newRating1 - player1Rating.currentRating;
        const ratingChange2 = newRating2 - player2Rating.currentRating;

                // Create match record        const matchId = generateUuid();
        const match = new Match({
            matchId,
            participants: [
                {
                    userId: player1.userId,
                    result: player1.result,
                    ratingBefore: player1Rating.currentRating,
                    ratingAfter: newRating1,
                    ratingChange: ratingChange1
                },
                {
                    userId: player2.userId,
                    result: player2.result,
                    ratingBefore: player2Rating.currentRating,
                    ratingAfter: newRating2,
                    ratingChange: ratingChange2
                }
            ],
            questionId,
            duration,
            matchType
        });

        await match.save();

        // Update player 1 rating
        player1Rating.currentRating = newRating1;
        player1Rating.peakRating = Math.max(player1Rating.peakRating, newRating1);
        player1Rating.matchesPlayed += 1;
        player1Rating.lastMatchDate = new Date();
        
        if (player1.result === 'win') player1Rating.wins += 1;
        else if (player1.result === 'loss') player1Rating.losses += 1;
        else player1Rating.draws += 1;

        player1Rating.ratingHistory.push({
            rating: newRating1,
            matchId,
            date: new Date()
        });

        // Update player 2 rating
        player2Rating.currentRating = newRating2;
        player2Rating.peakRating = Math.max(player2Rating.peakRating, newRating2);
        player2Rating.matchesPlayed += 1;
        player2Rating.lastMatchDate = new Date();
        
        if (player2.result === 'win') player2Rating.wins += 1;
        else if (player2.result === 'loss') player2Rating.losses += 1;
        else player2Rating.draws += 1;

        player2Rating.ratingHistory.push({
            rating: newRating2,
            matchId,
            date: new Date()
        });

        // Save updated ratings
        await Promise.all([
            player1Rating.save(),
            player2Rating.save()
        ]);

        return {
            match,
            ratingChanges: {
                [player1.userId]: ratingChange1,
                [player2.userId]: ratingChange2
            }
        };

    } catch (error) {
        throw new Error(`Error recording match result: ${error.message}`);
    }
};

/**
 * Get user rating and statistics
 */
export const getUserRating = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userRating = await UserRating.findOne({ userId }).populate('userId', 'displayName email');
        
        if (!userRating) {
            return res.status(404).json({ message: 'User rating not found' });
        }

        res.json(userRating);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const leaderboard = await UserRating.find()
            .populate('userId', 'displayName email profilePicture')
            .sort({ currentRating: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await UserRating.countDocuments();

        res.json({
            leaderboard,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get match history for a user
 */
export const getMatchHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const matches = await Match.find({
            'participants.userId': userId
        })
        .populate('participants.userId', 'displayName email')
        .populate('questionId', 'title difficulty')
        .sort({ matchDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const total = await Match.countDocuments({
            'participants.userId': userId
        });

        res.json({
            matches,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Submit match result (API endpoint)
 */
export const submitMatchResult = async (req, res) => {
    try {
        const result = await recordMatchResult(req.body);
        res.json({
            message: 'Match result recorded successfully',
            ...result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}; 