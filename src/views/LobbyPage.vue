<template>
  <v-card class="pa-4">
    <v-card-title
      class="text-h5 text-center"
      style="font-family: 'DynaPuff', cursive"
    >
      🎮 LOBBY
    </v-card-title>

    <div class="d-flex justify-center mt-4">
      <CreateLobbyDialog />
      <JoinLobbyDialog />
    </div>

    <v-card v-if="lobbyId" class="pa-3 mt-5">
      <v-card-title>Lobby ID: {{ lobbyId }}</v-card-title>

      <v-list>
        <v-list-item v-for="player in players" :key="player.id">
          🎭 {{ player.name }}
        </v-list-item>
      </v-list>

      <v-card-subtitle> 🎯 Rounds: {{ lobbyInfo.rounds }} </v-card-subtitle>

      <v-btn v-if="isHost" color="success" @click="startGame">Start Game</v-btn>
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";
import CreateLobbyDialog from "@/components/lobbyComponents/CreateLobbyDialog.vue";
import JoinLobbyDialog from "@/components/lobbyComponents/JoinLobbyDialog.vue";

const router = useRouter();
const route = useRoute();

const lobbyId = ref<string | null>((route.query.lobbyId as string) || null);
const players = ref<{ id: string; name: string }[]>([]);
const isHost = ref<boolean>(false);

const lobbyInfo = ref<{ players: any[]; rounds: number; currentRound: number }>(
  {
    players: [],
    rounds: 0,
    currentRound: 1,
  }
);

const startGame = () => {
  if (!lobbyId.value) return;
  socket.emit("start_game", lobbyId.value);
  router.push(`/game/${lobbyId.value}`);
};

const joinLobbyById = (id: string) => {
  const username = auth.currentUser?.displayName || "Guest";
  socket.emit("join_lobby", {
    roomId: id,
    player: { id: socket.id, name: username },
  });
};

onMounted(() => {
  if (lobbyId.value) {
    joinLobbyById(lobbyId.value);
  }

  socket.on("update_lobby", (data) => {
    if (Array.isArray(data)) {
      players.value = data;
      isHost.value = data[0]?.id === socket.id;
    } else {
      players.value = data.players;
      isHost.value = data.players[0]?.id === socket.id;
      lobbyInfo.value.rounds = data.rounds;
    }
  });

  socket.on("game_started", () => {
    router.push(`/game/${lobbyId.value}`);
  });

  socket.on("lobby_not_found", () => {
    console.warn("⚠️ Lobby not found. Resetting state.");
    lobbyId.value = null;
    players.value = [];
    isHost.value = false;
    router.replace({ path: "/lobby" });
  });
});

watch(
  () => route.query.lobbyId,
  (newId) => {
    if (newId && newId !== lobbyId.value) {
      lobbyId.value = newId as string;
      joinLobbyById(lobbyId.value);
    }
  }
);

onUnmounted(() => {
  socket.emit("leave_lobby", lobbyId.value);
  socket.off("update_lobby");
  socket.off("game_started");
  socket.off("lobby_not_found");
});
</script>
