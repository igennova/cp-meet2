import express from 'express';
import { getProfile, updateProfile } from '../Controllers/profileController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Profile routes
router.get('/', verifyToken, getProfile);
router.put('/update', verifyToken, updateProfile);

// Add social link

export default router; 