import registerLobbyHandlers from "./lobbyHandlers.js";
import registerGameHandlers from "./gameHandlers.js";
import registerDrawHandlers from "./drawHandlers.js";
import registerChatHandlers from "./chatHandlers.js";

export function registerSocketHandlers(io, socket, lobbies, wordPools) {
  registerLobbyHandlers(io, socket, lobbies);
  registerGameHandlers(io, socket, lobbies, wordPools);
  registerDrawHandlers(io, socket);
  registerChatHandlers(io, socket, lobbies);
}
