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
    origin: ["https://cp-buddy-t80e.onrender.com","http://localhost:3000","https://cp-nextjs-iota.vercel.app/"],
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
function calculateELO(playerRating, opponentRating, playerWon, kFactor = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = playerWon ? 1 : 0;
  const newRating = Math.round(playerRating + kFactor * (actualScore - expectedScore));
  const ratingChange = newRating - playerRating;
  
  return {
    newRating: Math.max(100, newRating), // Minimum rating of 100
    ratingChange
  };
}

// Update user rating in database
async function updateUserRating(userId, newRating, ratingChange) {
  try {
    await UserRating.findOneAndUpdate(
      { userId: userId },
      { 
        $set: { 
          'ratings.BLITZ_2MIN.current': newRating
        },
        $max: {
          'ratings.BLITZ_2MIN.peak': newRating
        },
        $inc: { 
          'ratings.BLITZ_2MIN.matches': 1,
          [`overall.${ratingChange >= 0 ? 'wins' : 'losses'}`]: 1
        }
      },
      { upsert: true }
    );
    console.log(`Updated rating for user ${userId}: ${newRating} (${ratingChange >= 0 ? '+' : ''}${ratingChange})`);
  } catch (error) {
    console.error('Error updating user rating:', error);
  }
}

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
    
    const userRating = userFromDB.ratings.BLITZ_2MIN.current;
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
socket.on('submitDuelCode', async ({ problem_id, source_code, language_id, roomId, userName }) => {
  try {
    const duel = activeDuels.get(roomId);
    
    if (!duel) {
      socket.emit('error', { message: 'Duel room not found' });
      return;
    }
    
    if (!problem_id || !source_code || !language_id) {
      socket.emit('error', {
        message: 'Missing problem_id, source_code, or language_id',
      });
      return;
    }
    
    // Find current player in the duel
    const currentPlayer = duel.players.find(player => player.socketId === socket.id);
    if (!currentPlayer) {
      socket.emit('error', { message: 'Player not found in this duel' });
      return;
    }
    
    console.log(`Code submission from ${userName} in duel ${roomId}`);
    
    const problemData = await Question.findOne({ question_id: problem_id });
    if (!problemData) {
      socket.emit('error', { message: 'Problem not found' });
      return;
    }
    
    const submissions = problemData.test_cases.map((testCase) => {
      const plainSourceCode = source_code.trim();
      const encodedSourceCode = Buffer.from(plainSourceCode).toString('base64');
      const encodedStdin = Buffer.from(testCase.input.join('\n')).toString('base64');
      const encodedExpectedOutput = Buffer.from(testCase.expected_output).toString('base64');
      
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
    
    const results = await submitCodeAndCheckResult(submissions, expectedOutputs);
    console.log('Submission results:', results);
    
    // Evaluate results
    const allPassed = results.every((result) => result.isCorrect === true);
    const timeLimitExceeded = results.some(
      (result) => result.status === 'Time Limit Exceeded'
    );
    
    // Store submission result
    duel.submissions[socket.id] = {
      playerId: currentPlayer.userId,
      playerName: userName,
      allPassed,
      timeLimitExceeded,
      results,
      submittedAt: Date.now()
    };
    
    console.log(`Submission stored for ${userName}: allPassed=${allPassed}`);
    
    if (allPassed && !duel.winner) {
      // This player won!
      duel.winner = {
        id: socket.id,
        userId: currentPlayer.userId,
        name: userName,
        rating: currentPlayer.rating
      };
      duel.status = 'completed';
      
      const winner = currentPlayer;
      const loser = duel.players.find(player => player.socketId !== socket.id);
      
      // Calculate ELO rating changes
      const winnerELO = calculateELO(winner.rating, loser.rating, true);
      const loserELO = calculateELO(loser.rating, winner.rating, false);
      
      console.log(`Duel completed! Winner: ${userName}`);
      console.log(`Rating changes - Winner: ${winner.rating} -> ${winnerELO.newRating} (${winnerELO.ratingChange >= 0 ? '+' : ''}${winnerELO.ratingChange})`);
      console.log(`Rating changes - Loser: ${loser.rating} -> ${loserELO.newRating} (${loserELO.ratingChange >= 0 ? '+' : ''}${loserELO.ratingChange})`);
      
      // Update ratings in database
      await updateUserRating(winner.userId, winnerELO.newRating, winnerELO.ratingChange);
      await updateUserRating(loser.userId, loserELO.newRating, loserELO.ratingChange);
      
      // Emit game result to both players
      const gameResult = {
        winner: {
          name: userName,
          userId: winner.userId,
          oldRating: winner.rating,
          newRating: winnerELO.newRating,
          ratingChange: winnerELO.ratingChange
        },
        loser: {
          name: loser.displayName,
          userId: loser.userId,
          oldRating: loser.rating,
          newRating: loserELO.newRating,
          ratingChange: loserELO.ratingChange
        },
        duelId: roomId,
        completedAt: Date.now()
      };
      
      // Send detailed results to winner
      io.to(socket.id).emit('duelResult', {
        ...gameResult,
        result: 'victory',
        message: `Congratulations! You won the duel!`,
        ratingChange: winnerELO.ratingChange,
        newRating: winnerELO.newRating
      });
      
      // Send detailed results to loser
      io.to(loser.socketId).emit('duelResult', {
        ...gameResult,
        result: 'defeat',
        message: `${userName} solved the problem first!`,
        ratingChange: loserELO.ratingChange,
        newRating: loserELO.newRating
      });
      
      // Clean up the duel after a delay
      setTimeout(() => {
        activeDuels.delete(roomId);
        console.log(`Cleaned up duel room: ${roomId}`);
      }, 30000); // Clean up after 30 seconds
      
    } else if (timeLimitExceeded) {
      socket.emit('duelSubmissionResult', {
        success: false,
        message: 'Time Limit Exceeded on some test cases',
        results,
        canRetry: true
      });
    } else {
      socket.emit('duelSubmissionResult', {
        success: false,
        message: 'Some test cases failed',
        results,
        canRetry: true
      });
    }
    
  } catch (error) {
    console.error('Error in submitDuelCode:', error);
    socket.emit('error', { message: 'Server error', error: error.message });
  }
});

// Handle player leaving duel
socket.on('leaveDuel', (roomId) => {
  const duel = activeDuels.get(roomId);
  if (!duel) return;
  
  const leavingPlayer = duel.players.find(player => player.socketId === socket.id);
  if (!leavingPlayer) return;
  
  const remainingPlayer = duel.players.find(player => player.socketId !== socket.id);
  
  if (remainingPlayer && duel.status !== 'completed') {
    // Award victory to remaining player
    duel.winner = {
      id: remainingPlayer.socketId,
      userId: remainingPlayer.userId,
      name: remainingPlayer.displayName,
      rating: remainingPlayer.rating
    };
    duel.status = 'completed';
    
    // Calculate ratings (leaving player gets penalty)
    const winnerELO = calculateELO(remainingPlayer.rating, leavingPlayer.rating, true);
    const loserELO = calculateELO(leavingPlayer.rating, remainingPlayer.rating, false, 40); // Higher K-factor for leaving
    
    // Update ratings
    updateUserRating(remainingPlayer.userId, winnerELO.newRating, winnerELO.ratingChange);
    updateUserRating(leavingPlayer.userId, loserELO.newRating, loserELO.ratingChange);
    
    // Notify remaining player
    io.to(remainingPlayer.socketId).emit('duelResult', {
      result: 'victory',
      message: 'Your opponent left the duel. You win!',
      ratingChange: winnerELO.ratingChange,
      newRating: winnerELO.newRating,
      reason: 'opponent_left'
    });
  }
  
  // Clean up
  activeDuels.delete(roomId);
  console.log(`Player left duel ${roomId}, room cleaned up`);
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
 
}
);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("DB Connected"))
  .catch((error) => console.error("Connection error:", error));

server.listen(PORT, () => {
  console.log(`Server has started on http://localhost:${PORT}`);
});
app.use("/api", questionRoutes);
app.use("/api/rating", ratingRoutes)