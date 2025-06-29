export default function registerLobbyHandlers(io, socket, lobbies) {
  socket.on("create_lobby", (data, callback) => {
    const roomId = Math.random().toString(36).substring(7);
    const player = {
      id: socket.id,
      name: data.player?.name || "Guest",
      score: 0,
    };

    lobbies[roomId] = {
      players: [player],
      hostId: socket.id,
      language: (data.language || "english").toLowerCase(),
      drawerIndex: 0,
      currentWord: null,
      rounds: data.rounds || 3,
      currentRound: 1,
      guessedPlayers: [],
      roundStartedAt: null,
      maxPlayers: data.maxPlayers || 4
    };

    socket.join(roomId);
    socket.data.lobbyId = roomId;

    io.to(roomId).emit("update_lobby", {
      players: lobbies[roomId].players,
      rounds: lobbies[roomId].rounds,
      currentRound: lobbies[roomId].currentRound,
    });

    callback({ roomId });
  });

  socket.on("join_lobby", ({ roomId, player }) => {
    const lobby = lobbies[roomId];
    if (!lobby) {
      socket.emit("lobby_not_found");
      return;
    }
    if (lobby.players.length >= lobby.maxPlayers) {
      socket.emit("lobby_full");
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
      players: lobby.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correctGuesses: lobby.guessedPlayers.includes(p.name) ? 1 : 0,
      })),
      rounds: lobby.rounds,
      currentRound: lobby.currentRound,
    });
  });

  socket.on("check_lobby_exists", (roomId, callback) => {
    callback(!!lobbies[roomId]);
  });

  socket.on("disconnect", () => {
    const lobbyId = socket.data.lobbyId;
    if (!lobbyId || !lobbies[lobbyId]) return;

    const lobby = lobbies[lobbyId];

    if (lobby.hostId === socket.id) {
      io.to(lobbyId).emit("lobby_closed");
      delete lobbies[lobbyId];
      console.log(`Host left → lobby ${lobbyId} destroyed`);
      return;
    }

    lobby.players = lobby.players.filter((p) => p.id !== socket.id);

    if (lobby.players.length === 0) {
      delete lobbies[lobbyId];
      console.log(`Lobby ${lobbyId} deleted`);
    } else {
      io.to(lobbyId).emit("update_lobby", {
        players: lobby.players,
        rounds: lobby.rounds,
        currentRound: lobby.currentRound,
      });
    }

    console.log(`User disconnected: ${socket.id}`);
  });
}
