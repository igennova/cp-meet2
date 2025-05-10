import React, { useEffect, useState } from "react";
import axios from "axios";
import { routes, language_ID } from "@/constants";
import { Box, Text, Button, Badge, HStack, VStack, Divider, Code } from "@chakra-ui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GradualSpacing } from "@/components/ui";

const RandomQuestion = ({ editorRef, language, socket, roomId, userName, setTimerRunning }) => {
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
      if (data.winner && data.winner.id === socket.id) {
        setGameResult("You won the game!");
        toast.success("Congratulations! You won the game!", toastOptions);
        if (setTimerRunning) setTimerRunning(false);
      } else {
        setGameResult("You lost the game.");
        toast.info("You lost the game.", toastOptions);
        if (setTimerRunning) setTimerRunning(false);
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
  }, [socket, userName, setTimerRunning]);

  const runCode = () => {
    if (isButtonDisabled) {
      toast.error(
        "Please wait 4 seconds before submitting again.",
        toastOptions
      );
      return;
    }

    const newSubmissionCount = submissionCount + 1;

    if (submissionCount >= MAX_SUBMISSIONS) {
      setGameResult("You lost.");
      toast.error("Game over. No more submissions allowed.", toastOptions);
      if (setTimerRunning) {
        setTimerRunning(false);
        console.log("Stopping timer - max submissions reached");
      }
      return;
    }

    const source_code = editorRef.current.getValue();
    if (!source_code) {
      toast.error("Please enter your code to submit.", toastOptions);
      return;
    }

    const language_id = language_ID[language];
    setIsButtonDisabled(true);
    setSubmissionCount(newSubmissionCount);
    setTimeout(() => setIsButtonDisabled(false), 2000);

    if (newSubmissionCount >= MAX_SUBMISSIONS) {
      console.log("Last submission attempt used. Notifying server...");
      socket.emit("submissionExhausted", { 
        roomId, 
        userName,
        playerId: socket.id
      });
      
      setGameResult("You lost.");
      toast.error("Game over. No more submissions allowed.", toastOptions);
      if (setTimerRunning) {
        setTimerRunning(false);
        console.log("Stopping timer - submission exhausted");
      }
    } else {
      toast.warning(
        `Submissions remaining: ${MAX_SUBMISSIONS - newSubmissionCount}`,
        toastOptions
      );
    }

    socket.emit("submitCode", {
      roomId,
      userName,
      problem_id,
      source_code,
      language_id,
    });
  };

  useEffect(() => {
    if (gameResult && setTimerRunning) {
      setTimerRunning(false);
    }
  }, [gameResult, setTimerRunning]);

  return (
    <Box w="50%">
      <Box 
        bg="#0d0d1c" 
        p={3} 
        borderRadius="md" 
        mb={2} 
        borderWidth="1px" 
        borderColor="#2a2a4a"
        className="flex items-center justify-between"
      >
        <HStack>
          <Text className="text-white font-medium">
            <span className="text-indigo-400">Hello, </span>
            {userName}
          </Text>
          <Badge colorScheme="blue" ml={2}>
            Submissions: {submissionCount}/{MAX_SUBMISSIONS}
          </Badge>
        </HStack>
        <Button
          variant="solid"
          onClick={runCode}
          className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-4 py-2 rounded-md hover:from-indigo-700 hover:to-blue-600 transition-all shadow-md"
          disabled={!!gameResult || isButtonDisabled || submissionCount >= MAX_SUBMISSIONS}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          }
        >
          Submit
        </Button>
      </Box>
      <Box
        height="75vh"
        p={4}
        color={fetchError ? "red.400" : ""}
        border="1px solid"
        borderRadius="md"
        borderColor={fetchError ? "red.500" : "#2a2a4a"}
        overflowY="auto"
        bg="#131325"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
        className="custom-scrollbar"
      >
        {gameResult ? (
          <VStack className="h-full justify-center items-center">
            <Box className={`w-24 h-24 rounded-full mb-6 flex items-center justify-center ${
              gameResult === "You won the game!" ? "bg-green-500/20 border-2 border-green-500" : "bg-red-500/20 border-2 border-red-500"
            }`}>
              {gameResult === "You won the game!" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-green-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                </svg>
              )}
            </Box>
            <GradualSpacing
              className={`font-display text-center text-4xl font-bold -tracking-widest md:text-6xl ${
                gameResult === "You won the game!"
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500"
              }`}
              text={gameResult}
            />
            <Box className="mt-8">
              <Button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-md hover:from-indigo-700 hover:to-blue-600 transition-all shadow-md"
              >
                Start a New Battle
              </Button>
            </Box>
          </VStack>
        ) : question ? (
          <VStack align="stretch" spacing={4}>
            <Box bg="#1A1A35" borderRadius="md" p={4} borderLeft="4px solid" borderLeftColor="blue.500">
              <HStack>
                <Badge colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="md">Problem {question.question_id}</Badge>
                <Text className="text-white font-bold text-xl ml-2">
                  {question.title}
                </Text>
              </HStack>
              <Text className="text-white mt-3 leading-relaxed">
                {question.description}
              </Text>
            </Box>
            
            <Box>
              <Text className="text-indigo-400 font-semibold mb-2">Example</Text>
              <Box bg="#1A1A35" borderRadius="md" p={4} className="space-y-3">
                <Box>
                  <Text className="text-gray-400 text-sm mb-1">Input:</Text>
                  <Code p={2} bg="#0D0D1C" borderRadius="md" className="block w-full">
                    {question.example.input.map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </Code>
                </Box>
                <Box>
                  <Text className="text-gray-400 text-sm mb-1">Output:</Text>
                  <Code p={2} bg="#0D0D1C" borderRadius="md" className="block w-full">
                    {question.example.output}
                  </Code>
                </Box>
              </Box>
            </Box>
            
            <Divider borderColor="#2a2a4a" />
            
            <Box>
              <Text className="text-indigo-400 font-semibold mb-2">Input Format</Text>
              <Box bg="#1A1A35" borderRadius="md" p={4}>
                {question.input_format.map((line, index) => (
                  <Text key={index} className="text-white mb-1" fontSize="sm">
                    {line}
                  </Text>
                ))}
              </Box>
            </Box>
            
            <Box>
              <Text className="text-indigo-400 font-semibold mb-2">Output Format</Text>
              <Box bg="#1A1A35" borderRadius="md" p={4}>
                <Text className="text-white" fontSize="sm">
                  {question.output_format}
                </Text>
              </Box>
            </Box>
            
            <Box>
              <Text className="text-indigo-400 font-semibold mb-2">Constraints</Text>
              <Box bg="#1A1A35" borderRadius="md" p={4}>
                {Object.entries(question.constraints).map(([key, value], index) => (
                  <Text key={index} className="text-white mb-1" fontSize="sm">
                    <span className="text-gray-400">{key.replace("_", " ")}:</span>{" "}
                    {Array.isArray(value) ? `[${value.join(", ")}]` : value}
                  </Text>
                ))}
              </Box>
            </Box>
          </VStack>
        ) : (
          <Box className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </Box>
        )}
      </Box>
      <ToastContainer />
    </Box>
  );
};

export default RandomQuestion;
