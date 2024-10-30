import React from "react";
import { Navbar, Footer } from "./components";
import Matchmaking from "./components/sockets/usermatch";
import RandomQuestion from "./components/questions/question";

const App = () => {
  return <div><Matchmaking/></div>;
};

export default App;
