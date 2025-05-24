# Duel System Backend Implementation

## OverviewThe duel system allows users to join a queue and get automatically matched with other players for 1v1 coding competitions. The enhanced system includes a question reading phase and built-in sample problems.## Game Flow1. **`'waiting'`** - Waiting for opponent to join2. **`'starting'`** - 3-second countdown ("Get Ready!")3. **`'question'`** - 10 seconds to read and understand the problem ⭐ **NEW**4. **`'active'`** - 60-second coding phase with timer5. **`'finished'`** - Game over with results

## Socket.io Events

### Client to Server Events

#### `joinDuelQueue`
Join the duel queue to find a match.
```javascript
socket.emit('joinDuelQueue', {
  userId: "user_id",
  displayName: "username",
  email: "user@example.com",
  profilePicture: "profile_url"
});
```

#### `leaveDuelQueue`
Leave the duel queue.
```javascript
socket.emit('leaveDuelQueue');
```

#### `joinDuelRoom`
Join a duel room after getting matched.
```javascript
socket.emit('joinDuelRoom', {
  roomId: "duel_room_id",
  user: { displayName: "username" }
});
```

#### `submitCode`Submit code solution during a duel.```javascriptsocket.emit('submitCode', {  roomId: "duel_room_id",  source_code: "your_code_here",  language_id: 71, // Python  userName: "username"});```

### Server to Client Events

#### `duelQueueStatus`
Queue status updates.
```javascript
socket.on('duelQueueStatus', (data) => {
  console.log(data.position); // Position in queue
  console.log(data.inQueue); // Boolean
  console.log(data.message); // Status message
});
```

#### `duelMatchFound`Match found notification.```javascriptsocket.on('duelMatchFound', (data) => {  console.log(data.roomId); // Room ID to join  console.log(data.question); // Complete question object ⭐ NEW  console.log(data.opponent); // Opponent info});```#### `gameStarting` ⭐ NEW3-second countdown before question phase.```javascriptsocket.on('gameStarting', (countdown) => {  console.log(`Game starting in ${countdown} seconds`);});```

#### `gameStateUpdate` (Updated)Game state updates during match.```javascriptsocket.on('gameStateUpdate', (data) => {  console.log(data.status); // 'starting', 'question', or 'active' ⭐ NEW  console.log(data.timeLeft); // Seconds remaining  console.log(data.players); // Player list  console.log(data.question); // Complete question object ⭐ NEW});```

#### `gameFinished` (Updated)Match completion notification.```javascriptsocket.on('gameFinished', (data) => {  console.log(data.winner); // Winner info  console.log(data.loser); // Loser info  console.log(data.reason); // Why match ended});```

#### `duelSubmissionResult`
Code submission feedback.
```javascript
socket.on('duelSubmissionResult', (data) => {
  console.log(data.success); // Boolean
  console.log(data.message); // Feedback message
  console.log(data.results); // Test case results
});
```

#### `duelError`
Error notifications.
```javascript
socket.on('duelError', (data) => {
  console.log(data.message); // Error message
});
```

## REST API Endpoints

### Get Question for Duel
```
GET /api/duel/question/:questionId
```

### Get Random Question
```
GET /api/duel/random
```

### Rating System Endpoints
```
GET /api/rating/user/:userId
GET /api/rating/leaderboard
GET /api/rating/user/:userId/matches
POST /api/rating/match
```

## Required Dependencies

1. Install uuid package:
```bash
npm install uuid
```

2. Update the import in `ratingController.js`:
```javascript
import { v4 as uuidv4 } from 'uuid';
```

3. Replace the temporary UUID generator with:
```javascript
const matchId = uuidv4();
```

## Features

- **Random Matching**: Automatic 1v1 player matching
- **Real-time Timer**: 60-second countdown for each duel
- **ELO Rating System**: Track player rankings and improvements
- **Multiple Match Types**: Support for duels, contests, tournaments
- **Judge0 Integration**: Automatic code execution and testing
- **Disconnection Handling**: Graceful handling of player disconnections

## Database Models

### Match Schema
- `matchId`: Unique identifier
- `participants`: Array of player data with results
- `matchType`: 'duel', 'coding_contest', etc.
- `questionId`: Reference to question
- `duration`: Match duration

### UserRating Schema
- `userId`: Reference to user
- `currentRating`: Current ELO rating
- `wins/losses/draws`: Match statistics
- `ratingHistory`: Historical rating changes

## Usage Example

Frontend integration example:
```javascript
// Join duel queue
socket.emit('joinDuelQueue', userInfo);

// Listen for match
socket.on('duelMatchFound', ({ roomId, questionId }) => {
  // Navigate to duel screen
  socket.emit('joinDuelRoom', { roomId, user: userInfo });
});

// Submit solution
socket.emit('submitDuelCode', {
  roomId,
  source_code: codeFromEditor,
  language_id: selectedLanguage,
  problem_id: questionId,
  userName: userInfo.displayName
});
```

## Testing

1. Start the server
2. Connect multiple clients
3. Have them join the duel queue
4. Watch automatic matching and game flow
5. Test code submission and rating updates 