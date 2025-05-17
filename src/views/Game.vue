<template>
  <v-card class="pa-4">
    <v-card-title class="text-h5">🎨 DrawGuess - Game</v-card-title>

    <div class="game-area">
      <!-- 🎨 PIXI Drawing Board -->
      <PixiCanvas />

      <!-- 💬 Chat Box -->
      <v-card class="chat-box">
        <v-card-title>💬 Chat</v-card-title>
        <v-list>
          <v-list-item v-for="(msg, index) in messages" :key="index">
            <strong>{{ msg.player.name }}:</strong> {{ msg.message }}
          </v-list-item>
        </v-list>
        <v-text-field
          v-model="newMessage"
          label="Type a message..."
          outlined
          @keyup.enter="sendMessage"
        ></v-text-field>
      </v-card>

      <!-- ✨ Word Choice Overlay (only visible for drawer) -->
      <WordChoice />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import PixiCanvas from "@/components/canvas/PixiCanvas.vue";
import WordChoice from "@/components/canvas/WordChoice.vue"; 
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";

const route = useRoute();
const roomId = (route.params as { roomId: string }).roomId;

const firebaseUser = auth.currentUser;
const username = firebaseUser?.displayName || "Guest";

const messages = ref<{ player: { name: string }; message: string }[]>([]);
const newMessage = ref("");

const sendMessage = () => {
  if (newMessage.value.trim() === "") return;

  const msg = {
    roomId,
    player: { name: username },
    message: newMessage.value,
  };

  socket.emit("send_message", msg);
  newMessage.value = "";
};

onMounted(() => {
  socket.emit("join_lobby", {
    roomId,
    player: { name: username },
  });

  socket.on("receive_message", (msg) => {
    messages.value.push(msg);
  });
  socket.on("round_started", ({ wordLength, drawerId }) => {
  console.log("🟢 Round started! Word length:", wordLength);

  // Пример: скрий избора на дума ако някак го показваш
  // Покажи в UI: "_ _ _ _" — в зависимост от wordLength

  // Можеш да запазиш drawerId, за да знаеш дали текущият играч е рисувач или не
});
});

onUnmounted(() => {
  socket.off("receive_message");
  socket.off("round_started"); 
});
</script>
