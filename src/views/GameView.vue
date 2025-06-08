<template>
  <div class="scale-container">
    <div class="scale-wrapper" ref="scaleWrapper">
      <div class="game-grid">
        <div class="header">
          <div class="timer-display" style="color: #b7b3b3">
            ⏱️ {{ timeLeft }}
          </div>
          <div class="word-display" style="color: #b7b3b3">
            📝 {{ displayedWord }}
          </div>
          <div class="round-counter" style="color: #b7b3b3">
            🔁 Round {{ currentRound }} / {{ totalRounds }}
          </div>
        </div>

        <div class="main">
          <div class="canvas">
            <PixiCanvas />
          </div>
          <div class="score">
            <h3>🏆 Leaderboard</h3>
            <ul class="score-list">
              <li v-for="(player, index) in sortedScores" :key="player.name">
                <span class="player-rank">{{ index + 1 }}.</span>
                <span class="player-name">{{ player.name + ": " }}</span>
                <span class="player-score">{{ player.score + " pts." }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="chat">
          <ChatBox
            :messages="messages"
            v-model:newMessage="newMessage"
            :send-message="sendMessage"
            :is-drawer="socket.id === drawerId"
            :game-ended="gameEnded"
          />
        </div>

        <WordChoice />
        <GameOverDialog
          v-if="gameEnded"
          :scores="sortedScores"
          :totalRounds="totalRounds"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, computed } from "vue";
import { useRoute } from "vue-router";
import PixiCanvas from "@/components/canvas/PixiCanvas.vue";
import WordChoice from "@/components/canvas/WordChoice.vue";
import GameOverDialog from "@/gameComponents/GameOverDialog.vue";
import ChatBox from "@/gameComponents/ChatBox.vue";
import socket from "@/plugins/socket";
import { auth } from "@/plugins/firebase";
type ScoreEntry = {
  name: string;
  score: number;
  correctGuesses: number;
  wasArtist: boolean;
};
const route = useRoute();
const roomId = (route.params as { roomId: string }).roomId;
const firebaseUser = auth.currentUser;
const username = firebaseUser?.displayName || "Guest";

const messages = ref<{ player: { name: string }; message: string }[]>([]);
const newMessage = ref("");
const scores = ref<ScoreEntry[]>([]);

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

const sortedScores = computed(() =>
  [...scores.value].sort((a, b) => b.score - a.score)
);

onMounted(() => {
  socket.emit("join_lobby", {
    roomId,
    player: { name: username },
  });

  socket.on("receive_message", (msg) => {
    messages.value.push(msg);
  });

  socket.on("update_scores", ({ players }: { players: any[] }) => {
    scores.value = players.map((p: any) => ({
      name: p.name ?? "Unknown",
      score: p.score ?? 0,
      correctGuesses: p.correctGuesses ?? 0,
      wasArtist: p.id === drawerId.value,
    }));
  });

  socket.on("update_lobby", (data: any) => {
    const players = data.players;

    if (!Array.isArray(players)) {
      console.warn("Expected players array, got:", players);
      return;
    }

    scores.value = players.map((p: any) => ({
      name: p.name ?? "Unknown",
      score: p.score ?? 0,
      correctGuesses: p.correctGuesses ?? 0,
      wasArtist: p.id === drawerId.value,
    }));

    totalRounds.value = data.rounds;
    currentRound.value = data.currentRound;
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
  socket.off("update_scores");
  socket.off("game_over");

  if (interval.value) {
    clearInterval(interval.value);
    interval.value = null;
  }
});

const sendMessage = () => {
  if (newMessage.value.trim() === "") return;
  socket.emit("send_message", {
    roomId,
    player: { name: username },
    message: newMessage.value,
  });
  newMessage.value = "";
};

function updateDisplayedWord() {
  const isDrawer = socket.id === drawerId.value;
  displayedWord.value =
    isDrawer && currentWord.value
      ? currentWord.value.split("").join(" ")
      : revealedWord.value.join(" ");
}

function startTimer() {
  if (gameEnded.value) return;
  if (interval.value) clearInterval(interval.value);

  const revealInterval = wordLength.value < 7 ? 10 : 20;
  revealedIndices.value = new Set();

  interval.value = setInterval(() => {
    timeLeft.value--;

    if (timeLeft.value % revealInterval === 0 && timeLeft.value !== 60) {
      const unrevealed = Array.from(
        { length: wordLength.value },
        (_, i) => i
      ).filter((i) => !revealedIndices.value.has(i));
      if (unrevealed.length > 0) {
        const index = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedIndices.value.add(index);
        if (socket.id === drawerId.value && currentWord.value) {
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
</script>

<style scoped>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.scale-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.scale-wrapper {
  width: 100%;
  height: 100%;
  transform-origin: center center;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1%;
  padding: 0;
  box-sizing: border-box;
  pointer-events: auto;
}

.game-grid {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  padding: 0.5rem;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background-color: #1e1e1e;
  color: #ffffff;
  border: 1px solid #2a2a2a;
  box-shadow: 0 2px 4px rgba(127, 230, 195, 0.1);
}

.main {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 0;
  overflow: hidden;
  height: 100%;
}

.canvas {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: #1e1e1e;
  color: #b7b3b3;
  border: 1px solid #2a2a2a;
}

.score {
  padding: 1rem;
  overflow-y: auto;
  font-size: clamp(0.8rem, 1.5vw, 1rem);
  background-color: #1e1e1e;
  color: #b7b3b3;
  border: 1px solid #2a2a2a;
  height: 100%;
}

.chat {
  background-color: #3a363b;
  border-bottom-right-radius: 12px;
  border-bottom-left-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 150px;
}

.score-list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #b7b3b3;
}
.player-name {
  color: #b388ff;
}
.player-score {
  color: #7fe6c3;
}
.score-list li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4em;
}

.player-rank {
  margin-right: 0.5em;
}
@media (min-width: 1280px) {
  /* .scale-container {
    margin-top: -80px;
  } */
  /* .scale-wrapper {
    transform: scale(0.8);
  } */
}
</style>
