import session from "express-session";
import MongoStore from "connect-mongo";
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const sessionMiddleware = session({
  secret: process.env.COOKIE_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URL,
    ttl: 24 * 60 * 60, // Session TTL in seconds (24 hours)
    autoRemove: 'native',  // Use MongoDB's TTL index
    touchAfter: 24 * 3600 // Only update the session every 24 hours unless the data changes
  }),
  proxy: isProduction, // Trust the reverse proxy when in production
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction, // Only use HTTPS in production
    sameSite: isProduction ? 'none' : 'lax',
    httpOnly: true,
    path: '/'
  }
});

export default sessionMiddleware; 