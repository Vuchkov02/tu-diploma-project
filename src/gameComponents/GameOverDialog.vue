<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card class="game-over-card">
      <v-card-title
        class="text-h5 text-center"
        style="color: #c99cff; font-family: DynaPuff"
      >
        Game Over
      </v-card-title>

      <v-card-text class="text-center">
        <p class="mb-4" style="color: #94f8d0">Thanks for playing!</p>

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

        <!-- 🎯 Current Player XP & Level -->
        <div v-if="currentPlayer" class="mt-6">
          <p class="text-base mb-1" style="color: #94f8d0">
            +{{ gainedXp }} XP earned!
          </p>
          <p
            class="text-base font-bold mb-1"
            :class="{ 'level-up-animate': levelUpAnimation }"
            style="color: #c99cff"
          >
            Level {{ level }}
          </p>

          <v-progress-linear
            :model-value="animatedXpBar"
            height="12"
            color="#94F8D0"
            rounded
            class="mb-1"
          />
          <p class="text-sm text-gray-400 text-right">
            {{ currentXp % 1000 }} / 1000 XP
          </p>
        </div>
      </v-card-text>

      <v-card-actions class="justify-center mt-4">
        <v-btn
          @click="returnToLobby"
          style="background-color: #94f8d0; color: #1e1d26; font-weight: bold"
        >
          Return to Lobby
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import gsap from "gsap";
const props = defineProps<{
  scores: {
    name: string;
    score: number;
    correctGuesses?: number;
    wasArtist?: boolean;
  }[];
  totalRounds: number;
}>();
const show = ref(true);
const router = useRouter();
const scoreRefs = ref<(HTMLElement | null)[]>([]);
const setScoreRef = (el: unknown, index: number) => {
  scoreRefs.value[index] = el instanceof HTMLElement ? el : null;
};

const sortedScores = computed(() =>
  [...props.scores].sort((a, b) => b.score - a.score)
);

const auth = getAuth();
const db = getFirestore();
const currentPlayer = ref<{ name: string; score: number } | null>(null);
const currentXp = ref(0);
const level = ref(1);
const gainedXp = ref(0);
const animatedXpBar = ref(0);
const levelUpAnimation = ref(false);

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

  const user = auth.currentUser;
  if (!user) return;

  const match = props.scores.find((s) => s.name === user.displayName);
  if (!match) return;

  currentPlayer.value = match;
  gainedXp.value = match.score;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const stats = userSnap.data()?.playerStats || {};

  const previousXp = stats.xp || 0;
  const previousLevel = stats.level || 1;
  const newGamesPlayed = (stats.gamesPlayed || 0) + 1;
  const newWordsGuessed =
  (stats.wordsGuessed || 0) + (match.correctGuesses || 0);
  const newDrawingsDone = (stats.drawingsDone || 0) + (props.totalRounds || 0);
  console.log(stats.wordsGuessed);
  const newWins =
    (stats.wins || 0) +
    (sortedScores.value[0].name === user.displayName ? 1 : 0);

  let totalXp = previousXp + gainedXp.value;
  let newLevel = previousLevel;

  let levelUps = 0;
  while (totalXp >= 1000) {
    totalXp -= 1000;
    newLevel++;
    levelUps++;
  }

  await updateDoc(userRef, {
    "playerStats.xp": totalXp,
    "playerStats.level": newLevel,
    "playerStats.gamesPlayed": newGamesPlayed,
    "playerStats.wordsGuessed": newWordsGuessed,
    "playerStats.drawingsDone": newDrawingsDone,
    "playerStats.wins": newWins,
  });

  currentXp.value = totalXp;
  level.value = newLevel;

  animatedXpBar.value = 0;
  const endValue = (totalXp % 1000) / 10;

  const animationObject = { val: 0 };
  gsap.to(animationObject, {
    val: endValue,
    duration: 2.5,
    onUpdate: () => {
      animatedXpBar.value = animationObject.val;
    },
  });

  if (levelUps > 0) {
    levelUpAnimation.value = true;
    setTimeout(() => {
      levelUpAnimation.value = false;
    }, 1800);
  }
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
  padding: 24px;
  font-family: "DynaPuff", sans-serif !important;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.score-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.level-up-animate {
  animation: popLevel 1.5s ease-in-out;
}

@keyframes popLevel {
  0% {
    transform: scale(1);
    color: #c99cff;
  }
  50% {
    transform: scale(1.4);
    color: #ffffff;
  }
  100% {
    transform: scale(1);
    color: #c99cff;
  }
}

/* XP bar label */
.text-mint {
  color: #94f8d0;
}
.text-purple {
  color: #c99cff;
}
.text-gray {
  color: #b0b0b0;
}
</style>
