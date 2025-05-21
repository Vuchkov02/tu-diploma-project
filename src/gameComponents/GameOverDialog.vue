<template>
    <v-dialog v-model="show" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h5 text-center">🏁 Game Over</v-card-title>
        <v-card-text class="text-center">
          Thanks for playing!
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" @click="returnToLobby">Return to Lobby</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  
  const show = ref(true);
  const router = useRouter();
  
  const returnToLobby = () => {
    router.push("/lobby");
  };
  </script>
  