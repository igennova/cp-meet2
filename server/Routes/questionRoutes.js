import express from "express";
const router = express.Router();
import getQuestionById from "../Controllers/questionController.js";

router.get("/questions", getQuestionById);

export default router;
