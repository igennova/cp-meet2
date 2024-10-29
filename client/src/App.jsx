import React from "react";
import { Navbar, Footer } from "./components";
import Matchmaking from "./components/sockets/usermatch";

const App = () => {
  return (
    <>
      <div>
        <Navbar />
        <Matchmaking />
      </div>
      <Footer />
    </>
  );
};

export default App;
