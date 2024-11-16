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
  setIsTimerRunning
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return (
    <>
      {isSmallScreen ? (
        <Dialog open>
          <DialogContent
            className="bg-black text-gray-200"
            style={{
              maxWidth: `calc(100% - 50px)`,
              height: "40%",
              margin: "auto",
              padding: "20px",
              border: "1px solid gray",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
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
        <div className="text-center text-4xl text-white py-8">
          Time's Up! The game is over.
        </div>
      ) : isMatched ? (
        <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
          <CodeEditor socket={socket} roomId={roomId} userName={userName} setIsTimerRunning={setIsTimerRunning} />
        </Box>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md p-4 space-y-4">
            <HyperText
              className="text-4xl font-bold text-white"
              text="1V1 DSA BATTLE"
            />
            <Input
              type="text"
              placeholder="Enter Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full"
            />
            <Input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full"
            />
            <Button
              onClick={createRoom}
              disabled={isRoomCreated}
              className="w-full font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md"
            >
              Create Room
            </Button>
            <Button
              onClick={joinRoom}
              disabled={isRoomJoined || isRoomCreated}
              className="w-full font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md"
            >
              Join Room
            </Button>
            <GradualSpacing
              className="font-display text-center text-4xl font-bold -tracking-widest text-white"
              text={gameMessage}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
