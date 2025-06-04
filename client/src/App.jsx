import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";
import { Navbar } from "@/components";
import { Button, Input, HyperText, GradualSpacing } from "@/components/ui";
import { Home } from "@/pages";
import { Dashboard } from "@/pages";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

// Initialize socket outside of component to avoid reconnections
const socket = io("https://cp-buddy-4ngv.onrender.com");

const App = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [gameMessage, setGameMessage] = useState("");
  const [isMatched, setIsMatched] = useState(false);
  const [timeup, setTimeUp] = useState(false);
  const [time, setTime] = useState(360);
  const [timerRunning, setTimerRunning] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    let timer;
    if (isMatched && time > 0 && !timeup && timerRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      toast.info("Time's up");
      setTimeUp(true);
      setTimerRunning(false);
    }

    return () => clearInterval(timer);
  }, [isMatched, time, timeup, timerRunning]);

  useEffect(() => {
    socket.on("gameOver", (data) => {
      if (data.success) {
        // Use the message from server if available
        const message = data.message || "Time's up! The game has ended. Players are now disconnected.";
        setGameMessage(message);
        setIsMatched(false);
        setTimerRunning(false);
        console.log("Game over - stopping timer due to time up");
      } else {
        setGameMessage("Game Over due to inactivity or time out.");
        setTimerRunning(false);
        console.log("Game over - stopping timer due to inactivity");
      }
    });

    socket.on("gameResult", (data) => {
      // Force stop the timer for both players
      setTimerRunning(false);
      console.log("Game result received - stopping timer", data.message);
      
      // Format message based on winner
      let resultMessage = data.message;
      
      if (data.winner) {
        const isCurrentUserWinner = data.winner.id === socket.id;
        
        if (data.message.includes("ran out of submission attempts")) {
          resultMessage = isCurrentUserWinner 
            ? `You won! Your opponent ran out of submission attempts.`
            : `Game over. You used all your submission attempts.`;
        } 
        else if (data.message.includes("disconnected")) {
          resultMessage = isCurrentUserWinner
            ? `You won! All other players disconnected.`
            : `${data.winner.name} won because other players disconnected.`;
        }
        else {
          resultMessage = isCurrentUserWinner
            ? `Congratulations! You won the game!`
            : `Game over. ${data.winner.name} won the game.`;
        }
      }
      
      setGameMessage(resultMessage);
    });

    return () => {
      socket.off("gameOver");
      socket.off("gameResult");
    };
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
        setMaxPlayers(data.maxPlayers);
        setPlayerCount(1); // Creator is the first player
        setGameMessage(`Room ${roomId} created successfully for ${data.maxPlayers} players!`);
      } else {
        setGameMessage(data.message);
      }
    });

    socket.on("roomJoined", (data) => {
      if (data.success) {
        setIsRoomJoined(true);
        setMaxPlayers(data.maxPlayers);
        setPlayerCount(data.currentPlayers);
        setGameMessage(`Joined room ${roomId} successfully! (${data.currentPlayers}/${data.maxPlayers} players)`);
      } else {
        setGameMessage(data.message);
      }
    });

    socket.on("playerCountUpdate", (data) => {
      setPlayerCount(data.count);
      setGameMessage(`Players: ${data.count}/${data.maxPlayers}. Waiting for more players...`);
    });

    socket.on("startGame", (data) => {
      setIsMatched(true);
      setTimerRunning(true);
      setPlayerCount(data.players.length);
      console.log("Game started - timer running");
    });

    socket.on("playerDisconnected", (data) => {
      // Add fallback values if data isn't complete
      const currentCount = data?.playerCount || 0;
      const maxCount = data?.maxPlayers || maxPlayers;
      const playerName = data?.playerName || "A player";
      
      // Update player count state with fallback
      setPlayerCount(currentCount);
      
      // More descriptive message with fallbacks
      if (currentCount <= 1) {
        setGameMessage(`${playerName} has disconnected. You're the only player left. Create a new room to play again.`);
        setIsMatched(false);
        setTimerRunning(false);
        console.log("Not enough players - stopping timer");
      } else {
        setGameMessage(`${playerName} has disconnected. (${currentCount}/${maxCount} players remaining)`);
      }
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("playerCountUpdate");
      socket.off("startGame");
      socket.off("playerDisconnected");
    };
  }, []);

  const createRoom = () => {
    const parsedRoomId = parseInt(roomId, 10);
    if (Number.isInteger(parsedRoomId) && roomId && userName) {
      socket.emit("createRoom", { roomId, userName, maxPlayers });
    } else {
      setGameMessage("Please enter a valid integer for room ID.");
    }
  };

  const joinRoom = () => {
    const parsedRoomId = parseInt(roomId, 10);
    if (
      Number.isInteger(parsedRoomId) &&
      parsedRoomId.toString() === roomId &&
      roomId &&
      userName
    ) {
      socket.emit("joinRoom", { roomId, userName });
    } else {
      setGameMessage("Please enter a valid integer for room ID.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Navbar
            isMatched={isMatched}
            timeup={timeup}
            formatTime={formatTime}
            time={time}
            playerCount={playerCount}
            maxPlayers={maxPlayers}
          />

          <ToastContainer position="top-right" theme="dark" />

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
                  setTimerRunning={setTimerRunning}
                  timerRunning={timerRunning}
                  maxPlayers={maxPlayers}
                  setMaxPlayers={setMaxPlayers}
                  playerCount={playerCount}
                />
              }
            />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
