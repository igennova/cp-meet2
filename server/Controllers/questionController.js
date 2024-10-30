import Question from "../Models/question.js";

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

// Export multiple functions
export default getRandomQuestion;
