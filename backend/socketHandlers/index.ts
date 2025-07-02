import { Server, Socket } from "socket.io";
import registerLobbyHandlers from "./lobbyHandlers.js";
import registerGameHandlers from "./gameHandlers.js";
import registerDrawHandlers from "./drawHandlers.js";
import registerChatHandlers from "./chatHandlers.js";
import handleDisconnect from "./handleDisconnect.js";
import { Lobbies, WordPools } from "../types/index.js";

export function registerSocketHandlers(
  io: Server, 
  socket: Socket, 
  lobbies: Lobbies, 
  wordPools: WordPools
): void {
  registerLobbyHandlers(io, socket, lobbies);
  registerGameHandlers(io, socket, lobbies, wordPools);
  registerDrawHandlers(io, socket);
  registerChatHandlers(io, socket, lobbies, wordPools);
  handleDisconnect(io, socket, lobbies);
} 