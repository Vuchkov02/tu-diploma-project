import { Server, Socket } from "socket.io";
import { loadWordsForLanguage } from "../utils/words.js";
import { Lobbies, WordPools, WordChoiceData, SetWordData, RevealLetterData } from "../types/index.js";

export default function registerGameHandlers(
  io: Server, 
  socket: Socket, 
  lobbies: Lobbies, 
  wordPools: WordPools
): void {
  socket.on("start_game", async (roomId: string) => {
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
      console.error("Error loading words:", error);
    }
  });

  socket.on("set_word", ({ roomId, word, drawerId }: SetWordData) => {
    io.to(drawerId).emit("set_word", word);
  });

  socket.on("reveal_letter", ({ roomId, index, letter }: RevealLetterData) => {
    io.to(roomId).emit("reveal_letter", { index, letter });
  });

  socket.on("word_chosen", ({ roomId, word }: WordChoiceData) => {
    const lobby = lobbies[roomId];
    if (!lobby) return;

    const drawer = lobby.players[lobby.drawerIndex % lobby.players.length];
    if (!drawer || drawer.id !== socket.id) {
      console.warn("Someone else tried to choose word!");
      return;
    }

    console.log("Word chosen:", word, "length:", word.length);

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

  socket.on("end_round", async (roomId: string) => {
    await endRound(roomId, io, lobbies, wordPools);
  });
}

export async function endRound(
  roomId: string, 
  io: Server, 
  lobbies: Lobbies, 
  wordPools: WordPools
): Promise<void> {
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
} 