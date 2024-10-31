import express from "express";
const router = express.Router();
import getcode from "../Controllers/judge0.js";
router.post("/getcode", getcode);
export default router;
