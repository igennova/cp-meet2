import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture
    }, 
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded);
      req.user = {
        _id: decoded.id,  // Make sure this matches what you set in generateToken
        email: decoded.email,
        displayName: decoded.displayName,
        profilePicture: decoded.profilePicture
      };
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error in auth middleware' });
  }
}; 