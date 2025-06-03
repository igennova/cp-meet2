import session from "express-session";
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  secret: process.env.COOKIE_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction, // Only use HTTPS in production
    sameSite: isProduction ? 'none' : 'lax', // Required for cross-site cookies in production
    domain: isProduction ? '.vercel.app' : undefined // Allow cookies on vercel.app subdomains
  }
});

export default sessionMiddleware; 