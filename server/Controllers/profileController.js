import User from '../Models/User.js';
import { UserRating,Match } from '../Models/rating.js';

// Get user profile
export const getProfile = async (req, res) => {
    try {
        // Get user profile data
        const user = await User.findById(req.user._id).select('-googleId');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user rating data
        const rating = await UserRating.findOne({ userId: req.user._id });

        // Get recent matches, limit to 5
        const matches = await Match.find({ 
            'participants.userId': req.user._id 
        })
        .populate('questionId', 'title difficulty') // Populate question details
        .sort({ matchDate: -1 })
        .limit(5);
        console.log(matches);
        console.log(rating);

        // Combine all data into a single response object
        const response = {
            profile: {
                displayName: user.displayName,
                email: user.email,
                profilePicture: user.profilePicture,
                social: user.social || []
            },
            rating: rating ? {
                currentRating: rating.ratings.BLITZ_2MIN.current,
                peakRating: rating.ratings.BLITZ_2MIN.peak,
                
                wins: rating.wins,
                losses: rating.losses,
                winRate: rating.winRate,
                draw: rating.draws,    
                matchesPlayed: rating.matchesPlayed,
                ratingHistory: rating.ratingHistory || []
            } : null,
            matchHistory: {
                matches: matches || []
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
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