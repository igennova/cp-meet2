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

const Rules = ({ selectedLanguage }) => {
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
        <Button className="w-full font-medium bg-[#6469ff] text-white px-4 py-2 rounded-md">
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black text-gray-200 sm:max-w-[425px] border border-gray-700 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-white">1v1 DSA Battle Rules</DialogTitle>
          <DialogDescription className="text-gray-400">
            Please follow these rules for a fun and fair competition:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="list-decimal pl-5 space-y-2">
            {rules.map((rule, index) => (
              <li key={index} className="text-white">
                {rule}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <p className="text-green-500 font-bold text-center w-full">
            All the best!
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Rules;
