import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import questionRoutes from "./Routes/questionRoutes.js";
import ratingRoutes from "./Routes/ratingRoutes.js";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Question from "./Models/question.js";
import session from "express-session";
import passport from "passport";
import "./Controllers/passport-setup.js";
import authRoutes from "./Routes/auth.js";
import profileRoutes from "./Routes/profileRoutes.js";
import corsMiddleware from "./middleware/cors.js";
import sessionMiddleware from "./middleware/session.js";
import passportMiddleware from "./middleware/passport.js";
import { UserRating } from "./Models/rating.js";

import { submitCodeAndCheckResult } from "./Controllers/judge0.js";
// import coderoutes from "./Routes/judgeRoutes.js";
const app = express();
app.use(express.json());
const server = http.createServer(app);
dotenv.config();
const PORT = process.env.PORT || 5000;
// Use middleware
app.use(corsMiddleware);
app.use(sessionMiddleware);
passportMiddleware(app);
const MAX_RATING_DIFFERENCE = 200;
const RATING_TOLERANCE_INCREASE = 50;
// Set up auth routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// Test route to verify authentication
app.get('/', (req, res) => {
  if (req.user) {
    res.json({ 
      message: 'You are logged in!',
      user: req.user 
    });
  } else {
    res.json({ 
      message: 'Not logged in',
      redirectTo: 'http://localhost:3000'
    });
  }
});

