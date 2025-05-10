import { Rules } from "@/pages";
import { Link } from "react-router-dom";
import React from "react";

const Navbar = ({ isMatched, timeup, formatTime, time, playerCount, maxPlayers }) => {
  return (
    <nav className="w-full flex justify-between items-center sm:px-8 px-4 py-3 bg-[#0d0d1c] border-b border-[#2a2a4a] shadow-md">
      <Link to="/">
        <div className="flex items-center space-x-2 group">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-2 rounded-lg transform group-hover:scale-105 transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-5 text-white sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
          </div>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 self-center text-xl font-bold whitespace-nowrap">
            CP Buddy
          </div>
        </div>
      </Link>
      <div className="flex justify-center items-center space-x-6">
        {isMatched && !timeup && (
          <>
            <div className="px-4 py-1 bg-gradient-to-r from-indigo-900/40 to-blue-900/40 rounded-lg border border-indigo-800/50">
              <div className="text-2xl font-mono font-medium text-white">
                {formatTime(time)}
              </div>
            </div>
            {playerCount && maxPlayers && (
              <div className="px-4 py-1 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-lg border border-purple-800/50">
                <div className="text-lg font-medium text-white flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                  <span>{playerCount}/{maxPlayers}</span>
                </div>
              </div>
            )}
          </>
        )}
        <Rules />
      </div>
    </nav>
  );
};

export default Navbar;
