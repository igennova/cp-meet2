import React, { useEffect, useState } from "react";
import axios from "axios";
import { routes, language_ID } from "@/constants";
import { Box, Text, Button } from "@chakra-ui/react";

const RandomQuestion = ({ editorRef, language }) => {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);

  // Fetch random question from the backend
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log("Question route:", routes.questionroute); // Check the API route
        const response = await axios.get(routes.questionroute);
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

    const response = await axios.get(routes.questionroute);
    const problem_id = response.data.question_id;
    axios
      .post(routes.getroute, {
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
            <Text mb={4} fontSize="2xl">
              {question.title}
            </Text>
            <Text mb={3}>{question.description}</Text>
            <Text>Sample Input:</Text>
            {question.input_format.map((line, index) => (
              <Text mb="2" key={index} ml="5">
                {line}
              </Text>
            ))}

            <Text>Sample Output:</Text>
            <Text mb="2" ml="5">
              {question.output_format}
            </Text>

            <Text>Constraints:</Text>
            <Text ml="5">
              n: [{question.constraints.n_min}, {question.constraints.n_max}]
            </Text>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Box>
    </Box>
  );
};

export default RandomQuestion;
