import React, { useState } from "react";
import { Footer, CodeEditor } from "@/components";
import Matchmaking from "@/components/sockets/usermatch";
import { Box } from "@chakra-ui/react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

const App = () => {
  const [isMatched, setIsMatched] = useState(false); // Track if user is matched
  const [name, setName] = useState(""); // Track the user's name

  const handleMatchFound = () => {
    setIsMatched(true); // Set matched state to true when match is found
  };

  return (
    <BrowserRouter>
      <div>
        <header className="w-full flex justify-between items-center sm:px-8 px-4 py-4 border-b border-b-[#e6ebf4]">
          <Link to="/" className="flex justify-between items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="h-6 mr-3 text-white sm:h-9"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
            <span className="text-white self-center text-xl font-semibold whitespace-nowrap">
              CP Buddy
            </span>
          </Link>

          <Link
            to="/"
            className="font-inter font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md"
          >
            Compete
          </Link>
        </header>

        {/* Conditional Rendering based on isMatched */}
        {isMatched ? (
          <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
            <CodeEditor />
          </Box>
        ) : (
          <Matchmaking
            name={name}
            setName={setName}
            onMatchFound={handleMatchFound} // Trigger match found
          />
        )}
      </div>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
