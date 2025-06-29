<template>
  <v-container
    fluid
    class="d-flex flex-column justify-center align-center fill-height"
  >
    <v-card
      class="pa-6 text-center"
      max-width="400"
      elevation="12"
      :style="{
        backgroundColor: '#292833',
        color: '#fff',
        borderRadius: '16px',
      }"
    >
      <h2 style="font-family: 'DynaPuff', cursive; color: #94f8d0">Welcome!</h2>
      <p class="mb-6" style="color: #ccc">
        Log into your account or create a new one to start playing 🎮
      </p>

      <v-btn
        color="primary"
        class="mb-4"
        size="large"
        block
        prepend-icon="mdi-login"
        @click="openLogin"
      >
        Login
      </v-btn>

      <v-btn
        color="secondary"
        size="large"
        block
        prepend-icon="mdi-account-plus"
        @click="openRegister"
      >
        Sign Up
      </v-btn>
    </v-card>

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
