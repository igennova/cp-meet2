import mongoose from "mongoose";

// Define the test case schema
const testCaseSchema = new mongoose.Schema({
  test_case_id: { type: String, required: true },
  input: { type: [String], required: true },
  expected_output: { type: String, required: true }
});

// Define the main question schema
const questionSchema = new mongoose.Schema({
  question_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  input_format: { type: [String], required: true },
  output_format: { type: String, required: true },
  constraints: {
    n_min: { type: Number, required: true },
    n_max: { type: Number, required: true }
  },
  example: {
    input: { type: [String], required: true },
    output: { type: String, required: true }
  },
  test_cases: [testCaseSchema]
});

// Create and export the model
const Question = mongoose.model('questions', questionSchema);
export default Question;
