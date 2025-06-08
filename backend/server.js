import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import { initializeFirebase } from "./firebase/init.js";
import { registerSocketHandlers } from "./socketHandlers/index.js";

dotenv.config();
initializeFirebase();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.get("/", (_, res) => res.send("DRAW & GUESS Server Running..."));

const lobbies = {};
const wordPools = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  registerSocketHandlers(io, socket, lobbies, wordPools);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
