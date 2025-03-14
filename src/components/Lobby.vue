<template>
    <v-container>
      <v-card class="pa-5">
        <v-card-title class="text-h5"> Welcome to the Lobby </v-card-title>
  
        <v-card-text>
          <v-text-field v-model="name" label="Enter your name" outlined></v-text-field>
  
          <v-select
            v-model="avatar"
            :items="avatars"
            label="Choose an avatar color"
            outlined
          ></v-select>
  
          <v-btn color="primary" class="mr-2" @click="createLobby">Create Lobby</v-btn>
          <v-btn color="secondary" @click="joinLobby">Join Lobby</v-btn>
        </v-card-text>
  
        <v-card v-if="lobbyId" class="pa-4">
          <v-card-title>Lobby ID: {{ lobbyId }}</v-card-title>
          <v-list>
            <v-list-item v-for="player in players" :key="player.id">
              <v-avatar :color="player.avatar" class="mr-2"></v-avatar>
              {{ player.name }} ({{ player.avatar }})
            </v-list-item>
          </v-list>
          <v-btn v-if="isHost" color="success" @click="startGame">Start Game</v-btn>
        </v-card>
      </v-card>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { io, Socket } from "socket.io-client";
  import { useRouter } from "vue-router";
  
  // ✅ TypeScript Interfaces
  interface Player {
    id: string;
    name: string;
    avatar: string;
  }
  
  interface LobbyResponse {
    roomId: string;
  }
  
  // ✅ Vuetify Colors for Avatars
  const avatars = ["red", "blue", "green", "yellow", "purple"];
  
  // ✅ WebSocket Connection
  const socket: Socket = io("http://localhost:5000");
  const router = useRouter();
  
  // ✅ Reactive Variables
  const name = ref<string>("");
  const avatar = ref<string>("red");
  const lobbyId = ref<string | null>(null);
  const players = ref<Player[]>([]);
  const isHost = ref<boolean>(false);
  
  // ✅ Create a Lobby
  const createLobby = () => {
    socket.emit("create_lobby", {}, (response: LobbyResponse) => {
      lobbyId.value = response.roomId;
      isHost.value = true;
    });
  };
  
  // ✅ Join a Lobby
  const joinLobby = () => {
    const roomId = prompt("Enter Lobby ID:");
    if (roomId) {
      lobbyId.value = roomId;
      socket.emit("join_lobby", {
        roomId,
        player: { id: socket.id, name: name.value, avatar: avatar.value },
      });
    }
  };
  
  // ✅ Start the Game
  const startGame = () => {
    if (lobbyId.value) {
      socket.emit("start_game", lobbyId.value);
      router.push("/game"); // Redirect to game page
    }
  };
  
  // ✅ Listen for Updates
  onMounted(() => {
    socket.on("update_lobby", (updatedPlayers: Player[]) => {
      players.value = updatedPlayers;
    });
  
    socket.on("game_started", () => {
      router.push("/game");
    });
  });
  </script>
  
  <style scoped>
  .v-card {
    max-width: 600px;
    margin: auto;
  }
  </style>
  