import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Footer, CodeEditor } from "@/components";
import { Box } from "@chakra-ui/react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Button, Input, HyperText, GradualSpacing } from "@/components/ui";
const socket = io("http://localhost:5000");
import { toast, ToastContainer } from "react-toastify";
const App = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [gameMessage, setGameMessage] = useState("");
  const [isMatched, setIsMatched] = useState(false);

  const [time, setTime] = useState(300);

  useEffect(() => {
    let timer;
    if (isMatched && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      // setTime(0);
      console.log("Time's up");
      toast.info("Time's up");

      socket.disconnect();
    }

    return () => clearInterval(timer);
  }, [isMatched, time]);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    socket.on("roomCreated", (data) => {
      if (data.success) {
        setIsRoomCreated(true);
        setGameMessage("Room created successfully!");
      } else {
        setGameMessage(data.message);
      }
    });

    socket.on("roomJoined", (data) => {
      if (data.success) {
        setIsRoomJoined(true);
        setGameMessage("Joined room successfully!");
      } else {
        setGameMessage(data.message);
      }
    });

    // Listen for 'startGame' event to show the CodeEditor
    socket.on("startGame", () => {
      setIsMatched(true); // Set matched state to true to display CodeEditor
    });

    socket.on("playerDisconnected", (data) => {
      setGameMessage("Your opponent has disconnected,Create a new Room");
      setIsMatched(false); // Reset matched state if a player disconnects
    });

    return () => socket.off(); // Clean up event listeners on component unmount
  }, []);

  const createRoom = () => {
    const parsedRoomId = parseInt(roomId, 10);

    if (Number.isInteger(parsedRoomId)) {
      if (roomId && userName) {
        socket.emit("createRoom", { roomId: roomId, userName });
      }
    } else {
      setGameMessage("Please enter a valid integer for room ID.");
    }
  };

  const joinRoom = () => {
    const parsedRoomId = parseInt(roomId, 10);

    if (Number.isInteger(parsedRoomId)) {
      if (roomId && userName) {
        socket.emit("joinRoom", { roomId: roomId, userName });
      }
    } else {
      setGameMessage("Please enter a valid integer for room ID.");
    }
  };

  return (
    <BrowserRouter>
      <div>
        <nav className="w-full flex justify-between items-center sm:px-8 px-4 py-4 border-b border-b-gray-500">
          <Link to="/">
            <div className="flex items-center space-x-4">
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
              <div className="text-white self-center text-xl font-semibold whitespace-nowrap">
                CP Buddy
              </div>
            </div>
          </Link>
          {isMatched ? (
            <div className="text-2xl font-medium text-white">
              {formatTime(time)}
            </div>
          ) : (
            <></>
          )}
        </nav>
        {isMatched ? (
          <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
            <CodeEditor socket={socket} roomId={roomId} userName={userName} />
          </Box>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-4 space-y-4">
              <HyperText
                className="text-4xl font-bold text-white dark:text-white"
                text="1V1 DSA BATTLE"
              />
              <Input
                type="text"
                placeholder="Enter Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full"
              />
              <Input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={createRoom}
                disabled={isRoomCreated}
                className="w-full font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md"
              >
                Create Room
              </Button>
              <Button
                onClick={joinRoom}
                disabled={isRoomJoined || isRoomCreated}
                className="w-full font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md"
              >
                Join Room
              </Button>
              <GradualSpacing
                className="font-display text-center text-4xl font-bold -tracking-widest  text-white dark:text-white md:text-7xl md:leading-[5rem]"
                text={gameMessage}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
