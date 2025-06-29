export default function handleDisconnect(io, socket, lobbies) {
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
  
      const lobbyId = socket.data.lobbyId;
      console.log(1);

      if (!lobbyId || !lobbies[lobbyId]) return;

      const lobby = lobbies[lobbyId];
      const isHost = lobby.hostId === socket.id;
      console.log(2);

      lobby.players = lobby.players.filter(p => p.id !== socket.id);
      console.log(3);

      if (lobby.players.length === 0) {
        delete lobbies[lobbyId];
        console.log(`Lobby ${lobbyId} deleted`);
        return;
      }
  
      if (lobby.gameStarted) {
        console.log(4);

        io.to(lobbyId).emit("player_left", {
          message: "A player has left the game. The game is abandoned.",
        });
        delete lobbies[lobbyId];
        console.log(`Game abandoned in lobby ${lobbyId}`);
        return;
      }
  
      if (isHost) {
        io.to(lobbyId).emit("lobby_closed");
        delete lobbies[lobbyId];
        console.log(`Host left → lobby ${lobbyId} destroyed`);
      } else {
        io.to(lobbyId).emit("update_lobby", {
          players: lobby.players,
          rounds: lobby.rounds,
          currentRound: lobby.currentRound,
        });
        console.log(`User ${socket.id} disconnected from lobby ${lobbyId}`);
      }
    });
  }
  