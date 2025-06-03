import session from "express-session";
import MongoStore from "connect-mongo";
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const sessionConfig = {
    secret: process.env.COOKIE_KEY || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        ttl: 24 * 60 * 60 // 24 hours
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        httpOnly: true,
        path: '/'
    }
};

// In production, trust the proxy
if (isProduction) {
    sessionConfig.proxy = true;
}

const sessionMiddleware = session(sessionConfig);

export default sessionMiddleware; 