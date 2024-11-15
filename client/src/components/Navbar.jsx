import { Rules } from "@/pages";
import { Link } from "react-router-dom";

const Navbar = ({ isMatched, timeup, formatTime, time }) => {
  return (
    <nav className="w-full flex justify-between items-center sm:px-8 px-4 py-4 border-b border-b-gray-500">
      <Link to="/">
        <div className="flex items-center space-x-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-6 mr-3 text-white sm:h-9"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
            />
          </svg>
          <div className="text-white self-center text-xl font-semibold whitespace-nowrap">
            CP Buddy
          </div>
        </div>
      </Link>
      <div className="flex justify-center items-center space-x-4">
        {isMatched && !timeup ? (
          <div className="text-2xl font-medium text-white">
            {formatTime(time)}
          </div>
        ) : null}
        <Rules />
      </div>
    </nav>
  );
};

export default Navbar;
