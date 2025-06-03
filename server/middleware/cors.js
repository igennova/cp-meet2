import cors from "cors";
import * as dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  "https://cp-buddy-t80e.onrender.com", 
  "http://localhost:3000",
  "https://cp-nextjs-iota.vercel.app"
];

const corsMiddleware = cors({
  origin: function(origin, callback) {
    console.log('Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

export default corsMiddleware; 