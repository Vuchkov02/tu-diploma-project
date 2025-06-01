<template>
    <div>
      <v-text-field v-model="email" label="Email" type="email" outlined />
      <v-text-field v-model="password" label="Password" type="password" outlined />
      <v-btn color="primary" block @click="login">Login</v-btn>
      <v-divider
  :thickness="20"
  class="border-opacity-0"
  color="info"
></v-divider>      <v-btn color="gray" block @click="emit('success')">Cancel</v-btn>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  import { auth } from "@/plugins/firebase";
  import { signInWithEmailAndPassword } from "firebase/auth";
  
  const emit = defineEmits(["success"]);
  
  const email = ref("");
  const password = ref("");
  
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      alert("✅ Logged in successfully!");
      emit("success");
    } catch (error) {
      alert(error);
    }
  };
  </script>
  