import express from "express";
const router = express.Router();
import getcode from "../controllers/judge0.js";
router.post("/getcode", getcode);
export default router;
