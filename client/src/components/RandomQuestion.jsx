import React, { useEffect, useState } from "react";
import axios from "axios";
import { routes, language_ID } from "@/constants";
import { Box, Text, Button } from "@chakra-ui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GradualSpacing } from "@/components/ui";

const RandomQuestion = ({ editorRef, language, socket, roomId, userName }) => {
  const [question, setQuestion] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [problem_id, setProblem_id] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  const MAX_SUBMISSIONS = 3;
  const toastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(() => {
    const fetchQuestion = async (roomId) => {
      try {
        const problemId = (roomId % 11) + 1;
        const response = await axios.get(routes.questionroute, {
          params: { problemId },
        });
        setProblem_id(response.data.question_id);
        setQuestion(response.data);
      } catch (error) {
        console.error("Error fetching question:", error);
        toast.error("Error fetching question. Please try again.", toastOptions);
        setFetchError(true);
      }
    };

    fetchQuestion(roomId);
  }, [roomId]);

  useEffect(() => {
    socket.on("gameResult", (data) => {
      if (data.winner && data.winner.id ===socket.id) {
        setGameResult("You won the game!");
        toast.success("Congratulations! You won the game!", toastOptions);
      } else {
        setGameResult("You lost the game.");
        toast.info("You lost the game.");
      }
    
    });

    socket.on("results", (data) => {
      if (data.message === "Hidden test case failed") {
        toast.warning("Hidden test case failed.", toastOptions);
      } else if (data.message === "Time Limit Exceeded on some test cases") {
        toast.error("Time Limit Exceeded on some test cases.", toastOptions);
      }
    });

    return () => {
      socket.off("results");
      socket.off("gameResult");
    };
  }, [socket, userName]);

  const runCode = () => {
    if (isButtonDisabled) {
      toast.error(
        "Please wait 4 seconds before submitting again.",
        toastOptions
      );
      return;
    }
    if (submissionCount >= MAX_SUBMISSIONS) {
      if (submissionCount >= MAX_SUBMISSIONS) {
        setGameResult("You lost.");
        toast.error("Game over. No more submissions allowed.", toastOptions);

        return;
      }
    }

    const source_code = editorRef.current.getValue();
    if (!source_code) {
      toast.error("Please enter your code to submit.", toastOptions);
      return;
    }

    const language_id = language_ID[language];
    setIsButtonDisabled(true);
    setSubmissionCount((prevCount) => prevCount + 1);
    setTimeout(() => setIsButtonDisabled(false), 2000);

    toast.warning(
      `Submissions remaining: ${MAX_SUBMISSIONS - submissionCount - 1}`,
      toastOptions
    );
    socket.emit("submitCode", {
      roomId,
      userName,
      problem_id,
      source_code,
      language_id,
    });
  };

  return (
    <Box w="50%">
      <Text mb={2} fontSize="lg" color="whiteAlpha.700">
        Hello,{" "}
        <Text as="span" fontWeight="bold" color="white" display="inline">
          {userName}!
        </Text>{" "}
        Welcome to the challenge!
      </Text>

      <Button
        variant="default"
        onClick={runCode}
        className="font-inter font-medium bg-[#6469ff] text-white px-4 py-2 mb-4 rounded-md"
        disabled={!!gameResult || isButtonDisabled}
      >
        Submit
      </Button>
      <Box
        height="75vh"
        p={2}
        color={fetchError ? "red.400" : ""}
        border="1px solid"
        borderRadius={4}
        borderColor={fetchError ? "red.500" : "#333"}
        overflowY="auto"
        bg="#1E1E1E"
      >
        {gameResult ? (
          <GradualSpacing
            className={`font-display text-center text-4xl font-bold -tracking-widest  text-white dark:text-white md:text-7xl md:leading-[5rem] ${
              gameResult === "You won the game!"
                ? "text-green-500"
                : "text-red-500"
            }`}
            text={gameResult}
          />
        ) : question ? (
          <div>
            <Text className="text-close-to-white" mb={4} fontSize="2xl">
              {question.question_id}. {question.title}
            </Text>
            <Text className="text-white" mb={3}>
              {question.description}
            </Text>
            <Text className="text-white">Example:</Text>
            <Text className="text-white" ml="5">
              Input:
            </Text>
            {question.example.input.map((line, index) => (
              <Text className="text-white" mb="3" key={index} ml="10">
                {line}
              </Text>
            ))}
            <Text className="text-white" ml="5">
              Output:
            </Text>
            <Text className="text-white" mb="3" ml="10">
              {question.example.output}
            </Text>
            <Text className="text-white">Sample Input:</Text>
            {question.input_format.map((line, index) => (
              <Text className="text-white" mb="3" key={index} ml="5">
                {line}
              </Text>
            ))}

            <Text className="text-white">Sample Output:</Text>
            <Text className="text-white" mb="3" ml="5">
              {question.output_format}
            </Text>

            <Text className="text-white">Constraints:</Text>
            {Object.entries(question.constraints).map(([key, value], index) => (
              <Text key={index} className="text-white" ml="5">
                {key.replace("_", " ")}:{" "}
                {Array.isArray(value) ? `[${value.join(", ")}]` : value}
              </Text>
            ))}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Box>
      <ToastContainer />
    </Box>
  );
};

export default RandomQuestion;
