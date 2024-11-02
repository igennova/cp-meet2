import React from "react";
import { Button, Text } from "@chakra-ui/react";

const Card = ({ number }) => {
  return (
    /* From Uiverse.io by Uncannypotato69 */
    <Button>
      {/* // <div className="h-[6em] w-[17em] border-2 border-[rgba(75,30,133,0.5)] rounded-[1.5em] bg-gradient-to-br from-[rgba(75,30,133,1)] to-[rgba(75,30,133,0.01)] text-white font-nunito p-[1em] flex justify-between items-center gap-[0.75em] backdrop-blur-[12px]"> */}
      <Text>Test Case {number}</Text>

      <button className="w-4 h-4 border-[1px] rounded-full flex justify-center items-center gap-[0.5em] overflow-hidden group hover:translate-y-[0.125em] duration-200 backdrop-blur-[12px]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
        </svg>
      </button>
      {/* // </div> */}
    </Button>
  );
};

export default Card;
