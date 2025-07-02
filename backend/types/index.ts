import { Server, Socket } from 'socket.io';

export interface Player {
  id: string;
  name: string;
  score: number;
  correctGuesses?: number;
}

export interface Lobby {
  players: Player[];
  hostId: string;
  language: string;
  drawerIndex: number;
  currentWord: string | null;
  rounds: number;
  currentRound: number;
  guessedPlayers: string[];
  roundStartedAt: number | null;
  maxPlayers: number;
  gameStarted?: boolean;
  revealedLetters?: string[];
}

export interface WordPools {
  [language: string]: string[];
}

export interface Lobbies {
  [roomId: string]: Lobby;
}

export interface CreateLobbyData {
  player?: {
    name: string;
  };
  language?: string;
  rounds?: number;
  maxPlayers?: number;
}

export interface JoinLobbyData {
  roomId: string;
  player: {
    name: string;
  };
}

export interface WordChoiceData {
  roomId: string;
  word: string;
}

export interface SetWordData {
  roomId: string;
  word: string;
  drawerId: string;
}

export interface RevealLetterData {
  roomId: string;
  index: number;
  letter: string;
}

export interface ChatMessageData {
  roomId: string;
  message: string;
  player: {
    name: string;
  };
}

export interface DrawData {
  x: number;
  y: number;
  color: string;
  size: number;
  isDrawing: boolean;
}

export interface StartDrawData {
  x: number;
  y: number;
  color: string;
  size: number;
}

export type SocketHandler = (io: Server, socket: Socket, lobbies: Lobbies, wordPools?: WordPools) => void; 