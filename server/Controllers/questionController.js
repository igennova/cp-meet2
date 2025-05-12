import Question from "../Models/question.js";
// import fs from 'fs';

const getRandomQuestion = async (req, res) => {
  try {
    const randomQuestion = await Question.aggregate([{ $sample: { size: 1 } }]);

    if (randomQuestion.length) {
      res.json(randomQuestion[0]);
    } else {
      res.status(404).json({ message: "No questions found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Function to get all questions (example)
const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
const getQuestionById = async (req, res) => {
  try {
    const problemId = req.query.problemId;
    console.log(problemId);
    const question = await Question.findOne({ question_id: problemId });

    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ message: "Question not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Export multiple functions
export default getQuestionById;