const io = new Server(server, {
  cors: {
    origin: ["https://cp-buddy-t80e.onrender.com","http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Store game room status with added maxPlayers field
const rooms = {};

// Duel system management
const duelQueue = [];
const activeDuels = new Map();

// Sample questions for duels

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
const RATING_RANGES = {
  BEGINNER: { min: 0, max: 1000, difficulty: 'easy' },
  INTERMEDIATE: { min: 1001, max: 2000, difficulty: 'medium' },
  ADVANCED: { min: 2001, max: 3000, difficulty: 'hard' },
  EXPERT: { min: 3001, max: 4000, difficulty: 'expert' },
  MASTER: { min: 4001, max: 5000, difficulty: 'master' }
};
  // DUEL SYSTEM EVENTS
  const getRatingInfo = (rating) => {
  for (const [level, range] of Object.entries(RATING_RANGES)) {
    if (rating >= range.min && rating <= range.max) {
      return { level, difficulty: range.difficulty };
    }
  }
  return { level: 'BEGINNER', difficulty: 'easy' }; // default
};

// Find suitable match based on rating
const findSuitableMatch = (newPlayer, queue) => {
  const currentTime = Date.now();
  
  for (let i = 0; i < queue.length; i++) {
    const queuedPlayer = queue[i];
    const waitTime = currentTime - queuedPlayer.joinedAt;
    
    // Calculate dynamic rating tolerance based on wait time
    const baseTolerance = MAX_RATING_DIFFERENCE;
    const timeBonus = Math.floor(waitTime / 30000) * RATING_TOLERANCE_INCREASE; // every 30 seconds
    const maxTolerance = baseTolerance + timeBonus;
    console.log(newPlayer.rating, queuedPlayer.rating, maxTolerance);
    const ratingDiff = Math.abs(newPlayer.rating - queuedPlayer.rating);
    
    console.log(`Rating difference: ${ratingDiff}, Max Tolerance: ${maxTolerance}`);
    
    if (ratingDiff <= maxTolerance) {
      // Remove matched player from queue and return
      return queue.splice(i, 1)[0];
    }
  }
  
  return null;
};
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get questions based on combined player ratings
const getQuestionForDuel = async (player1Rating, player2Rating) => {
  const avgRating = (player1Rating + player2Rating) / 2;
  const { difficulty } = getRatingInfo(avgRating);

  try {
    if (difficulty === 'easy') { 
      return getRandomInt(1, 10);
    } else if (difficulty === 'medium') {
      return getRandomInt(11, 20);
    } else if (difficulty === 'hard') {
      return getRandomInt(21, 30);
    } else if (difficulty === 'expert') {
      return getRandomInt(31, 40);
    } else {
      return getRandomInt(41, 50);
    }
  } catch (error) {
    console.error('Error fetching question:', error);
    throw new Error('Failed to fetch question');
  }
};


// Modified socket handler
socket.on('joinDuelQueue', async (userData) => {
  try {
    console.log(`User ${userData.displayName} joining duel queue with ID: ${socket.id}`);
    console.log(`User data: ${JSON.stringify(userData)}`);
    
    // Fetch user's current rating from database
    const userFromDB = await UserRating.findOne({ userId: userData.userId });
    console.log(`Fetched user from DB: ${JSON.stringify(userFromDB)}`);
    if (!userFromDB) {
      socket.emit('error', { message: 'User not found' });
      return;
    }
    
    const userRating = userFromDB.ratings.BLITZ_2MIN.rating || 1000; // Default rating if not set
    console.log(`User ${userData.displayName} has rating: ${userRating}`);
    
    // Remove user from queue if already exists (prevent duplicates)
    const existingIndex = duelQueue.findIndex(entry => entry.socketId === socket.id);
    if (existingIndex > -1) {
      duelQueue.splice(existingIndex, 1);
    }
    
    // Create queue entry with rating
    const queueEntry = {
      socketId: socket.id,
      userId: userData.userId,
      displayName: userData.displayName,
      email: userData.email,
      profilePicture: userData.profilePicture,
      rating: userRating,
      joinedAt: Date.now()
    };
    console.log(queueEntry)
    // Try to find a suitable match first
    const matchedPlayer = findSuitableMatch(queueEntry, duelQueue);
    
    if (matchedPlayer) {
      // Match found immediately
      console.log(`Immediate match found between ${queueEntry.displayName} (${queueEntry.rating}) and ${matchedPlayer.displayName} (${matchedPlayer.rating})`);
      
      const roomId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get appropriate question based on both players' ratings
      const selectedQuestion = await getQuestionForDuel(queueEntry.rating, matchedPlayer.rating);
      console.log(`Selected question ID: ${selectedQuestion}`);
      const avgRating = (queueEntry.rating + matchedPlayer.rating) / 2;
      const { difficulty } = getRatingInfo(avgRating);
      
      // Create duel room
      activeDuels.set(roomId, {
        players: [matchedPlayer, queueEntry],
        status: 'starting',
        startTime: null,
        questionId: selectedQuestion,
        difficulty: difficulty,
        averageRating: avgRating,
        submissions: {},
        winner: null,
        createdAt: Date.now()
      });
      
      console.log(`Duel created: ${roomId}, Question: ${selectedQuestion._id}, Difficulty: ${difficulty}, Avg Rating: ${avgRating}`);
      
      // Notify both players
      const matchData1 = {
        roomId,
        questionId: selectedQuestion,
        difficulty: difficulty,
        opponent: {
          displayName: queueEntry.displayName,
          profilePicture: queueEntry.profilePicture || '/placeholder-user.jpg',
          rating: queueEntry.rating
        },
        yourRating: matchedPlayer.rating,
        message: `Match found! Duel vs ${queueEntry.displayName} (${queueEntry.rating})`
      };
      
      const matchData2 = {
        roomId,
        questionId: selectedQuestion,
        difficulty: difficulty,
        opponent: {
          displayName: matchedPlayer.displayName,
          profilePicture: matchedPlayer.profilePicture || '/placeholder-user.jpg',
          rating: matchedPlayer.rating
        },
        yourRating: queueEntry.rating,
        message: `Match found! Duel vs ${matchedPlayer.displayName} (${matchedPlayer.rating})`
      };
      
      io.to(matchedPlayer.socketId).emit('duelMatchFound', matchData1);
      io.to(queueEntry.socketId).emit('duelMatchFound', matchData2);
      
    } else {
      // No immediate match, add to queue
      duelQueue.push(queueEntry);
      console.log(`User ${userData.displayName} (Rating: ${userRating}) added to queue. Queue size: ${duelQueue.length}`);
      
      // Emit queue status
      socket.emit('duelQueueStatus', {
        position: duelQueue.length,
        inQueue: true,
        rating: userRating,
        message: `Searching for opponent near your rating (${userRating})...`
      });
    }
    
  } catch (error) {
    console.error('Error in joinDuelQueue:', error);
    socket.emit('error', { message: 'Failed to join duel queue' });
  }
});

// Periodic matchmaking check (run every 10 seconds)
setInterval(() => {
  if (duelQueue.length >= 2) {
    console.log(`Running periodic matchmaking check. Queue size: ${duelQueue.length}`);
    
    // Try to match players with expanded rating tolerance
    for (let i = 0; i < duelQueue.length - 1; i++) {
      const player1 = duelQueue[i];
      const match = findSuitableMatch(player1, duelQueue.slice(i + 1));
      
      if (match) {
        // Remove player1 from queue
        duelQueue.splice(i, 1);
        
        // Create match (similar logic as above)
        // ... implement match creation logic here
        console.log(`Periodic match created between ${player1.displayName} and ${match.displayName}`);
        break;
      }
    }
  }
}, 10000);
  // Handle joining duel queue
//   socket.on('joinDuelQueue', (userData) => {
    
//     console.log(`User ${userData.displayName} joining duel queue with ID: ${socket.id}`);
    
//     // Remove user from queue if already exists (prevent duplicates)
//     const existingIndex = duelQueue.findIndex(entry => entry.socketId === socket.id);
//     if (existingIndex > -1) {
//       duelQueue.splice(existingIndex, 1);
//     }
    
//     // Add user to queue
//     const queueEntry = {
//       socketId: socket.id,
//       userId: userData.userId,
//       displayName: userData.displayName,
//       email: userData.email,
//       profilePicture: userData.profilePicture,
//       joinedAt: Date.now()
//     };
    
//          duelQueue.push(queueEntry);
//      console.log(`User ${userData.displayName} joined duel queue. Queue size: ${duelQueue.length}`);
     
//      // Emit queue status to user
//      socket.emit('duelQueueStatus', { 
//        position: duelQueue.length,
//        inQueue: true,
//        message: `You are in queue. Position: ${duelQueue.length}`
//      });
     
//      console.log(`📋 Queue status sent to ${userData.displayName}: position ${duelQueue.length}`);
    
//     // Try to find a match
//     if (duelQueue.length >= 2) {
//       const player1 = duelQueue.shift();
//       const player2 = duelQueue.shift();
      
//              const roomId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
       
//               // Select random question from database (1-11 based on your existing questions)
//        const questionId = Math.floor(Math.random() * 11) + 1;
       
//        // Create duel room
//        activeDuels.set(roomId, {
//          players: [player1, player2],
//          status: 'starting',
//          startTime: null,
//          questionId: questionId,
//          submissions: {},
//          winner: null,
//          createdAt: Date.now()
//        });
       
//        console.log(`Duel match created: ${roomId} between ${player1.displayName} and ${player2.displayName}`);
       
//        // Notify both players with complete data
//        io.to(player1.socketId).emit('duelMatchFound', { 
//          roomId, 
//          questionId: questionId,
//          opponent: {
//            displayName: player2.displayName,
//            profilePicture: player2.profilePicture || '/placeholder-user.jpg'
//          },
//          message: `Match found! Preparing duel against ${player2.displayName}`
//        });
       
//        io.to(player2.socketId).emit('duelMatchFound', { 
//          roomId, 
//          questionId: questionId,
//          opponent: {
//            displayName: player1.displayName,
//            profilePicture: player1.profilePicture || '/placeholder-user.jpg'
//          },
//          message: `Match found! Preparing duel against ${player1.displayName}`
//        });
       
//        console.log(`✅ Match notifications sent to both players`);
//     }
//   });

//   // Handle leaving duel queue
//   socket.on('leaveDuelQueue', () => {
//     const index = duelQueue.findIndex(entry => entry.socketId === socket.id);
//     if (index > -1) {
//       const removed = duelQueue.splice(index, 1)[0];
//       console.log(`User ${removed.displayName} left duel queue`);
//       socket.emit('duelQueueStatus', { 
//         inQueue: false,
//         message: 'Left duel queue'
//       });
//     }
//   });

//      // Handle joining duel room
//    socket.on('joinDuelRoom', async ({ roomId, user }) => {
//      console.log('🏠 User joining duel room:', roomId, 'User:', user.displayName);
//      socket.join(roomId);
     
//      const duel = activeDuels.get(roomId);
//      if (duel) {
//        console.log('📊 Sending game state update for room:', roomId);
       
//        // Transform backend player data to match frontend expectations
//        const transformedPlayers = duel.players.map(player => ({
//          userId: player.userId || player.socketId, // Use userId if available, fallback to socketId
//          displayName: player.displayName,
//          profilePicture: player.profilePicture || '/placeholder-user.jpg',
//          ready: true // Set all players as ready
//        }));
       
//        // Fetch question from database
//        const questionData = await Question.findOne({ question_id: duel.questionId });
       
//        socket.emit('gameStateUpdate', {
//          status: duel.status,
//          players: transformedPlayers,
//          timeLeft: 60,
//          question: questionData
//        });
       
//        // Check if both players have joined the room
//        const playersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []).length;
//        console.log(`👥 Players in room ${roomId}: ${playersInRoom}/2`);
       
//        if (duel.status === 'starting' && playersInRoom === 2) {
//          console.log('🚀 Both players joined! Starting 3-second countdown...');
         
//          // Start 3-second countdown
//          let countdown = 3;
//          const countdownInterval = setInterval(() => {
//            console.log(`⏰ Countdown: ${countdown}`);
//            io.to(roomId).emit('gameStarting', countdown);
//            countdown--;
           
//            if (countdown < 0) {
//              clearInterval(countdownInterval);
//              console.log('📖 Moving to question phase...');
             
//              // Move to question phase
//              duel.status = 'question';
//              io.to(roomId).emit('gameStateUpdate', {
//                status: 'question',
//                players: transformedPlayers,
//                timeLeft: 10, // 10 seconds to read question
//                question: questionData
//              });
             
//              console.log('⏳ Starting 10-second question reading period...');
//              // After 10 seconds, start the actual coding phase
//              setTimeout(async () => {
//                console.log('💻 Moving to active coding phase...');
//                duel.status = 'active';
//                duel.startTime = Date.now();
               
//                // Fetch question again for active phase
//                const activeQuestionData = await Question.findOne({ question_id: duel.questionId });
               
//                io.to(roomId).emit('gameStateUpdate', {
//                  status: 'active',
//                  players: transformedPlayers,
//                  timeLeft: 60,
//                  question: activeQuestionData
//                });
               
//                // Start 60-second timer
//                startDuelTimer(roomId);
//              }, 10000); // 10 seconds to read the question
//            }
//          }, 1000);
//        }
//      } else {
//        console.log('❌ Duel room not found:', roomId);
//        socket.emit('duelError', { message: 'Duel room not found' });
//      }
//    });

//      // Handle duel code submission  
//    socket.on('submitCode', async (data) => {
//      const { roomId, source_code, language_id, userName } = data;
     
//      try {
//        const duel = activeDuels.get(roomId);
//        if (!duel || duel.status !== 'active') {
//          socket.emit('duelError', { message: 'Duel is not active' });
//          return;
//        }

//        console.log(`💻 Code submitted by ${userName} in room ${roomId}`);

//        // Fetch the question from the database
//        const questionData = await Question.findOne({ question_id: duel.questionId });
       
//        // For simplified testing, you can simulate the Judge0 submission
//        // In a real implementation, you would prepare the test cases and submit to Judge0
       
//        // Simulate code checking (for testing - replace with actual Judge0 logic)
//        const simulateResult = Math.random() > 0.3; // 70% chance of success for testing
       
//        if (simulateResult && !duel.winner) {
//          // Player wins the duel!
//          duel.status = 'finished';
//          duel.winner = socket.id;
         
//          const winnerPlayer = duel.players.find(p => p.socketId === socket.id);
//          const loserPlayer = duel.players.find(p => p.socketId !== socket.id);
         
//          console.log(`🏆 Duel ${roomId} won by ${winnerPlayer.displayName}`);
         
//          // Notify both players
//          io.to(roomId).emit('gameFinished', {
//            winner: {
//              socketId: socket.id,
//              displayName: winnerPlayer.displayName,
//              userId: winnerPlayer.userId
//            },
//            loser: {
//              socketId: loserPlayer.socketId,
//              displayName: loserPlayer.displayName,
//              userId: loserPlayer.userId
//            },
//            reason: 'solution_correct',
//            message: `${winnerPlayer.displayName} solved the problem and won the duel!`
//          });
         
//          // Update ratings (optional for now)
//          // updateDuelRatings(winnerPlayer.userId, loserPlayer.userId, duel.question.question_id, roomId);
         
//          // Clean up
//          setTimeout(() => {
//            activeDuels.delete(roomId);
//          }, 5000);
         
//        } else {
//          socket.emit('results', {
//            success: false,
//            message: "Some test cases failed. Keep trying!",
//            // results: mockResults // You can add mock test results here
//          });
//        }
//      } catch (error) {
//        console.error('Error processing duel submission:', error);
//        socket.emit('duelError', { 
//          message: 'Error processing submission', 
//          error: error.message 
//        });
//      }
//    });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected:", socket.id);

//     // Handle duel queue removal
//     const queueIndex = duelQueue.findIndex(entry => entry.socketId === socket.id);
//     if (queueIndex > -1) {
//       const removed = duelQueue.splice(queueIndex, 1)[0];
//       console.log(`Removed ${removed.displayName} from duel queue due to disconnect`);
//     }
    
//     // Handle active duels
//     for (const [roomId, duel] of activeDuels) {
//       const playerIndex = duel.players.findIndex(p => p.socketId === socket.id);
//       if (playerIndex > -1) {
//         const disconnectedPlayer = duel.players[playerIndex];
//         const otherPlayer = duel.players[1 - playerIndex];
        
//         console.log(`Player ${disconnectedPlayer.displayName} disconnected from duel ${roomId}`);
        
//         if (duel.status === 'active' && !duel.winner) {
//           // Declare other player as winner
//           duel.status = 'finished';
//           duel.winner = otherPlayer.socketId;
          
//           io.to(otherPlayer.socketId).emit('duelFinished', {
//             winner: {
//               socketId: otherPlayer.socketId,
//               displayName: otherPlayer.displayName,
//               userId: otherPlayer.userId
//             },
//             loser: {
//               socketId: disconnectedPlayer.socketId,
//               displayName: disconnectedPlayer.displayName,
//               userId: disconnectedPlayer.userId
//             },
//             reason: 'opponent_disconnected',
//             message: `You won! ${disconnectedPlayer.displayName} disconnected.`
//           });
          
//                      // Update ratings
//            updateDuelRatings(otherPlayer.userId, disconnectedPlayer.userId, duel.questionId, roomId);
//         }
        
//         activeDuels.delete(roomId);
//         break;
//       }
//     }

//     // Handle existing room system
//     for (const roomId in rooms) {
//       const room = rooms[roomId];
//       const playerIndex = room.players.findIndex(
//         (player) => player.id === socket.id
//       );

//       if (playerIndex !== -1) {
//         // Get the player info before removing
//         const disconnectedPlayer = room.players[playerIndex];
        
//         // Remove the disconnected player from the room
//         room.players.splice(playerIndex, 1);
        
//         console.log(`Player ${disconnectedPlayer.name} disconnected from room ${roomId}`);
//         console.log(`Room ${roomId} now has ${room.players.length}/${room.maxPlayers} players`);
        
//         // Notify remaining players with complete information
//         socket.to(roomId).emit("playerDisconnected", { 
//           playerId: socket.id,
//           playerName: disconnectedPlayer.name,
//           remainingPlayers: room.players,
//           playerCount: room.players.length,
//           maxPlayers: room.maxPlayers
//         });

//         // Check if there are any players left
//         if (room.players.length === 0) {
//           delete rooms[roomId];
//           console.log(`Room ${roomId} has been deleted as all players disconnected.`);
//         } 
//         // If only one player remains, notify them they won by default
//         else if (room.players.length === 1 && !room.winner) {
//           const lastPlayer = room.players[0];
//           room.winner = lastPlayer;
          
//           io.to(roomId).emit("gameResult", {
//             winner: lastPlayer,
//             message: `${lastPlayer.name} won the game because all other players disconnected!`
//           });
          
//           console.log(`${lastPlayer.name} wins in room ${roomId} due to other players disconnecting`);
//         }
//         // If game continues but we need to update player count
//         else {
//           io.to(roomId).emit("playerCountUpdate", { 
//             count: room.players.length, 
//             maxPlayers: room.maxPlayers,
//             players: room.players
//           });
//         }
//         break;
//       }
//     }
//   });
// });

// DUEL SYSTEM HELPER FUNCTIONS

function startDuelTimer(roomId) {
  let timeLeft = 60;
  
  const timer = setInterval(async () => {
    timeLeft--;
    
    const duel = activeDuels.get(roomId);
    if (!duel || duel.status !== 'active') {
      clearInterval(timer);
      return;
    }
    
    // Transform players for frontend
    const transformedPlayers = duel.players.map(player => ({
      userId: player.userId || player.socketId,
      displayName: player.displayName,
      profilePicture: player.profilePicture || '/placeholder-user.jpg',
      ready: true
    }));
    
    // Fetch question data for timer updates
    const questionData = await Question.findOne({ question_id: duel.questionId });
    
    io.to(roomId).emit('gameStateUpdate', {
      status: 'active',
      players: transformedPlayers,
      timeLeft,
      question: questionData
    });
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      
      // Time's up - declare draw
      duel.status = 'finished';
      
      io.to(roomId).emit('gameFinished', {
        winner: null,
        reason: 'timeout',
        message: 'Time\'s up! The duel ended in a draw.',
        players: transformedPlayers
      });
      
      console.log(`Duel ${roomId} ended in timeout`);
      
      // Clean up after 5 seconds
      setTimeout(() => {
        activeDuels.delete(roomId);
      }, 5000);
    }
  }, 1000);
}

async function updateDuelRatings(winnerUserId, loserUserId, questionId, matchId) {
  try {
    const { recordMatchResult } = await import('./Controllers/ratingController.js');
    
    await recordMatchResult({
      participants: [
        { userId: winnerUserId, result: 'win' },
        { userId: loserUserId, result: 'loss' }
      ],
      questionId: questionId,
      duration: 1, // Duel duration in minutes
      matchType: 'duel'
    });
    
    console.log(`Updated ratings for duel: winner ${winnerUserId}, loser ${loserUserId}`);
  } catch (error) {
    console.error('Error updating duel ratings:', error);
  }
}});

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("DB Connected"))
  .catch((error) => console.error("Connection error:", error));

server.listen(PORT, () => {
  console.log(`Server has started on http://localhost:${PORT}`);
});
app.use("/api", questionRoutes);
app.use("/api/rating", ratingRoutes)