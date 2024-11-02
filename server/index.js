import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import questionRoutes from "./Routes/questionRoutes.js";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import coderoutes from "./Routes/judgeRoutes.js";
const app = express();
app.use(express.json());
const server = http.createServer(app);
dotenv.config();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend URL
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;
app.use(cors());

// Store user info as { id, name, socket } in the queue
let queue = [];
let activeRooms = {};

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Listen for the user setting their name
  socket.on("setName", (name) => {
    socket.name = name; // Attach name to socket
    console.log(`User connected with name: ${name} (ID: ${socket.id})`);
  });

  // Listen for users joining the queue
  socket.on("joinQueue", () => {
    // Check if the user has a name
    if (!socket.name) {
      console.log(`User ${socket.id} attempted to join without a name.`);
      socket.emit("error", "Please set your name first.");
      return;
    }

    // Check if the user is already in an active room
    if (activeRooms[socket.id]) {
      console.log(`User ${socket.name} (${socket.id}) is already in a match.`);
      return; // Prevent joining the queue if already matched
    }

    // Check if the user is already in the queue
    if (!queue.find((user) => user.socket.id === socket.id)) {
      console.log(`User ${socket.name} (${socket.id}) joined the queue.`);

      // Add user to the queue with their name
      queue.push({ id: socket.id, name: socket.name, socket });

      // If there are 2 users in the queue, match them
      if (queue.length >= 2) {
        const user1 = queue.shift(); // First user in the queue
        const user2 = queue.shift(); // Second user in the queue

        // Create a room for the matched users
        const roomId = `room_${user1.id}_${user2.id}`;
        user1.socket.join(roomId);
        user2.socket.join(roomId);

        // Mark the users as active in this room
        activeRooms[user1.id] = roomId;
        activeRooms[user2.id] = roomId;

        // Notify both users they have been matched
        user1.socket.emit("matchFound", { roomId, opponentName: user2.name });
        user2.socket.emit("matchFound", { roomId, opponentName: user1.name });

        console.log(
          `Matched user ${user1.name} with user ${user2.name} in room: ${roomId}`
        );
      }
    } else {
      console.log(
        `User ${socket.name} (${socket.id}) is already in the queue.`
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);

    // Remove the user from the queue if they're in it
    queue = queue.filter((user) => user.id !== socket.id);

    // Remove the user from the active rooms
    delete activeRooms[socket.id];
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
app.use("/api", coderoutes);
