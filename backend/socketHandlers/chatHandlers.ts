import { Server, Socket } from "socket.io";
import { Lobbies, ChatMessageData, WordPools } from "../types/index.js";
import { endRound } from "./gameHandlers.js";

export default function registerChatHandlers(
  io: Server, 
  socket: Socket, 
  lobbies: Lobbies, 
  wordPools: WordPools
): void {
  socket.on("send_message", ({ roomId, message, player }: ChatMessageData) => {
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
        if (guesser) {
          guesser.score += guesserPoints;
          guesser.correctGuesses = (guesser.correctGuesses || 0) + 1; 
        }

        if (drawer) drawer.score += drawerBonus;

        io.to(roomId).emit("receive_message", {
          player: { name: player.name, system: true },
          message: `guessed the word! (+${guesserPoints} pts)`,
        });

        io.to(roomId).emit("update_scores", {
          players: lobby.players.map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            correctGuesses: p.correctGuesses || 0,
          })),
        });

        setTimeout(async () => {
          io.to(roomId).emit("clear_canvas");
          await endRound(roomId, io, lobbies, wordPools);
        }, 1000);
      }
    } else {
      io.to(roomId).emit("receive_message", { player, message });
    }
  });
} 