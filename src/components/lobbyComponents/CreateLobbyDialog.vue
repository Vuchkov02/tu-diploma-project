<template>
  <v-dialog v-model="dialog" max-width="400" style="font-family: DynaPuff">
    <template #activator="{ props }">
      <v-btn color="primary" v-bind="props">Create Lobby</v-btn>
    </template>

    <v-card>
      <v-card-title>Create Lobby</v-card-title>

      <v-card-text>
        <v-text-field
          v-model.number="maxPlayers"
          label="Max Players"
          type="number"
          :min="2"
          :max="10"
        />

        <v-select
          v-model="language"
          :items="['English', 'Bulgarian']"
          label="Language"
        />

        <v-select
          v-model.number="rounds"
          :items="[1, 2, 3, 5, 7, 10]"
          label="Rounds"
          hint="How many rounds will be played?"
          persistent-hint
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="success" @click="createLobby">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";

const dialog = ref(false);
const maxPlayers = ref(4);
const language = ref("English");
const rounds = ref(3); // default number of rounds
const router = useRouter();

const createLobby = () => {
  const username = auth.currentUser?.displayName || "Guest";

  console.log("Creating lobby...");

  socket.emit(
    "create_lobby",
    {
      maxPlayers: maxPlayers.value,
      language: language.value,
      rounds: rounds.value, 
      player: { id: socket.id, name: username },
    },
    (res: { roomId: string }) => {
      if (!res?.roomId) {
        console.warn("No roomId received from server!");
        return;
      }

      console.log("Lobby created with ID:", res.roomId);

      dialog.value = false;
      router.push({
        path: "/lobby",
        query: { lobbyId: res.roomId },
      });
    }
  );
};
</script>
