import Question from "../Models/question.js"; // Adjust path if needed
import fetch from "node-fetch"; // Ensure you have this package installed
import * as dotenv from "dotenv";
dotenv.config()

// const arr = {
//     "C++ (GCC 14.1.0)": 105,
//     "Python (3.12.5)": 100
// };

const getcode = async (req, res) => {
  const { problem_id, source_code, language_id } = req.body;

  // Validate input
  if (!problem_id || !source_code || !language_id) {
    return res
      .status(400)
      .json({ message: "Missing problem_id, source_code, or language_id" });
  }

  try {
    // Fetch problem data from MongoDB
    const problemData = await Question.findOne({ question_id: problem_id });

    if (!problemData) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Prepare submissions and expected outputs
    const submissions = problemData.test_cases.map((testCase) => ({
      language_id,
      source_code: Buffer.from(source_code).toString("base64"),
      stdin: Buffer.from(testCase.input.join("\n")).toString("base64"),
    }));

    // Store expected outputs for later comparison
    const expectedOutputs = problemData.test_cases.map((testCase) => testCase.expected_output);
    console.log(expectedOutputs)

    // Submit each test case to Judge0 and check the result
    const results = await Promise.all(
      submissions.map((submission, index) =>
        submitCodeAndCheckResult(submission, expectedOutputs[index])
      )
    );

    // Send back the results
    res.status(200).json({
      message: "Submissions processed successfully",
      results,
    });
  } catch (error) {
    console.error("Error fetching problem data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Modify submitCodeAndCheckResult to accept expectedOutput for comparison
const submitCodeAndCheckResult = async (submission, expectedOutput) => {
  const url =
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&fields=*";

  const options = {
    method: "POST",
    headers: {
      "x-rapidapi-key": process.env.JUDGE_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  };

  try {
    // Send the submission
    const response = await fetch(url, options);
    const submissionData = await response.json();

    // Extract submission ID
    const submissionId = submissionData.token;

    // Check the submission result and compare it with the expected output
    return await checkSubmissionResult(submissionId, expectedOutput);
  } catch (error) {
    console.error("Error submitting code:", error);
    return { error: "Error submitting code" };
  }
};

// Modify checkSubmissionResult to accept expectedOutput for comparison
const checkSubmissionResult = async (submissionId, expectedOutput) => {
  const resultUrl = `https://judge0-ce.p.rapidapi.com/submissions/${submissionId}?base64_encoded=true&fields=*`;

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.JUDGE_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  };

  try {
    let resultData;

    while (true) {
      const response = await fetch(resultUrl, options);
      resultData = await response.json();

      const statusId = resultData.status.id;

      if (statusId === 3) {
        // Compare Judge0 output with expected output
        const decodedOutput = atob(resultData.stdout).trim();
    
        // Trim the expected output as well
        const trimmedExpectedOutput = expectedOutput.trim();
    
        // Compare Judge0 output with expected output
        const isCorrect = decodedOutput === trimmedExpectedOutput;
        console.log(isCorrect ? "Correct" : "Wrong");
        console.log("Expected Output:", trimmedExpectedOutput);
        console.log("Judge0 Output:", decodedOutput);
    
        return {
            status: isCorrect ? "Right Answer" : "Wrong Answer",
            output: decodedOutput,
            expected_output: trimmedExpectedOutput,
        };
      } else if (statusId === 5) {
        return {
          status: "Wrong Answer",
          expected_output: expectedOutput,
          your_output: resultData.stdout,
        };
      } else if (statusId === 6) {
        return { status: "Time Limit Exceeded" };
      } else if (statusId >= 7) {
        return { status: "Error", description: resultData.status.description };
      }

      // If still in queue or running, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("Error checking submission result:", error);
    return { error: "Error checking submission result" };
  }
};


export default getcode;
