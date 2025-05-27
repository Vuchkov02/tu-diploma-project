import { loadWordsForLanguage } from "../utils/words.js";

export default function registerGameHandlers(io, socket, lobbies, wordPools) {
  socket.on("start_game", async (roomId) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    io.to(roomId).emit("game_started", { roomId });

    const drawer = lobby.players[lobby.drawerIndex % lobby.players.length];
    const lang = lobby.language;

    socket.to(roomId).emit("choose_word_status", {
      drawerId: drawer.id,
    });

    try {
      const wordPool = await loadWordsForLanguage(lang, wordPools);
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

    socket.to(roomId).emit("word_chosen_status");

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

  socket.on("end_round", async (roomId) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    lobby.drawerIndex++;
    const isNewRound = lobby.drawerIndex % lobby.players.length === 0;

    if (isNewRound) lobby.currentRound++;

    if (lobby.currentRound > lobby.rounds) {
      io.to(roomId).emit("game_over");
      return;
    }

    const drawer = lobby.players[lobby.drawerIndex % lobby.players.length];
    const lang = lobby.language;

    lobby.players.forEach((p) => {
      if (p.id !== drawer.id) {
        io.to(p.id).emit("choose_word_status", {
          drawerId: drawer.id,
        });
      }
    });

    try {
      const wordPool = await loadWordsForLanguage(lang, wordPools);
      const options = wordPool.sort(() => 0.5 - Math.random()).slice(0, 3);
      io.to(drawer.id).emit("choose_word", options);
    } catch (err) {
      console.error("🔥 Error loading words:", err);
    }
  });
}
export async function endRound(roomId, io, lobbies) {
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

  lobby.players.forEach((p) => {
    if (p.id !== drawer.id) {
      io.to(p.id).emit("choose_word_status", {
        drawerId: drawer.id,
      });
    }
  });

  const { loadWordsForLanguage } = await import("../utils/words.js");
  const wordPool = await loadWordsForLanguage(lang, {});

  const options = wordPool.sort(() => 0.5 - Math.random()).slice(0, 3);
  io.to(drawer.id).emit("choose_word", options);
}
