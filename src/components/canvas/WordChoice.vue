<template>
  <div v-if="visible && !gameEnded" class="word-choice-overlay">
    <div
      class="word-box"
      v-for="word in words"
      :key="word"
      @click="choose(word)"
    >
      {{ word }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import socket from "@/plugins/socket";
import { useRoute } from "vue-router";

// 🧠 Inject флаг от Game.vue
const gameEnded = inject("gameEnded", ref(false));

const words = ref<string[]>([]);
const visible = ref(false);
const route = useRoute();

onMounted(() => {
  socket.on("choose_word", (wordOptions: string[]) => {
    if (gameEnded.value) return;
    words.value = wordOptions;
    visible.value = true;
  });
});

const choose = (word: string) => {
  const roomId = (route.query.lobbyId ||
    (route.params as any).roomId) as string;

  if (!roomId) {
    console.warn("❌ Room ID not found!");
    return;
  }

  console.log("🎯 Chosen word:", word);
  socket.emit("word_chosen", { roomId, word });

  socket.emit("round_started", {
    roomId,
    wordLength: word.length,
    drawerId: socket.id,
  });

  socket.emit("set_word", {
    roomId,
    word,
    drawerId: socket.id,
  });

  visible.value = false;
};
</script>

<style scoped>
.word-choice-overlay {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border-radius: 12px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.word-box {
  color: white;
  background: #1976d2;
  padding: 10px 20px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
}
.word-box:hover {
  background: #42a5f5;
}
</style>
