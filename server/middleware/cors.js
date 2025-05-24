import cors from "cors";

const corsMiddleware = cors({
  origin: ["https://cp-buddy-t80e.onrender.com", "http://localhost:3000"],
  credentials: true
});

export default corsMiddleware; 