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

const lobbies = {};
const wordPools = {};

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎨 Skribbl.io Clone Server Running...");
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("create_lobby", (data, callback) => {
    const roomId = Math.random().toString(36).substring(7);
    const player = {
      id: socket.id,
      name: data.player?.name || "Guest",
      score: 0,
    };

    lobbies[roomId] = {
      players: [player],
      language: (data.language || "english").toLowerCase(),
      drawerIndex: 0,
      currentWord: null,
      rounds: data.rounds || 3,
      currentRound: 1,
      guessedPlayers: [],
      roundStartedAt: null,
    };

    socket.join(roomId);
    socket.data.lobbyId = roomId;

    io.to(roomId).emit("update_lobby", lobbies[roomId].players);
    callback({ roomId });
  });

  socket.on("join_lobby", ({ roomId, player }) => {
    const lobby = lobbies[roomId];
    if (!lobby) {
      socket.emit("lobby_not_found");
      return;
    }

    const alreadyIn = lobby.players.find((p) => p.id === socket.id);
    if (!alreadyIn) {
      lobby.players.push({
        id: socket.id,
        name: player.name,
        score: 0,
      });
    }

    socket.join(roomId);
    socket.data.lobbyId = roomId;

    io.to(roomId).emit("update_lobby", {
      players: lobby.players,
      rounds: lobby.rounds,
      currentRound: lobby.currentRound,
    });
  });

  socket.on("start_game", async (roomId) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

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

  socket.on("word_chosen", ({ roomId, word }) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    lobby.currentWord = word;
    lobby.revealedLetters = [];
    lobby.guessedPlayers = [];
    lobby.roundStartedAt = Date.now();

    io.to(roomId).emit("round_started", {
      roomId,
      wordLength: word.length,
      drawerId: socket.id,
      currentRound: lobby.currentRound,
      totalRounds: lobby.rounds,
    });
  });

  socket.on("reveal_letter", ({ roomId, index, letter }) => {
    socket.to(roomId).emit("reveal_letter", { index, letter });
  });

  socket.on("send_message", ({ roomId, message, player }) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    const normalizedGuess = message.trim().toLowerCase();
    const actualWord = lobby.currentWord?.trim().toLowerCase();

    if (normalizedGuess === actualWord) {
      if (!lobby.guessedPlayers.includes(player.name)) {
        lobby.guessedPlayers.push(player.name);

        const elapsed = lobby.roundStartedAt
          ? Math.floor((Date.now() - lobby.roundStartedAt) / 1000)
          : 0;

        const guesserPoints = Math.max(20, 100 - elapsed * 2);
        const drawer = lobby.players[lobby.drawerIndex % lobby.players.length];
        const drawerBonus = 50;

        const guesser = lobby.players.find((p) => p.name === player.name);
        if (guesser) guesser.score += guesserPoints;
        if (drawer) drawer.score += drawerBonus;

        io.to(roomId).emit("receive_message", {
          player: { name: player.name, system: true }, // флагче за стил
          message: `🎉 guessed the word! (+${guesserPoints} pts)`,
        });
        io.to(roomId).emit("update_scores", {
          players: lobby.players.map((p) => ({
            name: p.name,
            score: p.score,
          })),
        });

        setTimeout(() => {
          io.to(roomId).emit("clear_canvas");
          handleEndRound(roomId);
        }, 1000);
      }
    } else {
      io.to(roomId).emit("receive_message", { player, message });
    }
  });

  socket.on("end_round", async (roomId) => {
    await handleEndRound(roomId);
  });

  socket.on("start_draw", (data) => {
    socket.broadcast.emit("start_draw", data);
  });

  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear_canvas", () => {
    io.emit("clear_canvas");
  });

  socket.on("check_lobby_exists", (roomId, callback) => {
    callback(!!lobbies[roomId]);
  });

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
