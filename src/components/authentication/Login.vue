<template>
    <v-dialog v-model="showDialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Login</v-card-title>
        <v-card-text>
          <v-text-field v-model="email" label="Email" outlined></v-text-field>
          <v-text-field v-model="password" label="Password" type="password" outlined></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="login">Login</v-btn>
          <v-btn text block @click="$emit('close')">Cancel</v-btn>
        </v-card-actions>
        <v-card-actions>
          <v-btn text block @click="$emit('switchToRegister')">Create an account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, defineExpose } from "vue";
  import { auth } from "@/plugins/firebase";
  import { signInWithEmailAndPassword } from "firebase/auth";
  
  const email = ref("");
  const password = ref("");
  const showDialog = ref(false);
  
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      alert("Logged in successfully!");
      showDialog.value = false;
    } catch (error) {
      alert(error);
    }
  };
  defineExpose({ showDialog });
  </script>
  