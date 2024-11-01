import React, { useEffect, useState } from "react";
import axios from "axios";
import { getroute, questionroute } from "@/api/ApiRoutes";
import { Box, Text, Button } from "@chakra-ui/react";
import { language_ID } from "@/constants";

const RandomQuestion = ({ editorRef, language }) => {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);

  // Fetch random question from the backend
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log("Question route:", questionroute); // Check the API route
        const response = await axios.get(questionroute);
        console.log("API Response:", response.data); // Log the response
        setQuestion(response.data);
      } catch (error) {
        setError("Error fetching question. Please try again.");
        console.error("Error fetching question:", error);
      }
    };

    fetchQuestion();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  const runCode = async () => {
    const source_code = editorRef.current.getValue();
    if (!source_code) return;

    const language_id = language_ID[language];

    const response = await axios.get(questionroute);
    const problem_id = response.data.question_id;
    axios
      .post(getroute, {
        problem_id,
        source_code,
        language_id,
      })
      .then((response) => {
        console.log("Response from backend:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    // <div>
    //   <h2>Random Question</h2>
    //   {question ? (
    //     <div>
    //       <h3>{question.title}</h3>
    //       <p>{question.description}</p>
    //       <pre>
    //         Sample Input: {JSON.stringify(question.input_format, null, 2)}
    //       </pre>
    //       <pre>
    //         Sample Output: {JSON.stringify(question.output_format, null, 2)}
    //       </pre>
    //       <pre>
    //         Constraints: {JSON.stringify(question.constraints, null, 2)}
    //       </pre>
    //     </div>
    //   ) : (
    //     <p>Loading...</p>
    //   )}
    // </div>
    <Box w="50%">
      <Text mb={2} fontSize="lg">
        Random Question
      </Text>
      <Button
        variant="outline"
        colorScheme="green"
        mb={4}
        // isLoading={isLoading}
        onClick={runCode}
      >
        Submit
      </Button>
      <Box
        height="75vh"
        p={2}
        color={error ? "red.400" : ""}
        border="1px solid"
        borderRadius={4}
        borderColor={error ? "red.500" : "#333"}
      >
        {question ? (
          <div>
            <h3>{question.title}</h3>
            <p>{question.description}</p>
            <pre>
              Sample Input: {JSON.stringify(question.input_format, null, 2)}
            </pre>
            <pre>
              Sample Output: {JSON.stringify(question.output_format, null, 2)}
            </pre>
            <pre>
              Constraints: {JSON.stringify(question.constraints, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Box>
    </Box>
  );
};

export default RandomQuestion;
