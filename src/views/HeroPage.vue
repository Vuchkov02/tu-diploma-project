<template>
  <div class="hero-container">
    <div class="hero-text">
      <h1>
        A game for
        <span class="word-wrapper">
          <transition name="slide-word">
            <span class="highlight-word" :key="currentWord">{{
              currentWord
            }}</span>
          </transition>
        </span>
      </h1>
      <p>Have fun together!</p>
      <button class="main-btn" @click="goToPlay">Play for Free</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const goToPlay = () => router.push("/login");

const words = ["friends", "family", "artists", "gamers", "couples"];
const currentWord = ref(words[0]);
let index = 0;
let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  interval = setInterval(() => {
    index = (index + 1) % words.length;
    currentWord.value = words[index];
  }, 3000);
});

onUnmounted(() => clearInterval(interval));
</script>

<style scoped>
.hero-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "DynaPuff", cursive;
  text-align: center;
  padding: 2rem;
  background: none;
}

.hero-text {
  max-width: 90%;
  background-color: rgba(30, 29, 38, 0.85);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(148, 248, 208, 0.08);
}

.hero-text h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: white;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.word-wrapper {
  display: inline-block;
  position: relative;
  min-width: 250px;
  overflow: hidden;
  vertical-align: bottom;
  padding-top: 0.2em;
  padding-bottom: 0.2em;
}

.highlight-word {
  color: #94f8d0;
  display: inline-block;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

/* Slide animation */
.slide-word-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-word-enter-to {
  transform: translateY(0%);
  opacity: 1;
}
.slide-word-leave-from {
  transform: translateY(0%);
  opacity: 1;
}
.slide-word-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-word-enter-active,
.slide-word-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.hero-text p {
  font-size: 1.25rem;
  color: #ccc;
  margin-bottom: 2rem;
}

.main-btn {
  font-size: 1.5rem;
  background: #94f8d0;
  color: #1e1d26;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}
.main-btn:hover {
  background: #c99cff;
  transform: scale(1.05);
}
</style>
