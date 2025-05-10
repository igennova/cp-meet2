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
      ) : (
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
              text="DSA BATTLE"
            />
            <p className="text-center text-gray-400 mb-6">Challenge your friends to a coding duel</p>
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
      )}
    </>
  );
};

export default Home;
