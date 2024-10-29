import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
app.use(cors());

let queue = []; // This will hold the users waiting in the queue
let activeRooms = {}; // Track active rooms and their users

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Listen for users joining the queue
  socket.on('joinQueue', () => {
    // Check if the user is already in an active room
    if (activeRooms[socket.id]) {
      console.log(`User ${socket.id} is already in a match.`);
      return; // Prevent joining the queue if already matched
    }

    // Check if the user is already in the queue
    if (!queue.find(user => user.id === socket.id)) {
      console.log(`User ${socket.id} joined the queue.`);
      
      // Add user to the queue
      queue.push(socket);
      
      // If there are 2 users in the queue, match them
      if (queue.length >= 2) {
        const user1 = queue.shift(); // First user in the queue
        const user2 = queue.shift(); // Second user in the queue

        // Create a room for the matched users
        const roomId = `room_${user1.id}_${user2.id}`;
        user1.join(roomId);
        user2.join(roomId);

        // Mark the users as active in this room
        activeRooms[user1.id] = roomId;
        activeRooms[user2.id] = roomId;

        // Notify both users they have been matched
        user1.emit('matchFound', { roomId, opponentId: user2.id });
        user2.emit('matchFound', { roomId, opponentId: user1.id });

        console.log(`Matched user ${user1.id} with user ${user2.id} in room: ${roomId}`);
      }
    } else {
      console.log(`User ${socket.id} is already in the queue.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
    
    // Remove the user from the queue if they're in it
    queue = queue.filter(user => user.id !== socket.id);

    // Remove the user from the active rooms
    delete activeRooms[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Server has started on http://localhost:${PORT}`);
});
