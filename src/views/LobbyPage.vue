<template>
  <v-container fluid class="d-flex justify-center align-center fill-height">
    <v-card
      class="pa-6"
      max-width="600"
      elevation="12"
      :style="{
        color: '#94F8D0',
      }"
    >
      <!-- Заглавие -->
      <v-card-title
        class="text-h4 text-center mb-6"
        style="font-family: 'DynaPuff', cursive; color: #c99cff"
      >
        LOBBY
      </v-card-title>

      <!-- Бутони -->
      <v-row dense class="justify-center">
        <v-col cols="12" class="mb-3 text-center">
          <CreateLobbyDialog
            class="w-100"
            style="font-size: 18px; font-weight: bold"
          />
        </v-col>
        <v-col cols="12" class="text-center">
          <JoinLobbyDialog
            class="w-100"
            style="font-size: 18px; font-weight: bold"
          />
        </v-col>
      </v-row>

      <!-- Информация за лобито -->
      <v-divider class="my-6" :style="{ borderColor: '#94F8D0' }" />

      <v-card
        v-if="lobbyId"
        flat
        class="py-4 px-3"
        :style="{
          backgroundColor: '#292833',
          border: '1px solid #94F8D0',
          borderRadius: '12px',
        }"
      >
        <v-card-title class="text-h6" style="color: #c99cff">
          🆔 Lobby ID: <span style="color: white"> {{ lobbyId }} </span>
        </v-card-title>

        <v-card-subtitle class="text-subtitle-1 mb-2" style="color: #94f8d0">
          🎯 Rounds: <strong>{{ lobbyInfo.rounds }}</strong>
        </v-card-subtitle>

        <v-list class="py-0">
          <v-list-item
            v-for="player in players"
            :key="player.id"
            :style="{ color: '#ffffff' }"
          >
            {{ player.name }}
          </v-list-item>
        </v-list>

        <div class="text-center mt-4">
          <v-btn
            v-if="isHost"
            :disabled="players.length < 2"
            color="primary"
            @click="startGame"
            style="background-color: #94f8d0; color: #1e1d26; font-weight: bold"
          >
            🚀 Start Game
          </v-btn>
        </div>
      </v-card>
    </v-card>
  </v-container>
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
  socket.on("lobby_closed", () => {
    alert("🚪 The host has closed the lobby.");
    router.replace("/lobby");
    lobbyId.value = null;
    players.value = [];
    isHost.value = false;
  });
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
  socket.off("lobby_closed");
});
</script>
