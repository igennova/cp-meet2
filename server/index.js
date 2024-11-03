import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import questionRoutes from "./Routes/questionRoutes.js";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Question from "./models/question.js";

import {
  submitCodeAndCheckResult,
  checkSubmissionResult,
} from "./controllers/judge0.js";
// import coderoutes from "./Routes/judgeRoutes.js";
const app = express();
app.use(express.json());
const server = http.createServer(app);
dotenv.config();
const PORT = process.env.PORT || 5000;
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const rooms = {}; // Store game room status

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("createRoom", ({ roomId, userName }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { winner: null, players: [] };
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: userName });
      console.log(
        `Room ${roomId} created and joined by ${userName} (${socket.id})`
      );
      socket.emit("roomCreated", { success: true });
    } else {
      socket.emit("roomCreated", {
        success: false,
        message: "Room already exists",
      });
    }
  });

  socket.on("joinRoom", ({ roomId, userName }) => {
    if (rooms[roomId]) {
      if (rooms[roomId].players.length < 2) {
        socket.join(roomId);
        rooms[roomId].players.push({ id: socket.id, name: userName });
        console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
        socket.emit("roomJoined", { success: true });
        socket
          .to(roomId)
          .emit("playerJoined", { playerId: socket.id, userName });
        if (rooms[roomId].players.length === 2) {
          io.to(roomId).emit("startGame");
        }
      } else {
        socket.emit("roomJoined", {
          success: false,
          message: "Room is full. Cannot join.",
        });
      }
    } else {
      socket.emit("roomJoined", {
        success: false,
        message: "Room does not exist",
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

        const submissions = problemData.test_cases.map((testCase) => ({
          language_id,
          source_code: Buffer.from(source_code).toString("base64"),
          stdin: Buffer.from(testCase.input.join("\n")).toString("base64"),
        }));

        const expectedOutputs = problemData.test_cases.map(
          (testCase) => testCase.expected_output
        );

        const results = await Promise.all(
          submissions.map((submission, index) =>
            submitCodeAndCheckResult(submission, expectedOutputs[index])
          )
        );

        const allPassed = results.every(
          (result) => result.status === "Right Answer"
        );

        if (allPassed && room && !room.winner) {
          room.winner = { id: socket.id, name: userName };
          io.to(roomId).emit("gameResult", {
            winner: room.winner,
            message: `${userName} won the game!`,
          });
        } else {
          socket.emit("results", { message: "Submissions processed", results });
        }
      } catch (error) {
        console.error("Error:", error);
        socket.emit("error", { message: "Server error", error: error.message });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    for (const roomId in rooms) {
      if (rooms[roomId].players.some((player) => player.id === socket.id)) {
        rooms[roomId].players = rooms[roomId].players.filter(
          (player) => player.id !== socket.id
        );
        socket.to(roomId).emit("playerDisconnected", { playerId: socket.id });
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
