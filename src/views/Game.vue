<!-- ✅ Game.vue -->
<template>
  <v-card class="pa-4">
    <div class="game-area">
      <div class="timer-display">⏱️ {{ timeLeft }}</div>

      <div class="round-counter text-center mt-1">
        🔁 Round {{ currentRound }} / {{ totalRounds }}
      </div>

      <div class="word-display text-h6 text-center my-2">
        📝 {{ displayedWord }}
      </div>

      <PixiCanvas />

      <ChatBox
        :messages="messages"
        v-model:newMessage="newMessage"
        :send-message="sendMessage"
        :is-drawer="socket.id === drawerId"
        :game-ended="gameEnded"
      />

      <WordChoice />

      <GameOverDialog v-if="gameEnded" />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from "vue";
import { useRoute } from "vue-router";
import PixiCanvas from "@/components/canvas/PixiCanvas.vue";
import WordChoice from "@/components/canvas/WordChoice.vue";
import GameOverDialog from "@/gameComponents/GameOverDialog.vue";
import ChatBox from "@/gameComponents/ChatBox.vue";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";

const route = useRoute();
const roomId = (route.params as { roomId: string }).roomId;
const firebaseUser = auth.currentUser;
const username = firebaseUser?.displayName || "Guest";

const messages = ref<{ player: { name: string }; message: string }[]>([]);
const newMessage = ref("");

const currentWord = ref("");
const displayedWord = ref("");
const drawerId = ref("");
const timeLeft = ref(60);
const wordLength = ref(0);
const revealedIndices = ref<Set<number>>(new Set());
const revealedWord = ref<string[]>([]);
const currentRound = ref(1);
const totalRounds = ref(1);
const interval = ref<number | null>(null);
const gameEnded = ref(false);
provide("gameEnded", gameEnded);

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

function updateDisplayedWord() {
  const isDrawer = socket.id === drawerId.value;

  if (isDrawer && currentWord.value) {
    displayedWord.value = currentWord.value.split("").join(" ");
  } else {
    displayedWord.value = revealedWord.value.join(" ");
  }
}

function startTimer() {
  if (gameEnded.value) return;

  if (interval.value) clearInterval(interval.value);

  let revealInterval = wordLength.value < 7 ? 20 : 10;
  revealedIndices.value = new Set();

  interval.value = setInterval(() => {
    timeLeft.value--;

    const isDrawer = socket.id === drawerId.value;

    if (timeLeft.value % revealInterval === 0 && timeLeft.value !== 60) {
      const unrevealed = Array.from(
        { length: wordLength.value },
        (_, i) => i
      ).filter((i) => !revealedIndices.value.has(i));

      if (unrevealed.length > 0) {
        const index = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedIndices.value.add(index);

        if (isDrawer && currentWord.value) {
          const letter = currentWord.value[index];
          socket.emit("reveal_letter", { roomId, index, letter });
        }
      }
    }

    if (timeLeft.value <= 0) {
      clearInterval(interval.value!);
      interval.value = null;
      socket.emit("end_round", roomId);
    }
  }, 1000);
}

onMounted(() => {
  socket.emit("join_lobby", {
    roomId,
    player: { name: username },
  });

  socket.on("receive_message", (msg) => {
    messages.value.push(msg);
  });

  socket.on(
    "round_started",
    ({
      wordLength: len,
      drawerId: id,
      currentRound: round,
      totalRounds: total,
    }) => {
      if (gameEnded.value) return;
      drawerId.value = id;
      wordLength.value = len;
      timeLeft.value = 60;
      currentWord.value = "";
      currentRound.value = round;
      totalRounds.value = total;
      revealedIndices.value = new Set();
      revealedWord.value = Array(len).fill("_");
      updateDisplayedWord();
      startTimer();
    }
  );

  socket.on("set_word", (word: string) => {
    if (socket.id === drawerId.value) {
      currentWord.value = word;
      updateDisplayedWord();
    }
  });

  socket.on("reveal_letter", ({ index, letter }) => {
    revealedWord.value[index] = letter;
    updateDisplayedWord();
  });

  socket.on("game_over", () => {
    gameEnded.value = true;
    if (interval.value) {
      clearInterval(interval.value);
      interval.value = null;
    }
  });
});

onUnmounted(() => {
  socket.off("receive_message");
  socket.off("round_started");
  socket.off("set_word");
  socket.off("reveal_letter");
  socket.off("game_over");
  if (interval.value) {
    clearInterval(interval.value);
    interval.value = null;
  }
});
</script>

<style scoped>
.word-display {
  color: #333;
  font-weight: bold;
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 8px;
  display: inline-block;
}
.timer-display {
  position: absolute;
  top: 16px;
  right: 24px;
  font-size: 20px;
  font-weight: bold;
  color: #e53935;
  background-color: #fff3f3;
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.round-counter {
  font-size: 16px;
  font-weight: 500;
  color: #1976d2;
}
</style>
