import React from "react";
import { Navbar, Footer } from "./components";
import Matchmaking from "./components/sockets/usermatch";
import { Box } from "@chakra-ui/react";
import { CodeEditor } from "./components";
import RandomQuestion from "./components/questions/question";

const App = () => {
  return (
    <>
      <div>
        <Navbar />
        <Matchmaking />
        <RandomQuestion />
        <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
          <CodeEditor />
        </Box>
      </div>
      <Footer />
    </>
  );
};

export default App;
