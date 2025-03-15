<template>
    <v-app-bar app color="primary" dark>
      <v-container class="d-flex align-center">
        <!-- 🏠 Home Icon -->
        <v-btn icon @click="goHome">
          <v-icon>mdi-home</v-icon>
        </v-btn>
  
        <!-- 👤 Profile Icon -->
        <v-btn icon>
          <v-icon>mdi-account</v-icon>
        </v-btn>
  
        <!-- ⚙️ Settings Icon -->
        <v-btn icon>
          <v-icon>mdi-cog</v-icon>
        </v-btn>
  
        <!-- Spacer to push logout button to the right -->
        <v-spacer></v-spacer>
  
        <!-- 🚪 Logout Button -->
        <v-btn color="error" @click="logout">
          <v-icon left>mdi-logout</v-icon> Logout
        </v-btn>
      </v-container>
    </v-app-bar>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from "vue-router";
  import { auth } from "@/plugins/firebase";
  import { signOut } from "firebase/auth";
  
  const router = useRouter();
  
  // Go to Home
  const goHome = () => {
    router.push("/");
  };
  
  // Logout
  const logout = async () => {
  try {
    await signOut(auth);
    sessionStorage.clear(); // ✅ Ensure session is cleared
    router.push("/"); // ✅ Redirect to Hero Page after logout
  } catch (error) {
    console.error("Logout Error:", error);
  }
};
  </script>
  