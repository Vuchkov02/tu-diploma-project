import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const lobbies = {}; // { [roomId]: { players: [...], maxPlayers, language } }

// Middleware
app.use(cors());
app.get("/", (req, res) => {
  res.send("Skribbl.io Clone Server Running...");
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // 📌 CREATE LOBBY
  socket.on("create_lobby", (data, callback) => {
    const roomId = Math.random().toString(36).substring(7);
    const player = {
      id: socket.id,
      name: data.player?.name || "Guest",
    };

    lobbies[roomId] = {
      players: [player],
      maxPlayers: data.maxPlayers || 4,
      language: data.language || "English",
    };

    socket.join(roomId);
    socket.data.lobbyId = roomId;
    io.to(roomId).emit("update_lobby", lobbies[roomId].players);
    callback({ roomId });
  });

  // 📌 JOIN LOBBY
  socket.on("join_lobby", ({ roomId, player }) => {
    if (lobbies[roomId]) {
      const alreadyIn = lobbies[roomId].players.find((p) => p.id === socket.id);
      if (!alreadyIn) {
        lobbies[roomId].players.push(player);
      }
      socket.join(roomId);
      socket.data.lobbyId = roomId;
      io.to(roomId).emit("update_lobby", lobbies[roomId].players);
    } else {
      socket.emit("lobby_not_found");
    }
  });

  // 📌 START GAME
  socket.on("start_game", (roomId) => {
    io.to(roomId).emit("game_started", {});
  });

  // 📌 MESSAGING
  socket.on("send_message", ({ roomId, message, player }) => {
    console.log("💬 MESSAGE:", player.name, message);
    io.to(roomId).emit("receive_message", { player, message });
  });

  // 📌 DRAWING EVENTS
  socket.on("start_draw", (data) => {
    socket.broadcast.emit("start_draw", data);
  });

  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear_canvas", () => {
    io.emit("clear_canvas");
  });

  // 📌 DISCONNECT
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    const lobbyId = socket.data.lobbyId;

    if (lobbyId && lobbies[lobbyId]) {
      lobbies[lobbyId].players = lobbies[lobbyId].players.filter(
        (p) => p.id !== socket.id
      );

      if (lobbies[lobbyId].players.length === 0) {
        delete lobbies[lobbyId];
        console.log(`🧹 Lobby ${lobbyId} deleted (empty)`);
      } else {
        io.to(lobbyId).emit("update_lobby", lobbies[lobbyId].players);
      }
    }
  });
  socket.on("check_lobby_exists", (roomId, callback) => {
  const exists = !!lobbies[roomId];
  callback(exists);
});
});

// 🟢 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
