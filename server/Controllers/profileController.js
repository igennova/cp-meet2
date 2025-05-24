import User from '../Models/User.js';

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-googleId');
        res.json(user);
    } catch (error) {
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