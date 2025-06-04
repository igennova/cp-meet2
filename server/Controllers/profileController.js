import User from '../Models/user.js';
import { UserRating, Match } from '../Models/rating.js';

// Get user profile
export const getProfile = async (req, res) => {
    try {
        // Log the incoming request user object
        console.log('Request user object:', req.user);
        
        if (!req.user || !req.user._id) {
            console.error('No user ID in request:', req.user);
            return res.status(401).json({ message: 'User ID not found in request' });
        }

        // Get user profile data
        const user = await User.findById(req.user._id).select('-googleId');
        if (!user) {
            console.error('User not found in database:', req.user._id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Found user:', user);

        // Get user rating data
        const rating = await UserRating.findOne({ userId: req.user._id });
        console.log('User rating data:', rating);

        // Get recent matches
        const matches = await Match.find({ 
            'participants.userId': req.user._id 
        })
        .populate('questionId', 'title difficulty')
        .sort({ matchDate: -1 })
        .limit(5);

        // Combine all data into a single response object
        const response = {
            profile: {
                id: user._id,
                displayName: user.displayName,
                email: user.email,
                profilePicture: user.profilePicture,
                social: user.social || []
            },
            rating: rating ? {
                currentRating: rating.ratings.BLITZ_2MIN.current,
                peakRating: rating.ratings.BLITZ_2MIN.peak,
                wins: rating.overall.wins,
                losses: rating.overall.losses,
                winRate: rating.overall.winRate,
                draws: rating.overall.draws,
                matchesPlayed: rating.ratings.BLITZ_2MIN.matches,
                ratingHistory: rating.ratingHistory || []
            } : null,
            matchHistory: {
                matches: matches || []
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ 
            message: 'Error fetching profile', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
// Update user profile - handles all profile updates
export const updateProfile = async (req, res) => {
    try {
        const { displayName, email, social } = req.body;
        const user = await User.findById(req.user._id);
        
        // Update basic profile info
        if (displayName) user.displayName = displayName;
        
        // Update social links if provided
        if (social && Array.isArray(social)) {
            // Validate each social link
            const validSocial = social.every(item => 
                item.platform && item.url && 
                typeof item.platform === 'string' && 
                typeof item.url === 'string'
            );

            if (!validSocial) {
                return res.status(400).json({ 
                    message: 'Invalid social links format. Each link must have platform and url' 
                });
            }

            // Update social links
            user.social = social;
        }
        
        await user.save();
        res.json({ 
            message: 'Profile updated successfully', 
            user: {
                displayName: user.displayName,
                email: user.email,
                social: user.social
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
}; 