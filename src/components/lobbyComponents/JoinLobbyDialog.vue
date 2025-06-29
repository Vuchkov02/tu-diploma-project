<template>
  <v-dialog v-model="dialog" max-width="400" style="font-family: DynaPuff">
    <template #activator="{ props }">
      <v-btn color="secondary" v-bind="props">Join Lobby</v-btn>
    </template>
    <v-card>
      <v-card-title>Join Lobby</v-card-title>
      <v-card-text>
        <v-text-field v-model="code" label="Lobby Code" />
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="success" @click="joinLobby">Join</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom">
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";

const dialog = ref(false);
const code = ref("");
const error = ref("");

const router = useRouter();
const route = useRoute();

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

const currentLobbyId = ref<string | null>(
  (route.query.lobbyId as string) || null
);

const joinLobby = () => {
  error.value = "";
  const username = auth.currentUser?.displayName || "Guest";

  socket.emit("check_lobby_exists", code.value, (exists: boolean) => {
    if (!exists) {
      snackbar.value = {
        show: true,
        message: "Lobby not found",
        color: "error",
      };
      code.value = "";
      return;
    }

    socket.emit("join_lobby", {
      roomId: code.value,
      player: { id: socket.id, name: username },
    });
    socket.once("lobby_full", () => {
      snackbar.value = {
        show: true,
        message: "Lobby is full!",
        color: "error",
      };
    });
    socket.once("update_lobby", (data: any) => {
      const actualPlayers = Array.isArray(data) ? data : data.players;

      const isInNewLobby = actualPlayers.some((p: any) => p.id === socket.id);

      if (isInNewLobby) {
        dialog.value = false;

        snackbar.value = {
          show: true,
          message: "Lobby joined",
          color: "success",
        };

        router.push({
          path: "/lobby",
          query: { name: username, lobbyId: code.value },
        });
      }
    });
  });
};
</script>
