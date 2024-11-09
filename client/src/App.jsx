import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Footer, CodeEditor } from "@/components";
import { Box } from "@chakra-ui/react";
import { BrowserRouter, Link } from "react-router-dom";
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
  const [timeup, setTimeUp] = useState(false);

  const [time, setTime] = useState(360);

  useEffect(() => {
    let timer;
    if (isMatched && time > 0 && !timeup) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      toast.info("Time's up");
      setTimeUp(true);
    }

    return () => clearInterval(timer);
  }, [isMatched, time, timeup]);

  useEffect(() => {
    socket.on("gameOver", (data) => {
      if (data.success) {
        setGameMessage("Time's up! The game has ended. Both players are now disconnected.");
        setIsMatched(false);
      } else {
        setGameMessage("Game Over due to inactivity or time out.");
      }
    });

    return () => socket.off("gameOver");
  }, []);

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

    socket.on("startGame", () => {
      setIsMatched(true);
    });

    socket.on("playerDisconnected", () => {
      setGameMessage("Your opponent has disconnected, Create a new Room.");
      setIsMatched(false);
    });

    return () => socket.off(); // Clean up event listeners on component unmount
  }, []);

  const createRoom = () => {
    const parsedRoomId = parseInt(roomId, 10);
    if (Number.isInteger(parsedRoomId) && roomId && userName) {
      socket.emit("createRoom", { roomId, userName });
    } else {
      setGameMessage("Please enter a valid integer for room ID.");
    }
  };

  const joinRoom = () => {
    const parsedRoomId = parseInt(roomId, 10);
    if (Number.isInteger(parsedRoomId) && roomId && userName) {
      socket.emit("joinRoom", { roomId, userName });
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
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 mr-3 text-white sm:h-9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
              <div className="text-white self-center text-xl font-semibold whitespace-nowrap">
                CP Buddy
              </div>
            </div>
          </Link>
          {isMatched && !timeup ? (
            <div className="text-2xl font-medium text-white">
              {formatTime(time)}
            </div>
          ) : null}
        </nav>

        {timeup ? (
          <div className="text-center text-4xl text-white py-8">
            Time's Up! The game is over.
          </div>
        ) : isMatched ? (
          <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
            <CodeEditor socket={socket} roomId={roomId} userName={userName}  />
          </Box>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-4 space-y-4">
              <HyperText className="text-4xl font-bold text-white" text="1V1 DSA BATTLE" />
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
                className="font-display text-center text-4xl font-bold -tracking-widest text-white"
                text={gameMessage}
              />
            </div>
          </div>
        )}
      </div>
      {/* <Footer /> */}
    </BrowserRouter>
  );
};

export default App;
