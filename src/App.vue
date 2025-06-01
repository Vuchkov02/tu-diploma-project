<template>
  <v-app class="background">
    <NavBar
      v-if="showNavBar"
      class="navbar"
      @toggle-profile="drawerOpen = !drawerOpen"
    />

    <ProfileDrawer :isOpen="drawerOpen" @close="drawerOpen = false" />

    <v-main class="main-content">
      <v-container>
        <HeroPage v-if="showHero" />
        <router-view v-else />
      </v-container>
    </v-main>

    <Login ref="loginDialogRef" />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";

import NavBar from "@/components/navbar/NavBar.vue";
import HeroPage from "@/views/HeroPageView.vue";
import ProfileDrawer from "./components/profile-drawer/ProfileDrawer.vue";

interface Player {
  id: string;
  name: string;
}
interface Message {
  name: string;
  text: string;
}

const drawerOpen = ref(false);
const name = ref("");
const lobbyId = ref<string | null>(null);
const players = ref<Player[]>([]);
const isHost = ref(false);
const gameStarted = ref(false);
const showNavBar = ref(false);
const showHero = ref(false);
const messages = ref<Message[]>([]);
const newMessage = ref("");
const route = useRoute();
const loginDialogRef = ref();

onMounted(() => {
  window.addEventListener("open-login-dialog", () => {
    if (loginDialogRef.value) {
      loginDialogRef.value.showDialog = true;
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("open-login-dialog", () => {});
});

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    showNavBar.value = !!user;
    updateHeroVisibility();
  });
});

watch(
  () => route.path,
  () => {
    updateHeroVisibility();
  },
  { immediate: true }
);

function updateHeroVisibility() {
  const isLoggedIn = !!auth.currentUser;
  showHero.value = !isLoggedIn && route.path === "/";
}

onMounted(() => {
  socket.on("update_lobby", (updatedPlayers: Player[]) => {
    players.value = updatedPlayers;
  });

  socket.on("game_started", () => {
    gameStarted.value = true;
  });

  socket.on("chat_message", (msg: Message) => {
    messages.value.push(msg);
  });
});

onUnmounted(() => {
  socket.off("update_lobby");
  socket.off("game_started");
  socket.off("chat_message");
});
</script>

<style scoped>
.background {
  background: url("@/assets/background-main.png") no-repeat center center fixed;
  background-size: cover;
  min-height: 100vh;
}
.navbar {
  width: 100%;
  z-index: 10;
}
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}
.v-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
*,
*::before,
*::after {
  font-family: "DynaPuff", sans-serif !important;
}
body,
html,
.v-application {
  font-family: "DynaPuff", sans-serif !important;
}
</style>
