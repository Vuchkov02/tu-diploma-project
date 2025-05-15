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
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import PixiCanvas from "@/components/canvas/PixiCanvas.vue";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";

// 🎯 Взимаме roomId от URL
const route = useRoute();
const roomId = (route.params as { roomId: string }).roomId;
console.log("ROOM ID:", roomId); // 🔍 провери дали е валиден

// 🧠 Взимаме името от localStorage
const firebaseUser = auth.currentUser;
const username = firebaseUser?.displayName || "Guest";
// 💬 Чат състояние
const messages = ref<{ player: { name: string }; message: string }[]>([]);
const newMessage = ref("");

// 🚀 Изпращане на съобщение
const sendMessage = () => {
  if (newMessage.value.trim() === "") return;

  const msg = {
    roomId,
    player: { name: username },
    message: newMessage.value,
  };

  console.log("Sending message:", msg);
  socket.emit("send_message", msg);

  newMessage.value = "";
};

// 🔌 Свързване към стаята и слушане на съобщения
onMounted(() => {
  socket.emit("join_lobby", {
    roomId,
    player: { name: username },
  });

  socket.on("receive_message", (msg) => {
    messages.value.push(msg);
  });
});

// 🧹 Изчистване на listener-а
onUnmounted(() => {
  socket.off("receive_message");
});
</script>

<style scoped>
.game-area {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.chat-box {
  width: 300px;
  max-height: 500px;
  overflow-y: auto;
}
</style>
