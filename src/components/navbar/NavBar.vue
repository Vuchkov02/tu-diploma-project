<template>
  <v-app-bar
    app
    :style="{ backgroundColor: '#1E1D26', color: '#94F8D0' }"
    flat
    height="64"
  >
    <v-container class="d-flex align-center px-0" fluid>
      <!-- Profile Info on the Left -->
      <div class="d-flex align-center">
        <v-btn icon class="ml-2" :style="{ color: '#94F8D0' }">
          <v-icon>mdi-account</v-icon>
        </v-btn>
        <span class="ml-2" style="color: #94f8d0">
          Hello, {{ user?.displayName || "User" }}
        </span>
      </div>

      <!-- Centered Title -->
      <div
        class="flex-grow-1 d-flex justify-center"
        style="margin-right: 180px"
      >
        <span
          class="text-h6 font-weight-bold"
          style="font-family: 'DynaPuff', cursive; color: #c99cff"
        >
          DRAW & GUESS
        </span>
      </div>

      <!-- Logout Button -->
      <v-btn icon @click="logout" class="mr-2" color="error">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { auth } from "@/plugins/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

const router = useRouter();
const user = ref(auth.currentUser);

// Watch for authentication state changes
onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      await currentUser.reload(); // 🔄 Ensures latest data
      user.value = auth.currentUser; // ✅ Now it should have `displayName`
    }
  });
});
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
