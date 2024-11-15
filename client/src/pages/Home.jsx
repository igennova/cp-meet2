import React from "react";
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
}) => {
  return (
    <>
      {timeup ? (
        <div className="text-center text-4xl text-white py-8">
          Time's Up! The game is over.
        </div>
      ) : isMatched ? (
        <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
          <CodeEditor socket={socket} roomId={roomId} userName={userName} />
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
