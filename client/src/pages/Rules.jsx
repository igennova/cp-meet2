import React, { useState, createContext, useContext } from "react";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Create a context for dialog state management
const DialogContext = createContext({
  isOpen: false,
  setIsOpen: () => {},
});

// Provider component to handle the dialog state
export const DialogProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

const Rules = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const rules = [
    "You should take input as per the given format and print the output.",
    "You can select the language you desire from the dropdown menu.",
    "By default, the selected language is Python.",
    "You can only try submitting your solution a maximum of 3 times.",
    "You have only 6 minutes to solve the problem.",
    "Whoever solves the problem first is the winner.",
    "Stay fair and enjoy the challenge!",
  ];

  // Use simple button instead of Dialog to avoid issues
  const openRulesDialog = () => {
    setIsDialogOpen(!isDialogOpen);
  };

  return (
    <>
      <Button 
        className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-md hover:from-indigo-700 hover:to-blue-600 transition-all shadow-md"
        onClick={openRulesDialog}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
        Rules
      </Button>
      
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={openRulesDialog}>
          <div 
            className="bg-[#0a0a16] text-gray-200 max-w-[350px] sm:max-w-[450px] w-full p-6 border border-[#2a2a4a] shadow-lg rounded-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 text-lg sm:text-xl font-bold mb-2">
                1v1 DSA Battle Rules
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Please follow these rules for a fun and fair competition:
              </p>
            </div>
            <div className="py-4">
              <ul className="space-y-3">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start text-white text-sm sm:text-base">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-full py-2 px-4 bg-gradient-to-r from-indigo-900/30 to-blue-900/30 rounded-lg border border-indigo-800/40 text-center">
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-bold text-lg">
                  All the best!
                </p>
              </div>
            </div>
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={openRulesDialog}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Rules;
