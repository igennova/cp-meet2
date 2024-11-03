import React, { useEffect, useState } from "react";
import axios from "axios";
import { routes, language_ID } from "@/constants";
import { Box, Text, Button } from "@chakra-ui/react";

const RandomQuestion = ({ editorRef, language, socket, roomId, userName }) => {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [gameResult, setGameResult] = useState(null); // New state for game result

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get(routes.questionroute);
        setQuestion(response.data);
      } catch (error) {
        setError("Error fetching question. Please try again.");
        console.error("Error fetching question:", error);
      }
    };

    fetchQuestion();
  }, []);

  useEffect(() => {
    // Listen for the results from the backend
    socket.on("results", (data) => {
      console.log("Received results:", data);
      if (data.status === "Right Answer") {
        console.log("Correct answer submitted!");
      } else {
        console.log("Incorrect answer or error:", data);
      }
    });

    // Listen for the game result (win/lose)
    socket.on("gameResult", (data) => {
      console.log("Game Result:", data.message);

      // Check if the current user is the winner and display the message accordingly
      if (data.winner && data.winner.name === userName) {
        setGameResult("You won the game!");
      } else {
        setGameResult("You lost the game.");
      }

      // Disconnect the socket after the game is decided
      // socket.disconnect();
    });

    return () => {
      socket.off("results");
      socket.off("gameResult");
    };
  }, [socket, userName]);

  const runCode = () => {
    const source_code = editorRef.current.getValue();
    if (!source_code) return;

    const language_id = language_ID[language];

    // Fetch the problem ID again to ensure up-to-date info
    axios
      .get(routes.questionroute)
      .then((response) => {
        const problem_id = response.data.question_id;
        
        socket.emit("submitCode", {
          roomId,
          userName,
          problem_id,
          source_code,
          language_id,
        });
      })
      .catch((error) => {
        console.error("Error fetching problem ID:", error);
      });
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Box w="50%">
      <Text mb={2} fontSize="lg">
        Random Question
        Hello {userName}
      </Text>
      <Button
        variant="outline"
        colorScheme="green"
        mb={4}
        onClick={runCode}
        disabled={!!gameResult} // Disable button if game is over
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
        {gameResult ? ( // Display game result message
          <Text fontSize="xl" color="green.500" textAlign="center">
            {gameResult}
          </Text>
        ) : question ? (
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
