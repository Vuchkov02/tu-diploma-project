<template>
  <v-card class="pa-4">
    <v-card-title class="text-h5">🎨 DrawGuess - Lobby</v-card-title>

    <v-text-field
      v-model="name"
      label="Enter your name"
      outlined
    ></v-text-field>
    <v-btn color="primary" class="mr-2" @click="createLobby"
      >Create Lobby</v-btn
    >
    <v-btn color="secondary" @click="joinLobby">Join Lobby</v-btn>

    <v-card v-if="lobbyId" class="pa-3 mt-3">
      <v-card-title>Lobby ID: {{ lobbyId }}</v-card-title>
      <v-list>
        <v-list-item v-for="player in players" :key="player.id">
          🎭 {{ player.name }}
        </v-list-item>
      </v-list>
      <v-btn v-if="isHost" color="success" @click="startGame">Start Game</v-btn>
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import socket from "@/plugins/socket";

// Router
const router = useRouter();
const route = useRoute();

// Game State
const name = ref<string>((route.query.name as string) || ""); // Get name from HeroPage
const lobbyId = ref<string | null>(null);
const players = ref<{ id: string; name: string }[]>([]);
const isHost = ref<boolean>(false);

// Create Lobby
const createLobby = () => {
  socket.emit("create_lobby", {}, (response: { roomId: string }) => {
    lobbyId.value = response.roomId;
    isHost.value = true;
  });
};

// Join Lobby
const joinLobby = () => {
  const roomId = prompt("Enter Lobby ID:");
  if (roomId) {
    lobbyId.value = roomId;
    socket.emit("join_lobby", {
      roomId,
      player: { id: socket.id, name: name.value },
    });
  }
};

// Start Game
const startGame = () => {
  socket.emit("start_game", lobbyId.value);
  router.push("/game"); // Navigate to game page
};

// Socket Events
onMounted(() => {
  socket.on(
    "update_lobby",
    (updatedPlayers) => (players.value = updatedPlayers)
  );

  // Listen for game start event and redirect all players
  socket.on("game_started", () => {
    router.push("/game"); // Navigate to the game page
  });
});

onUnmounted(() => {
  socket.off("update_lobby");
  socket.off("game_started"); // Clean up event listener
});
</script>
