import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 🔧 Емулирай __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Зареждане на firebase-key.json ръчно
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "firebase-key.json"), "utf-8")
);

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const lobbies = {}; // { [roomId]: { players, language, drawerIndex, currentWord } }
const wordPools = {}; // кеш на думи по език

app.use(cors());
app.get("/", (req, res) => {
  res.send("🎨 Skribbl.io Clone Server Running...");
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
      language: (data.language || "english").toLowerCase(),
      drawerIndex: 0,
      currentWord: null,
      rounds: data.rounds || 3,
      currentRound: 1,
    };

    socket.join(roomId);
    socket.data.lobbyId = roomId;

    io.to(roomId).emit("update_lobby", lobbies[roomId].players);
    callback({ roomId });
  });

  // 📌 JOIN LOBBY
  socket.on("join_lobby", ({ roomId, player }) => {
    console.log(`📥 ${player.name} is joining lobby ${roomId}`);

    const lobby = lobbies[roomId];
    if (!lobby) {
      socket.emit("lobby_not_found");
      return;
    }

    const alreadyIn = lobby.players.find((p) => p.id === socket.id);
    if (!alreadyIn) {
      lobby.players.push(player);
    }

    socket.join(roomId);
    socket.data.lobbyId = roomId;

    console.log(`✅ ${player.name} joined room ${roomId}`);
    io.to(roomId).emit("update_lobby", {
      players: lobby.players,
      rounds: lobby.rounds,
      currentRound: lobby.currentRound,
    });
  });

  // 📌 START GAME
  socket.on("start_game", async (roomId) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    console.log(
      "👥 Players in lobby:",
      lobby.players.map((p) => p.name)
    );

    const socketsInRoom = await io.in(roomId).allSockets();
    console.log("📡 Actual sockets in room:", Array.from(socketsInRoom));

    // 🟢 Уведоми всички клиенти да се преместят към /game
    io.to(roomId).emit("game_started", { roomId });

    const drawer = lobby.players[lobby.drawerIndex % lobby.players.length];
    const lang = lobby.language;

    try {
      const wordPool = await loadWordsForLanguage(lang);
      const options = wordPool.sort(() => 0.5 - Math.random()).slice(0, 3);

      io.to(drawer.id).emit("choose_word", options);
    } catch (error) {
      console.error("🔥 Error loading words:", error);
    }
  });
  socket.on("set_word", ({ roomId, word, drawerId }) => {
    io.to(drawerId).emit("set_word", word);
  });
  socket.on("reveal_letter", ({ roomId, index, letter }) => {
    socket.to(roomId).emit("reveal_letter", { index, letter });
  });

  // 📌 WORD CHOSEN
  socket.on("word_chosen", ({ roomId, word }) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    lobby.currentWord = word;
    lobby.revealedLetters = [];

    io.to(roomId).emit("round_started", {
      roomId,
      wordLength: word.length,
      drawerId: socket.id,
      currentRound: lobby.currentRound,
      totalRounds: lobby.rounds,
    });

    // 🔜 Тук ще добавим reveal + таймер
  });
  socket.on("end_round", async (roomId) => {
    await handleEndRound(roomId);
  });
  // 📌 CHAT
  socket.on("send_message", ({ roomId, message, player }) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    const normalizedGuess = message.trim().toLowerCase();
    const actualWord = lobby.currentWord?.trim().toLowerCase();

    // 🎯 Check if guess is correct
    if (normalizedGuess === actualWord) {
      io.to(roomId).emit("receive_message", {
        player,
        message: `🎉 ${player.name} guessed the word!`,
      });

      io.to(roomId).emit("correct_guess", { player, word: lobby.currentWord });

      setTimeout(() => {
        io.to(roomId).emit("clear_canvas");
        handleEndRound(roomId); // ✅ правилен начин
      }, 1000);
    } else {
      io.to(roomId).emit("receive_message", { player, message });
    }
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

  // 📌 LOBBY CHECK
  socket.on("check_lobby_exists", (roomId, callback) => {
    callback(!!lobbies[roomId]);
  });

  // 📌 DISCONNECT
  socket.on("disconnect", () => {
    const lobbyId = socket.data.lobbyId;
    if (!lobbyId || !lobbies[lobbyId]) return;

    lobbies[lobbyId].players = lobbies[lobbyId].players.filter(
      (p) => p.id !== socket.id
    );

    if (lobbies[lobbyId].players.length === 0) {
      delete lobbies[lobbyId];
      console.log(`🧹 Lobby ${lobbyId} deleted`);
    } else {
      io.to(lobbyId).emit("update_lobby", lobbies[lobbyId].players);
    }

    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// 🔁 Зареждане на думи от Firestore по език
async function loadWordsForLanguage(lang) {
  if (wordPools[lang]) return wordPools[lang];

  const doc = await firestore.collection("words").doc(`words-${lang}`).get();
  if (!doc.exists) throw new Error(`❌ No word list for language: ${lang}`);

  const words = doc.data().words;
  wordPools[lang] = words;
  return words;
}
async function handleEndRound(roomId) {
  const lobby = lobbies[roomId];
  if (!lobby) return;

  lobby.drawerIndex++;
  const isNewRound = lobby.drawerIndex % lobby.players.length === 0;

  if (isNewRound) {
    lobby.currentRound++;
  }

  if (lobby.currentRound > lobby.rounds) {
    io.to(roomId).emit("game_over");
    return;
  }

  const drawer = lobby.players[lobby.drawerIndex % lobby.players.length];
  const lang = lobby.language;

  try {
    const wordPool = await loadWordsForLanguage(lang);
    const options = wordPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    io.to(drawer.id).emit("choose_word", options);
  } catch (err) {
    console.error("🔥 Error loading words:", err);
  }
}
// 🟢 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
