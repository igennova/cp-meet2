import cors from "cors";
import * as dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  "https://cp-buddy-t80e.onrender.com", 
  "http://localhost:3000",
  "https://cp-nextjs-iota.vercel.app"
];

const isProduction = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: function(origin, callback) {
    // Allow WebSocket connections (origin is undefined in WebSocket)
    // Also allow same-origin requests (origin is null)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
};

// Apply different settings for development and production
if (isProduction) {
  corsOptions.cookie = {
    sameSite: 'none',
    secure: true,
    httpOnly: true
  };
}

const corsMiddleware = cors(corsOptions);

export default corsMiddleware; 