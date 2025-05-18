import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Input, HyperText, GradualSpacing } from "@/components/ui";
import { Box } from "@chakra-ui/react";
import { CodeEditor } from "@/components";

// New notification component for player events
const PlayerNotification = ({ message, type }) => {
  // Define colors based on type: join (green), leave (red), info (blue)
  const bgColors = {
    join: "bg-green-500/20 border-green-500/30",
    leave: "bg-red-500/20 border-red-500/30",
    info: "bg-blue-500/20 border-blue-500/30"
  };
  
  const textColors = {
    join: "text-green-400",
    leave: "text-red-400",
    info: "text-blue-400"
  };
  
  const classes = `${bgColors[type] || bgColors.info} ${textColors[type] || textColors.info} px-4 py-2 rounded-md border animate-fadeIn text-center`;
  
  return (
    <div className={classes}>
      {message}
    </div>
  );
};

// Battle mode card component
const BattleModeCard = ({ icon, title, description, onClick }) => {
  return (
    <div 
      className="bg-[#12121f] border border-[#2a2a4a] hover:border-[#605cec] p-6 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(96,92,236,0.3)] cursor-pointer"
      onClick={onClick}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

// Leaderboard player card component
const LeaderboardPlayerCard = ({ rank, name, score }) => {
  let rankColor = "";
  let badgeClass = "";
  
  if (rank === 1) {
    rankColor = "text-yellow-400";
    badgeClass = "bg-yellow-500/20 border-yellow-500";
  } else if (rank === 2) {
    rankColor = "text-gray-300";
    badgeClass = "bg-gray-500/20 border-gray-500";
  } else if (rank === 3) {
    rankColor = "text-amber-600";
    badgeClass = "bg-amber-600/20 border-amber-600";
  }
  
  return (
    <div className="flex items-center space-x-4 bg-[#12121f] p-4 rounded-lg border border-[#2a2a4a]">
      <div className={`flex items-center justify-center h-10 w-10 rounded-full ${badgeClass} border ${rankColor} font-bold`}>
        {rank}
      </div>
      <div className="flex-grow">
        <h4 className="text-white font-medium">{name}</h4>
        <p className="text-gray-400 text-sm">{score} points</p>
      </div>
      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
    </div>
  );
};

const Home = ({
  timeup,
  isMatched,
  userName,
  setUserName,
  roomId,
  setRoomId,
  isRoomCreated,
  isRoomJoined,
  gameMessage,
  createRoom,
  joinRoom,
  socket,
  setTimerRunning,
  timerRunning,
  maxPlayers,
  setMaxPlayers,
  playerCount,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [notificationType, setNotificationType] = useState("info");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showRoomOptions, setShowRoomOptions] = useState(false);

  // Mock data for leaderboard
  const topPlayers = [
    { rank: 1, name: "CodeNinja", score: 12500 },
    { rank: 2, name: "ByteMaster", score: 10200 },
    { rank: 3, name: "SyntaxSlayer", score: 9700 },
  ];

  // Language icons for the duelist avatars
  const languageIcons = [
    { name: "JavaScript", color: "#f7df1e" },
    { name: "Python", color: "#3776ab" },
    { name: "Java", color: "#007396" },
    { name: "C++", color: "#00599c" }
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      const smallScreen = window.innerWidth < 768;
      setIsSmallScreen(smallScreen);
      setIsDialogOpen(smallScreen);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Listen for player join/leave events and show notifications
  useEffect(() => {
    if (socket) {
      socket.on("playerJoined", (data) => {
        setNotificationMessage(`${data.userName} joined the room!`);
        setNotificationType("join");
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setNotificationMessage(null);
        }, 5000);
      });
      
      socket.on("playerDisconnected", (data) => {
        if (data.playerName) {
          setNotificationMessage(`${data.playerName} left the room!`);
          setNotificationType("leave");
          
          // Hide notification after 5 seconds
          setTimeout(() => {
            setNotificationMessage(null);
          }, 5000);
        }
      });
      
      return () => {
        socket.off("playerJoined");
        socket.off("playerDisconnected");
      };
    }
  }, [socket]);

  const handleStartBattle = () => {
    setShowRoomOptions(true);
  };

  return (
    <>
      {isSmallScreen ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="bg-[#0a0a16] text-gray-200"
            style={{
              maxWidth: `calc(100% - 50px)`,
              height: "40%",
              margin: "auto",
              padding: "20px",
              border: "1px solid #3f3f6e",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
              overflowY: "auto",
            }}
          >
            <DialogHeader>
              <DialogTitle
                className="text-white text-xl text-center"
                style={{ marginBottom: "15px", fontWeight: "bold" }}
              >
                Access Restricted
              </DialogTitle>
              <DialogDescription
                className="text-gray-400 text-base text-center"
                style={{ lineHeight: "1.6", fontSize: "1.2rem" }}
              >
                You can't access this website on a smaller screen. Please open
                this website on a laptop or desktop screen.
                <br />
                <br />
                We're working on making this site responsive and accessible on
                smartphones as well. Stay tuned!
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ) : timeup ? (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-[#0a0a16]">
          <div className="text-6xl font-extrabold text-white py-8 animate-pulse">
            Time's Up!
          </div>
          <div className="text-xl text-gray-300 mt-4">
            The coding battle has ended.
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-md hover:from-indigo-700 hover:to-blue-600 transition-all"
          >
            Start a New Battle
          </Button>
        </div>
      ) : isMatched ? (
        <Box minH="100vh" bg="#0a0a16" color="gray.500" px={6} py={8} position="relative">
          {notificationMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
              <PlayerNotification message={notificationMessage} type={notificationType} />
            </div>
          )}
          <CodeEditor socket={socket} roomId={roomId} userName={userName} />
        </Box>
      ) : showRoomOptions ? (
        <div className="flex items-center justify-center min-h-[90vh] bg-[#0a0a16] bg-[radial-gradient(circle_at_center,rgba(67,67,153,0.1),transparent_50%)]">
          <div className="w-full max-w-md p-8 space-y-6 bg-[#12121f] rounded-2xl shadow-xl border border-[#2a2a4a]">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-10 h-10 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
              </div>
            </div>
            <HyperText
              className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 tracking-tight"
              text="CODE & CONQUER"
            />
            <p className="text-center text-gray-400 mb-6">Setup your coding battle room</p>
            <Input
              type="text"
              placeholder="Enter Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#1a1a2e] border-[#2a2a4a] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-white"
            />
            <Input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-[#1a1a2e] border-[#2a2a4a] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-white"
            />
            
            {!isRoomJoined && (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Number of Players:
                </label>
                <select 
                  value={maxPlayers} 
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full bg-[#1a1a2e] border-[#2a2a4a] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-white rounded-md p-2"
                  disabled={isRoomCreated}
                >
                  <option value="2">2 Players</option>
                  <option value="3">3 Players</option>
                  <option value="4">4 Players</option>
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={createRoom}
                disabled={isRoomCreated}
                className="w-full font-medium bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-4 py-3 rounded-md hover:from-indigo-700 hover:to-blue-600 transition-all disabled:opacity-50"
              >
                Create Room
              </Button>
              <Button
                onClick={joinRoom}
                disabled={isRoomJoined || isRoomCreated}
                className="w-full font-medium bg-gray-700 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-all disabled:opacity-50"
              >
                Join Room
              </Button>
            </div>
            
            <Button
              onClick={() => setShowRoomOptions(false)}
              className="w-full font-medium bg-transparent border border-gray-600 text-gray-400 px-4 py-3 rounded-md hover:bg-gray-800 transition-all"
            >
              Back to Home
            </Button>
            
            <div className="mt-4 min-h-[70px] overflow-hidden">
              {gameMessage && (
                <div className="text-center font-medium text-white p-3 bg-gradient-to-r from-indigo-900/40 to-blue-900/40 rounded-lg border border-indigo-500/30 shadow-lg">
                  {gameMessage}
                </div>
              )}
            </div>
            
            {isRoomCreated && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center text-sm text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Room Created - Waiting for Players ({playerCount}/{maxPlayers})
                </div>
              </div>
            )}
            
            {isRoomJoined && !isRoomCreated && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center text-sm text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Room Joined - Waiting for Host ({playerCount}/{maxPlayers})
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Cyberpunk Homepage
        <div className="min-h-screen bg-black bg-[radial-gradient(circle_at_center,rgba(96,92,236,0.15),transparent_70%)]">
          {/* Hero Banner */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40 z-0"></div>
            
            {/* Grid background effect */}
            <div className="absolute inset-0 z-0" style={{ 
              backgroundImage: 'linear-gradient(rgba(54, 54, 103, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(54, 54, 103, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
            
            {/* Glowing orbs background effect */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] z-0"></div>
            <div className="absolute top-40 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] z-0"></div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col items-center text-center">
                <HyperText
                  className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-violet-500 to-blue-500 mb-8 tracking-tight"
                  text="CODE & CONQUER"
                />
                
                <div className="relative w-full max-w-3xl mx-auto mb-12">
                  <div className="flex justify-center items-center">
                    {/* Left duelist with code icons */}
                    <div className="relative mr-4">
                      <div className="h-32 w-32 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-lg shadow-lg transform -rotate-6 overflow-hidden border-2 border-purple-400/30">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* Code language icons */}
                        {languageIcons.slice(0, 2).map((lang, idx) => (
                          <div 
                            key={`left-${lang.name}`}
                            className="absolute h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ 
                              backgroundColor: lang.color,
                              top: 10 + (idx * 25),
                              left: 10
                            }}
                          >
                            {lang.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* VS text */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(79,70,229,0.6)]">
                      <span className="text-white font-bold text-xl">VS</span>
                    </div>
                    
                    {/* Right duelist with code icons */}
                    <div className="relative ml-4">
                      <div className="h-32 w-32 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg transform rotate-6 overflow-hidden border-2 border-blue-400/30">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* Code language icons */}
                        {languageIcons.slice(2, 4).map((lang, idx) => (
                          <div 
                            key={`right-${lang.name}`}
                            className="absolute h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ 
                              backgroundColor: lang.color,
                              top: 10 + (idx * 25),
                              right: 10
                            }}
                          >
                            {lang.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-xl mb-10 max-w-2xl">
                  Prove your coding prowess in real-time battles against other developers.
                  Use your algorithmic skills to defeat opponents and climb the ranks.
                </p>
                
                <Button
                  onClick={handleStartBattle}
                  className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white rounded-md hover:from-fuchsia-700 hover:to-blue-700 transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(167,139,250,0.5)] animate-pulse"
                >
                  START A BATTLE
                </Button>
              </div>
            </div>
          </section>
          
          {/* Battle Modes Cards */}
          <section className="py-16 relative z-10">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold text-white text-center mb-4">Battle Modes</h2>
              <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Choose your battlefield and coding challenge format</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <BattleModeCard 
                  icon="⚔️" 
                  title="1v1 Random Duel" 
                  description="Match with a random opponent instantly"
                  onClick={handleStartBattle}
                />
                
                <BattleModeCard 
                  icon="👥" 
                  title="Challenge Friends" 
                  description="Send custom invites to friends"
                  onClick={handleStartBattle}
                />
                
                <BattleModeCard 
                  icon="🏆" 
                  title="Tournaments" 
                  description="Join weekly coding leagues"
                  onClick={handleStartBattle}
                />
              </div>
            </div>
          </section>
          
          {/* Live Leaderboard Preview */}
          <section className="py-16 relative z-10">
            <div className="container mx-auto px-4">
              <div className="max-w-md mx-auto">
                <h2 className="text-4xl font-bold text-white text-center mb-4">Live Leaderboard</h2>
                <p className="text-gray-400 text-center mb-12">Top coders this week</p>
                
                <div className="space-y-4">
                  {topPlayers.map((player) => (
                    <LeaderboardPlayerCard 
                      key={player.rank}
                      rank={player.rank}
                      name={player.name}
                      score={player.score}
                    />
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <Button
                    onClick={handleStartBattle}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-md hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Join the Competition
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default Home;
