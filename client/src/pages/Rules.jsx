import React from "react";
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

const Rules = () => {
  const rules = [
    "You should take input as per the given format and print the output.",
    "You can select the language you desire from the dropdown menu.",
    "By default, the selected language is Python.",
    "You can only try submitting your solution a maximum of 3 times.",
    "You have only 6 minutes to solve the problem.",
    "Whoever solves the problem first is the winner.",
    "Stay fair and enjoy the challenge!",
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-medium rounded-md hover:from-indigo-700 hover:to-blue-600 transition-all shadow-md">
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
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a16] text-gray-200 max-w-[350px] sm:max-w-[450px] w-full p-6 border border-[#2a2a4a] shadow-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 text-lg sm:text-xl font-bold mb-2">
            1v1 DSA Battle Rules
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm sm:text-base">
            Please follow these rules for a fun and fair competition:
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <div className="w-full py-2 px-4 bg-gradient-to-r from-indigo-900/30 to-blue-900/30 rounded-lg border border-indigo-800/40 text-center">
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-bold text-lg">
              All the best!
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Rules;
