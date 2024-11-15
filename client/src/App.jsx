import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Navbar } from "@/components";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const socket = io("https://cp-buddy-4ngv.onrender.com");
import { toast, ToastContainer } from "react-toastify";
import { Home } from "@/pages";

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
        setGameMessage(
          "Time's up! The game has ended. Both players are now disconnected."
        );
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
    const parsedRoomId = /^\d+$/.test(roomId) ? parseInt(roomId, 10) : null;

    if (parsedRoomId !== null && roomId && userName) {
      socket.emit("joinRoom", { roomId: parsedRoomId, userName });
    } else {
      setGameMessage("Please enter a valid integer for room ID.");
    }
  }    

  return (
    <BrowserRouter>
      <Navbar
        isMatched={isMatched}
        timeup={timeup}
        formatTime={formatTime}
        time={time}
      />

      <Routes>
        <Route
          path="/"
          element={
            <Home
              timeup={timeup}
              isMatched={isMatched}
              userName={userName}
              setUserName={setUserName}
              roomId={roomId}
              setRoomId={setRoomId}
              isRoomCreated={isRoomCreated}
              isRoomJoined={isRoomJoined}
              gameMessage={gameMessage}
              createRoom={createRoom}
              joinRoom={joinRoom}
              socket={socket}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
