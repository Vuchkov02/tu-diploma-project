<template>
  <div class="main-container">
    <v-text-field v-model="username" label="Username" outlined />
    <v-text-field v-model="email" label="Email" type="email" outlined />
    <v-text-field
      v-model="password"
      label="Password"
      type="password"
      outlined
    />
    <v-btn color="primary" block @click="signup">Register</v-btn>
    <v-divider
      :thickness="20"
      class="border-opacity-0"
      color="info"
    ></v-divider>
    <v-btn color="gray" block @click="emit('success')">Cancel</v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { auth, db } from "@/plugins/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const emit = defineEmits(["success"]);

const username = ref("");
const email = ref("");
const password = ref("");

const signup = async () => {
  if (!username.value.trim()) {
    alert("❌ Please enter a username");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: username.value });

    await setDoc(doc(db, "users", user.uid), {
      displayName: username.value,
      email: user.email || "",
      playerStats: {
        xp: 0,
        level: 1,
        gamesPlayed: 0,
        wordsGuessed: 0,
        drawingsDone: 0,
        wins: 0,
      },
      createdAt: new Date(),
    });

    alert("✅ Account created!");
    emit("success");
  } catch (error) {
    alert(error);
  }
};
</script>
<style scoped>
.main-container {
  font-family: "DynaPuff", cursive;
}
</style>
