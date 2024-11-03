import express from "express";
const router = express.Router();
import getRandomQuestion from "../controllers/questionController.js";

router.get("/questions", getRandomQuestion);

export default router;
