<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card class="game-over-card">
      <v-card-title class="text-h5 text-center" style="color: #C99CFF">
        🏁 Game Over
      </v-card-title>
      <v-card-text class="text-center">
        <p class="mb-4" style="color: #94F8D0">Thanks for playing!</p>

        <div class="score-list">
          <div
            v-for="(player, index) in sortedScores"
            :key="player.name"
            class="score-entry"
            :ref="(el) => setScoreRef(el, index)"
          >
            <span class="rank">#{{ index + 1 }}</span>
            <span class="name">{{ player.name }}</span>
            <span class="points">{{ player.score }} pts</span>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="justify-center mt-4">
        <v-btn
          @click="returnToLobby"
          style="background-color: #94F8D0; color: #1E1D26; font-weight: bold"
        >
          🔁 Return to Lobby
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";

// Примерен вход (замести с реални пропси при нужда)
const props = defineProps<{
  scores: { name: string; score: number }[];
}>();

const show = ref(true);
const router = useRouter();

const sortedScores = computed(() =>
  [...props.scores].sort((a, b) => b.score - a.score)
);

// GSAP refs
const scoreRefs = ref<(HTMLElement | null)[]>([]);
const setScoreRef = (el: unknown, index: number) => {
  scoreRefs.value[index] = el instanceof HTMLElement ? el : null;
};

onMounted(async () => {
  await nextTick();
  scoreRefs.value.forEach((el, i) => {
    if (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          delay: i * 0.15,
          duration: 0.6,
          ease: "power2.out",
        }
      );
    }
  });
});

const returnToLobby = () => {
  router.push("/lobby");
};
</script>

<style scoped>
.game-over-card {
  background-color: #1e1d26;
  color: #ffffff;
  border-radius: 16px;
  padding: 16px;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-entry {
  display: flex;
  justify-content: space-between;
  background: #2a2a2a;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.rank {
  color: #c99cff;
}
.name {
  color: #ffffff;
}
.points {
  color: #94f8d0;
}
</style>
