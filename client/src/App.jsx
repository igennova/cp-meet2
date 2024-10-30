import React from "react";
import Matchmaking from "./components/sockets/usermatch";
import RandomQuestion from "./components/questions/question";

const App = () => {
  return (<div>
    <RandomQuestion/><Matchmaking/>
  
  </div>)
};

export default App;
