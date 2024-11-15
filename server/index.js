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

const rooms = {}; // Store game room status
// const validrooms = {
//   95169: 1,
//   57239: 1,
//   75303: 1,
//   76667: 1,
//   72080: 1,
//   11989: 1,
//   26521: 1,
//   26411: 1,
//   36902: 1,
//   56908: 1,
//   13707: 1,
//   43171: 1,
//   85435: 1,
//   99574: 1,
//   86490: 1,
//   81412: 1,
//   15758: 1,
//   13125: 1,
//   78568: 1,
//   84373: 1,
//   59944: 1,
//   77177: 1,
//   47776: 1,
//   82294: 1,
//   59506: 1,
//   30175: 1,
//   30452: 1,
//   87626: 1,
//   65260: 1,
//   57023: 1,
//   89567: 1,
//   30281: 1,
//   24789: 1,
//   23783: 1,
//   89788: 1,
//   76456: 1,
//   20806: 1,
//   36793: 1,
//   99438: 1,
//   45725: 10,
// };
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
  socket.on("gameOver", (data) => {
    const { roomId } = data;

    // Emit game over event to all clients in the room
    io.to(roomId).emit("gameOver", { success: true });

    // Disconnect both users from the room
    io.socketsLeave(roomId);
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

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex !== -1) {
        // Remove the disconnected player from the room
        room.players.splice(playerIndex, 1);
        delete rooms[roomId];
        socket.to(roomId).emit("playerDisconnected", { playerId: socket.id });

        // Check if the room is now empty, and if so, delete it
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(
            `Room ${roomId} has been deleted as both players disconnected.`
          );
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
