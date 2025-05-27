<template>
  <v-navigation-drawer
    v-model="internalOpen"
    location="left"
    temporary
    width="320"
    class="bg-[#1E1D26] text-white"
  >
    <v-toolbar flat dense class="bg-transparent">
      <v-toolbar-title class="text-white text-h6">👤 Profile</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDrawer" variant="text">
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-divider class="my-2 border-mint-400"></v-divider>

    <v-list nav dense>
      <v-list-item
        prepend-icon="mdi-chart-bar"
        title="Stats"
        @click="openStatsDialog"
      />
    </v-list>

    <!-- Диалог със статистики -->
    <StatsDialog ref="statsDialogRef" />
  </v-navigation-drawer>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import StatsDialog from "@/components/profile-drawer/StatsDialog.vue";

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close"]);
const internalOpen = ref(props.isOpen);
const statsDialogRef = ref();

// синхронизация с външен проп
watch(
  () => props.isOpen,
  (val) => {
    internalOpen.value = val;
  }
);

// известяване когато drawer се затвори отвътре
watch(internalOpen, (val) => {
  if (!val) emit("close");
});

function closeDrawer() {
  internalOpen.value = false;
  emit("close");
}

function openStatsDialog() {
  statsDialogRef.value?.open();
}
</script>

<style scoped>
.text-mint-400 {
  color: #94f8d0;
}
.border-mint-400 {
  border-color: #94f8d0;
}
</style>
