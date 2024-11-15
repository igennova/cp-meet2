import Question from "../Models/question.js"; // Adjust path if needed
import fetch from "node-fetch"; // Ensure you have this package installed
import * as dotenv from "dotenv";

dotenv.config();

const getcode = async (req, res) => {};

// Modify submitCodeAndCheckResult to accept expectedOutput for comparison
export const submitCodeAndCheckResult = async (
  submissions,
  expectedOutputs
) => {
  const url =
    "https://judge0-ce.p.sulu.sh/submissions/batch?base64_encoded=true&fields=*";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.SULU_API_KEY}`, // Use your actual API key
    },
    body: JSON.stringify({
      submissions,
      base64_encoded: true, // Enable Base64 encoding for responses
    }),
  };

  console.log(submissions);

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Submission Error:", errorText);
      return { error: errorText };
    }

    const submissionData = await response.json();

    // Check if submissionData is valid and contains tokens
    if (!Array.isArray(submissionData) || submissionData.length === 0) {
      console.error(
        "Unexpected response format or empty submission data:",
        submissionData
      );
      return {
        error:
          "API response does not contain submissions or is incorrectly formatted",
      };
    }

    // Extract tokens safely
    const submissionTokens = submissionData
      .map((submission) => submission.token)
      .filter(Boolean);

    if (submissionTokens.length === 0) {
      console.error("No valid tokens received:", submissionData);
      return { error: "No valid tokens received from API" };
    }

    console.log(submissionTokens);

    return await checkSubmissionResults(submissionTokens, expectedOutputs);
  } catch (error) {
    console.error("Error submitting code:", error);
    return { error: "Error submitting code" };
  }
};

// Modify checkSubmissionResult to accept expectedOutput for comparison
const checkSubmissionResults = async (
  tokens,
  expectedOutputs,
  maxRetries = 5,
  delay = 2000
) => {
  const url = `https://judge0-ce.p.sulu.sh/submissions/batch?tokens=${tokens.join(
    ","
  )}&base64_encoded=true`; // Enable Base64 encoding for results

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { method: "GET" });
      const results = await response.json();
      // console.log(results);

      // Check if results have the expected structure and contain submissions
      if (!results.submissions || !Array.isArray(results.submissions)) {
        console.error("Error: Invalid results from API:", results);
        return { error: "Invalid results from Judge0 API" };
      }

      // Process submissions and decode Base64 output
      const processedResults = results.submissions.map((result, index) => {
        const decodedStdout = result.stdout
          ? Buffer.from(result.stdout, "base64").toString("utf-8").trim()
          : null;
        const isCorrect = decodedStdout === expectedOutputs[index];

        return {
          isCorrect: result.status.id === 3 ? isCorrect : null, // Only mark correct if status is 'Accepted'
          output: decodedStdout,
          expected: expectedOutputs[index],
          status: result.status?.description || "Unknown",
          error:
            result.stderr || result.compile_output || result.message || null,
        };
      });

      // Check if all submissions have completed processing
      const allProcessed = processedResults.every(
        (result) =>
          result.status !== "In Queue" && result.status !== "Processing"
      );

      if (allProcessed) {
        return processedResults;
      }

      // Wait before retrying if not all are processed
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error("Error checking submission result:", error);
      return { error: "Error checking submission result" };
    }
  }

  // Return partial or queued results if max retries reached
  console.warn(
    "Warning: Max retries reached, some submissions may still be pending."
  );
  return { error: "Some submissions may still be pending", results: null };
};

export default getcode;
