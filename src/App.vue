<template>
  <v-app class="background">
    <!-- ✅ Navbar only visible if logged in -->
    <NavBar v-if="showNavBar" />

    <v-container>
      <router-view /> <!-- Dynamically render the current page -->
    </v-container>
  </v-app>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import PixiCanvas from "@/components/canvas/PixiCanvas.vue"; // Import the new PIXI component
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase"; // Firebase authentication
import NavBar from "@/components/navbar/NavBar.vue"; // Import Navbar
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
const messages = ref<{ name: string; text: string }[]>([]);
const newMessage = ref<string>("");

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
const showNavBar = ref(false);

// ✅ Track authentication state and show/hide the Navbar
onMounted(() => {
  auth.onAuthStateChanged((user) => {
    showNavBar.value = !!user;
  });
});
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
.background {
  background: url("@/assets/background-main.jpg") no-repeat center center fixed;
  background-size: cover;
  min-height: 100vh;
}
</style>
