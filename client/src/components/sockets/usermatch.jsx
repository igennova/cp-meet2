// import React, { useEffect, useState } from "react";
// import { io } from "socket.io-client";
// import { Input, Button } from "@/components/ui";

// const socket = io("http://localhost:5000");

// const Matchmaking = ({ name, setName, onMatchFound }) => {
//   const [isInQueue, setIsInQueue] = useState(false); // State to track if user has joined the queue

//   useEffect(() => {
//     // Listen for matchFound event
//     socket.on("matchFound", ({ roomId, opponentName }) => {
//       alert(`You have been matched with ${opponentName}`);
//       onMatchFound(); // Call the function passed from the App component
//     });

//     // Cleanup on unmount
//     return () => {
//       socket.off("matchFound");
//     };
//   }, [onMatchFound]);

//   const handleSetNameAndJoinQueue = () => {
//     if (name.trim()) {
//       socket.emit("setName", name);
//       socket.emit("joinQueue");
//       setIsInQueue(true); // Update state to show user is in the queue
//     } else {
//       alert("Please enter a valid name.");
//     }
//   };

//   return (
//     <div className="p-5">
//       {isInQueue ? (
//         <p>Waiting for a match...</p>
//       ) : (
//         // <>
//         //   <input
//         //     type="text"
//         //     placeholder="Enter your name"
//         //     value={name}
//         //     onChange={(e) => setName(e.target.value)}
//         //     className="w-full"
//         //   />
//         //   <button
//         //     onClick={handleSetNameAndJoinQueue}
//         //     className="font-inter font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md ml-2"
//         //   >
//         //     Join
//         //   </button>
//         // </>
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="w-full max-w-md p-4 space-y-4">
//             <Input
//               type="text"
//               placeholder="Enter your name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full"
//             />
//             <Button
//               onClick={handleSetNameAndJoinQueue}
//               className="w-full font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md"
//             >
//               Join
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Matchmaking;
