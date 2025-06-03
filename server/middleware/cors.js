import cors from "cors";
import * as dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  "https://cp-buddy-t80e.onrender.com", 
  "http://localhost:3000",
  "https://cp-nextjs-iota.vercel.app"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware; 