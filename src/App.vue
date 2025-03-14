<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title class="text-h5">🎨 DrawGuess</v-card-title>

      <!-- LOBBY SYSTEM -->
      <div v-if="!gameStarted">
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
          <v-btn v-if="isHost" color="success" @click="startGame"
            >Start Game</v-btn
          >
        </v-card>
      </div>

      <!-- GAME STARTS (Chat + Drawing) -->
      <div v-if="gameStarted" class="game-area">
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import PixiCanvas from "@/components/canvas/PixiCanvas.vue"; // Import the new PIXI component
import socket from "@/plugins/socket";

// ✅ Player Type
interface Player {
  id: string;
  name: string;
}

// ✅ Chat Message Type
interface Message {
  name: string;
  text: string;
}

// 🎨 Game State
const name = ref<string>("");
const lobbyId = ref<string | null>(null);
const players = ref<Player[]>([]);
const isHost = ref<boolean>(false);
const gameStarted = ref<boolean>(false);

// 💬 Chat State
const strokeColor = ref(0x000000); // Default black
const strokeWidth = ref(2); // Default stroke width

// 💬 Chat State
const messages = ref<{ name: string; text: string }[]>([]);
const newMessage = ref<string>("");

// 🖌 Function to update color and stroke width from ColorPicker
const updateColor = (color: number) => {
  strokeColor.value = color;
};

const updateWidth = (width: number) => {
  strokeWidth.value = width;
};
// ✅ Create Lobby
const createLobby = () => {
  socket.emit("create_lobby", {}, (response: { roomId: string }) => {
    lobbyId.value = response.roomId;
    isHost.value = true;
  });
};

// ✅ Join Lobby
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

// ✅ Start Game
const startGame = () => {
  gameStarted.value = true;
  socket.emit("start_game", lobbyId.value);
};

// ✅ Chat Functions
const sendMessage = () => {
  if (newMessage.value.trim() === "") return;
  socket.emit("chat_message", { name: name.value, text: newMessage.value });
  newMessage.value = "";
};

// ✅ Socket Events
onMounted(() => {
  socket.on(
    "update_lobby",
    (updatedPlayers: Player[]) => (players.value = updatedPlayers)
  );
  socket.on("game_started", () => (gameStarted.value = true));
  socket.on("chat_message", (msg: Message) => messages.value.push(msg));
});

onUnmounted(() => {
  socket.off("update_lobby");
  socket.off("game_started");
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
