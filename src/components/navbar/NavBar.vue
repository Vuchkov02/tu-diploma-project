<template>
  <v-app-bar
    app
    :style="{ backgroundColor: '#1E1D26', color: '#94F8D0' }"
    flat
    height="64"
  >
    <v-container class="d-flex align-center px-0" fluid>
      <div class="d-flex align-center">
        <v-btn
          icon
          class="ml-2"
          :style="{ color: '#94F8D0' }"
          @click="$emit('toggle-profile')"
        >
          <v-icon>mdi-account</v-icon>
        </v-btn>
        <span class="ml-2" style="color: #94f8d0">
          Hello, {{ user?.displayName || "User" }}
        </span>
      </div>

      <div
        class="flex-grow-1 d-flex justify-center"
        style="margin-right: 90px"
      >
        <span
          class="text-h6 font-weight-bold"
          style="font-family: 'DynaPuff', cursive; color: #c99cff"
        >
          DRAW & GUESS
        </span>
      </div>

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

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      await currentUser.reload();
      user.value = auth.currentUser; 
    }
  });
});
const logout = async () => {
  try {
    await signOut(auth);
    sessionStorage.clear(); 
    router.push("/"); 
  } catch (error) {
    console.error("Logout Error:", error);
  }
};
</script>
