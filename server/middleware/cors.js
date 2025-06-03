import cors from "cors";
import * as dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  "https://cp-buddy-t80e.onrender.com", 
  "http://localhost:3000",
  "https://cp-nextjs-iota.vercel.app"
];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log('Request from same origin or without origin header');
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log('Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware; 