import Question from "../Models/question.js"; // Adjust path if needed
import fetch from "node-fetch"; // Ensure you have this package installed

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

    // Prepare submissions for Judge0
    const submissions = problemData.test_cases.map((testCase) => ({
      language_id,
      source_code: Buffer.from(source_code).toString("base64"),
      stdin: Buffer.from(testCase.input.join("\n")).toString("base64"),
    }));

    // Submit each test case to Judge0 and check the result
    const results = await Promise.all(
      submissions.map((submission) => submitCodeAndCheckResult(submission))
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

// Function to submit code and check the result
const submitCodeAndCheckResult = async (submission) => {
  const url =
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&fields=*";

  const options = {
    method: "POST",
    headers: {
      "x-rapidapi-key": "e76f87b709msh746dbe80f215db2p16d699jsn9357eec67572",
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

    // Check the submission result
    return await checkSubmissionResult(submissionId);
  } catch (error) {
    console.error("Error submitting code:", error);
    return { error: "Error submitting code" };
  }
};

// Function to check the result of the submission
// Function to check the result of the submission
const checkSubmissionResult = async (submissionId) => {
  const resultUrl = `https://judge0-ce.p.rapidapi.com/submissions/${submissionId}?base64_encoded=true&fields=*`;

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "e76f87b709msh746dbe80f215db2p16d699jsn9357eec67572",
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  };

  try {
    let resultData;

    while (true) {
      const response = await fetch(resultUrl, options);
      resultData = await response.json();

      const statusId = resultData.status.id;

      // Break the loop if a final state is reached
      if (statusId === 3) {
        // Accepted
        console.log("Accepted:", resultData);
        return {
          status: "Accepted",
          output: resultData.stdout,
        };
      } else if (statusId === 5) {
        // Wrong Answer
        console.log("Wrong Answer:", resultData);
        return {
          status: "Wrong Answer",
          expected_output: resultData.expected_output,
          your_output: resultData.stdout,
        };
      } else if (statusId === 6) {
        // Time Limit Exceeded
        console.log("Time Limit Exceeded:", resultData);
        return { status: "Time Limit Exceeded" };
      } else if (statusId >= 7) {
        // Other errors
        console.log(
          "Submission failed with status:",
          resultData.status.description
        );
        return { status: "Error", description: resultData.status.description };
      }

      // If still in queue or running, wait and retry
      console.log("Submission is still in queue or running...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Shorten delay to 2 seconds
    }
  } catch (error) {
    console.error("Error checking submission result:", error);
    return { error: "Error checking submission result" };
  }
};

export default getcode;
