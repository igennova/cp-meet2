import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@chakra-ui/react";

const socket = io("http://localhost:5000");

const Matchmaking = () => {
  const [name, setName] = useState(""); // State to hold the user's name
  const [isMatched, setIsMatched] = useState(false); // State to track if matched
  const [isInQueue, setIsInQueue] = useState(false); // State to track if user has joined the queue

  useEffect(() => {
    // Listen for matchFound event
    socket.on("matchFound", ({ roomId, opponentName }) => {
      alert(`You have been matched with ${opponentName}`);
      setIsMatched(true); // Update state to indicate match found
    });

    // Listen for error messages
    socket.on("error", (message) => {
      alert(message); // Show error to user
    });

    // Cleanup on unmount
    return () => {
      socket.off("matchFound"); // Remove the event listener
      socket.off("error");
    };
  }, []);

  const handleSetNameAndJoinQueue = () => {
    if (name.trim()) {
      // Emit setName to set the user's name on the server
      socket.emit("setName", name);
      // Emit joinQueue to join the matchmaking queue
      socket.emit("joinQueue");
      setIsInQueue(true); // Update state to show user is in the queue
    } else {
      alert("Please enter a valid name.");
    }
  };

  return (
    <div className="p-5">
      {isMatched ? ( // Conditional rendering based on isMatched state
        <h1>Done! You are matched!</h1>
      ) : (
        <>
          <h1>Welcome to CP Buddy!</h1>
          {isInQueue ? ( // Show waiting message if in queue
            <p>Waiting for a match...</p>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-2 p-2 border rounded"
              />
              <button
                onClick={handleSetNameAndJoinQueue}
                className="p-2 bg-indigo-700 text-white rounded ml-2"
              >
                Join
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Matchmaking;
