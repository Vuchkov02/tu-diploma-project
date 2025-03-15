<template>
  <v-container class="text-center">
    <v-card class="pa-5 mx-auto" max-width="400">
      <v-card-title class="text-h4">🎨 DrawGuess</v-card-title>
      <v-btn color="primary" class="mt-3" block @click="openLogin">Login</v-btn>
      <v-btn color="secondary" class="mt-3" block @click="openRegister">Sign Up</v-btn>
    </v-card>

    <!-- Authentication Modal -->
    <AuthModal ref="authModal" />
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AuthModal from "@/components/authentication/AuthModal.vue";

const authModal = ref<InstanceType<typeof AuthModal> | null>(null);

const openLogin = () => {
  if (authModal.value) {
    authModal.value.showDialog = true;
    authModal.value.isLogin = true;
  }
};

const openRegister = () => {
  if (authModal.value) {
    authModal.value.showDialog = true;
    authModal.value.isLogin = false;
  }
};
</script>
