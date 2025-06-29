<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card class="bg-[#1E1D26] text-white pb-8 pt-6 px-6 font-dynapuff">
      <h2 class="text-2xl font-bold text-mint-400 mb-4">
        📊 Player Statistics
      </h2>

      <v-divider class="border-mint-400 mb-6"></v-divider>

      <div class="space-y-4">
        <p class="text-base">
          🕹 Games Played:
          <span class="text-gray-400">{{ userStats.gamesPlayed }}</span>
        </p>
        <p class="text-base">
          🎯 Words Guessed:
          <span class="text-gray-400">{{ userStats.wordsGuessed }}</span>
        </p>
        <p class="text-base">
          🎨 Times as Artist:
          <span class="text-gray-400">{{ userStats.timesAsArtist }}</span>
        </p>
        <p class="text-base">
          🏆 Wins: <span class="text-gray-400">{{ userStats.wins }}</span>
        </p>
        <p class="text-base">📈 XP Progress:</p>
        <v-progress-linear
          :model-value="(userStats.xp % 1000) / 10"
          height="12"
          color="#94F8D0"
          rounded
          class="mb-1"
        />
        <p class="text-sm text-gray-400 text-right">
          {{ userStats.xp % 1000 }} / 1000 XP
        </p>

        <p class="text-base">
          🧬 Level: <span class="text-gray-400">{{ userStats.level }}</span>
        </p>

        <div
          class="flex flex-col items-center justify-center mt-10 text-center"
        >
          <img
            :src="`src/assets/${rankImage}`"
            alt="Rank Badge"
            class="w-24 h-24 mb-2 drop-shadow-xl animate-rank"
          />
          <p class="text-xl font-semibold text-mint-400 tracking-wide">
            RANK: {{ rank }}
          </p>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, defineExpose } from "vue";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const dialog = ref(false);
const userStats = ref({
  gamesPlayed: 0,
  wordsGuessed: 0,
  timesAsArtist: 0,
  wins: 0,
  xp: 0,
  level: 1,
});

const rank = ref("BRONZE");
const rankImage = ref("bronze-rank.png");

function calculateRank(level) {
  if (level >= 30) {
    rank.value = "DIAMOND";
    rankImage.value = "diamond-rank.png";
  } else if (level >= 15) {
    rank.value = "GOLD";
    rankImage.value = "gold-rank.png";
  } else if (level >= 5) {
    rank.value = "SILVER";
    rankImage.value = "silver-rank.png";
  } else {
    rank.value = "BRONZE";
    rankImage.value = "bronze-rank.png";
  }
}

async function fetchStats() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const db = getFirestore();
  const statsRef = doc(db, "users", user.uid);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    const data = statsSnap.data();
    const stats = data.playerStats || {};

    userStats.value = {
      gamesPlayed: stats.gamesPlayed || 0,
      wordsGuessed: stats.wordsGuessed || 0,
      timesAsArtist: stats.drawingsDone || 0,
      wins: stats.wins || 0,
      xp: stats.xp || 0,
      level: stats.level || 1,
    };

    calculateRank(userStats.value.level);
  }
}

function open() {
  fetchStats();
  dialog.value = true;
}
function close() {
  dialog.value = false;
}

defineExpose({ open, close });
</script>

<style scoped>
.text-mint-400 {
  color: #94f8d0;
}
.border-mint-400 {
  border-color: #94f8d0;
}
.font-dynapuff {
  font-family: "DynaPuff", sans-serif !important;
}

/* ✨ Rank fade-in animation */
@keyframes pop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-rank {
  animation: pop 0.4s ease-out;
}
</style>
