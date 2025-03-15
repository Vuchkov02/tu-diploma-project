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
              <strong>{{ msg.name }}:</strong> {{ msg.text }}
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
  import PixiCanvas from "@/components/canvas/PixiCanvas.vue";
  import socket from "@/plugins/socket";
  
  // Chat State
  const messages = ref<{ name: string; text: string }[]>([]);
  const newMessage = ref<string>("");
  
  // Send Chat Message
  const sendMessage = () => {
    if (newMessage.value.trim() === "") return;
    socket.emit("chat_message", { text: newMessage.value });
    newMessage.value = "";
  };
  
  // Socket Events
  onMounted(() => {
    socket.on("chat_message", (msg) => messages.value.push(msg));
  });
  
  onUnmounted(() => {
    socket.off("chat_message");
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
  