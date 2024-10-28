import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const startServer = async () => {
  try {
    app.listen(PORT, () =>
      console.log(`Server has started on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();
