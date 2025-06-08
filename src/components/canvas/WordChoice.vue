<template>
  <transition name="fade">
    <div
      v-show="!visible && !gameEnded && showWaitingMessage"
      class="waiting-overlay"
    >
      <div class="waiting-text">🕒 The drawer is choosing a word...</div>
    </div>
  </transition>

  <div v-if="visible && !gameEnded" class="word-choice-overlay">
    <div
      class="word-box"
      v-for="(word, index) in words"
      :key="word"
      :ref="(el) => setWordRef(el, index)"
      @click="choose(word)"
    >
      {{ word }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, nextTick, inject } from "vue";
import gsap from "gsap";
import socket from "@/plugins/socket";
import { useRoute } from "vue-router";

const gameEnded = inject("gameEnded", shallowRef(false));
const words = ref<string[]>([]);
const visible = ref(false); 
const showWaitingMessage = ref(false);
const wordRefs = ref<Array<HTMLElement | null>>([]);
const route = useRoute();

const setWordRef = (el: unknown, index: number) => {
  wordRefs.value[index] = el instanceof HTMLElement ? el : null;
};

socket.on("choose_word", async (options: string[]) => {
  if (gameEnded.value) return;

  words.value = options;
  visible.value = true;
  showWaitingMessage.value = false;

  await nextTick();

  wordRefs.value.forEach((el, i) => {
    if (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          delay: i * 0.1,
          duration: 0.6,
          ease: "power3.out",
        }
      );
    }
  });
});

socket.on("choose_word_status", () => {
  visible.value = false;
  showWaitingMessage.value = true;
});

socket.on("word_chosen_status", () => {
  showWaitingMessage.value = false;
});

const choose = (word: string) => {
  const roomId = (route.query.lobbyId ||
    (route.params as any).roomId) as string;
  if (!roomId) return;

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
  background: rgba(30, 29, 38, 0.95);
  padding: 24px;
  border-radius: 16px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 0 20px rgba(148, 248, 208, 0.2);
}

.word-box {
  color: #1e1d26;
  background: #94f8d0;
  padding: 14px 24px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.word-box:hover {
  background: #c99cff;
  color: #1e1d26;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(201, 156, 255, 0.3);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.waiting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 20, 0.8);
  z-index: 1999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.waiting-text {
  color: #94f8d0;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0 0 10px #94f8d099;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
