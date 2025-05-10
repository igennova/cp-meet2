import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import questionRoutes from "./Routes/questionRoutes.js";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Question from "./Models/question.js";

import { submitCodeAndCheckResult } from "./Controllers/judge0.js";
// import coderoutes from "./Routes/judgeRoutes.js";
const app = express();
app.use(express.json());
const server = http.createServer(app);
dotenv.config();
const PORT = process.env.PORT || 5000;
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: ["https://cp-buddy-t80e.onrender.com","http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Store game room status with added maxPlayers field
const rooms = {}; 

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("createRoom", ({ roomId, userName, maxPlayers = 2 }) => {
    // Validate maxPlayers
    const validMaxPlayers = Number.isInteger(maxPlayers) && maxPlayers >= 2 && maxPlayers <= 4 
      ? maxPlayers 
      : 2; // Default to 2 if invalid

    if (!rooms[roomId]) {
      rooms[roomId] = { 
        winner: null, 
        players: [],
        maxPlayers: validMaxPlayers,
        createdBy: socket.id,
        playersReady: 0
      };
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: userName });

      console.log(
        `Room ${roomId} created for ${validMaxPlayers} players by ${userName} (${socket.id})`
      );
      socket.emit("roomCreated", { 
        success: true,
        maxPlayers: validMaxPlayers,
        roomId: roomId,
        message: `Room ${roomId} created successfully for ${validMaxPlayers} players!`
      });
    } else {
      socket.emit("roomCreated", {
        success: false,
        message: `Room ${roomId} already exists. Please try a different room ID.`,
      });
    }
  });

  socket.on("joinRoom", ({ roomId, userName }) => {
    if (rooms[roomId]) {
      const maxPlayers = rooms[roomId].maxPlayers || 2;
      
      if (rooms[roomId].players.length < maxPlayers) {
        socket.join(roomId);
        rooms[roomId].players.push({ id: socket.id, name: userName });
        
        console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
        console.log(`Room now has ${rooms[roomId].players.length}/${maxPlayers} players`);
        
        // Send current player count to all in room
        io.to(roomId).emit("playerCountUpdate", { 
          count: rooms[roomId].players.length, 
          maxPlayers: maxPlayers,
          players: rooms[roomId].players,
          roomId: roomId,
          message: `Room ${roomId} now has ${rooms[roomId].players.length}/${maxPlayers} players`
        });
        
        socket.emit("roomJoined", { 
          success: true,
          currentPlayers: rooms[roomId].players.length,
          maxPlayers: maxPlayers,
          players: rooms[roomId].players,
          roomId: roomId,
          message: `Joined room ${roomId} successfully! (${rooms[roomId].players.length}/${maxPlayers} players)`
        });
        
        // Notify others that someone joined
        socket.to(roomId).emit("playerJoined", { 
          playerId: socket.id, 
          userName,
          playerCount: rooms[roomId].players.length,
          maxPlayers: maxPlayers,
          roomId: roomId,
          message: `${userName} joined room ${roomId}`
        });
        
        // Start game when all players have joined
        if (rooms[roomId].players.length === maxPlayers) {
          io.to(roomId).emit("startGame", {
            players: rooms[roomId].players,
            roomId: roomId,
            message: `All ${maxPlayers} players have joined! Starting game...`
          });
        }
      } else {
        socket.emit("roomJoined", {
          success: false,
          message: `Room ${roomId} is full. Cannot join. (${rooms[roomId].players.length}/${maxPlayers})`,
        });
      }
    } else {
      socket.emit("roomJoined", {
        success: false,
        message: `Room ${roomId} does not exist. Please check the room ID or create a new room.`,
      });
    }
  });
  
  socket.on("gameOver", (data) => {
    const { roomId } = data;
    
    if (rooms[roomId]) {
      const room = rooms[roomId];
      const playerCount = room.players.length;
      const maxPlayers = room.maxPlayers;
      
      // Emit game over event with more details
      io.to(roomId).emit("gameOver", { 
        success: true, 
        playerCount,
        maxPlayers,
        message: "Time's up! The game has ended."
      });

      console.log(`Game over in room ${roomId} - emitting event to all ${playerCount} players`);
      
      // Disconnect all users from the room
      io.socketsLeave(roomId);
      
      // Clean up room
      delete rooms[roomId];
      console.log(`Room ${roomId} has been deleted after game over.`);
    } else {
      socket.emit("gameOver", { 
        success: false,
        message: "Room not found"
      });
    }
  });
  
  socket.on(
    "submitCode",
    async ({ problem_id, source_code, language_id, roomId, userName }) => {
      const room = rooms[roomId];

      if (!problem_id || !source_code || !language_id) {
        socket.emit("error", {
          message: "Missing problem_id, source_code, or language_id",
        });

        return;
      }

      try {
        const problemData = await Question.findOne({ question_id: problem_id });
        if (!problemData) {
          socket.emit("error", { message: "Problem not found" });
          return;
        }

        const submissions = problemData.test_cases.map((testCase) => {
          // Original Python source code as a string
          const plainSourceCode = source_code.trim();

          // Encode source code, stdin, and expected output to base64
          const encodedSourceCode =
            Buffer.from(plainSourceCode).toString("base64");
          const encodedStdin = Buffer.from(testCase.input.join("\n")).toString(
            "base64"
          );
          const encodedExpectedOutput = Buffer.from(
            testCase.expected_output
          ).toString("base64");

          return {
            language_id,
            source_code: encodedSourceCode,
            stdin: encodedStdin,
            expected_output: encodedExpectedOutput,
          };
        });

        const expectedOutputs = problemData.test_cases.map(
          (testCase) => testCase.expected_output
        );

        const results = await submitCodeAndCheckResult(
          submissions,
          expectedOutputs
        );
        console.log(results);

        // Evaluate results

        const allPassed = results.every((result) => result.isCorrect === true);
        const timeLimitExceeded = results.some(
          (result) => result.status === "Time Limit Exceeded"
        );

        console.log(allPassed);
        console.log(room);
        console.log(room.winner);
        if (allPassed && room && !room.winner) {
          console.log("Hello");
          room.winner = { id: socket.id, name: userName };
          io.to(roomId).emit("gameResult", {
            winner: room.winner,
            message: `${userName} won the game!`,
          });
        } else if (timeLimitExceeded) {
          socket.emit("results", {
            message: "Time Limit Exceeded on some test cases",
            results,
          });
        } else {
          socket.emit("results", { message: "Hidden test case failed" });
        }
      } catch (error) {
        console.error("Error:", error);
        socket.emit("error", { message: "Server error", error: error.message });
      }
    }
  );

  socket.on("submissionExhausted", ({ roomId, userName, playerId }) => {
    const room = rooms[roomId];
    
    if (room && room.players.length >= 2) {
      // Find the other players in the room
      const remainingPlayers = room.players.filter(player => player.id !== playerId);
      
      if (remainingPlayers.length > 0 && !room.winner) {
        // With multiple players, we declare the winner only if all others have exhausted submissions
        // For now, just pick the first remaining player as winner
        const winningPlayer = remainingPlayers[0];
        
        // Set the winning player as the winner
        room.winner = winningPlayer;
        
        console.log(`Player ${userName} exhausted all submissions in room ${roomId}.`);
        console.log(`Setting ${winningPlayer.name} as winner.`);
        
        // Notify all players about the game result
        io.to(roomId).emit("gameResult", {
          winner: winningPlayer,
          message: `${winningPlayer.name} won the game because ${userName} ran out of submission attempts!`
        });
        
        console.log(`Game result emitted to room ${roomId}.`);
      } else {
        console.log(`Could not find other players or room already has a winner in room ${roomId}.`);
      }
    } else {
      console.log(`Room ${roomId} not found or doesn't have enough players.`);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex !== -1) {
        // Get the player info before removing
        const disconnectedPlayer = room.players[playerIndex];
        
        // Remove the disconnected player from the room
        room.players.splice(playerIndex, 1);
        
        console.log(`Player ${disconnectedPlayer.name} disconnected from room ${roomId}`);
        console.log(`Room ${roomId} now has ${room.players.length}/${room.maxPlayers} players`);
        
        // Notify remaining players with complete information
        socket.to(roomId).emit("playerDisconnected", { 
          playerId: socket.id,
          playerName: disconnectedPlayer.name,
          remainingPlayers: room.players,
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers
        });

        // Check if there are any players left
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} has been deleted as all players disconnected.`);
        } 
        // If only one player remains, notify them they won by default
        else if (room.players.length === 1 && !room.winner) {
          const lastPlayer = room.players[0];
          room.winner = lastPlayer;
          
          io.to(roomId).emit("gameResult", {
            winner: lastPlayer,
            message: `${lastPlayer.name} won the game because all other players disconnected!`
          });
          
          console.log(`${lastPlayer.name} wins in room ${roomId} due to other players disconnecting`);
        }
        // If game continues but we need to update player count
        else {
          io.to(roomId).emit("playerCountUpdate", { 
            count: room.players.length, 
            maxPlayers: room.maxPlayers,
            players: room.players
          });
        }
        break;
      }
    }
  });
});
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("DB Connected"))
  .catch((error) => console.error("Connection error:", error));

server.listen(PORT, () => {
  console.log(`Server has started on http://localhost:${PORT}`);
});
app.use("/api", questionRoutes);
