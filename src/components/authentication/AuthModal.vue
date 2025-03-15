<template>
  <v-dialog v-model="showDialog" persistent max-width="400px">
    <v-card>
      <v-card-title class="text-h5">
        {{ isLogin ? "Login" : "Sign Up" }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-if="!isLogin"
          v-model="username"
          label="Username"
          outlined
        ></v-text-field>
        <v-text-field v-model="email" label="Email" type="email" outlined></v-text-field>
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          outlined
        ></v-text-field>
      </v-card-text>

      <!-- 💡 Fix: Buttons now properly displayed -->
      <v-card-actions class="d-flex flex-column">
        <v-btn color="primary" block @click="isLogin ? login() : signup()">
          {{ isLogin ? "Login" : "Register" }}
        </v-btn>
        <v-btn text block @click="closeModal">Cancel</v-btn>
      </v-card-actions>

      <v-card-actions class="d-flex justify-center">
        <v-btn text @click="toggleMode">
          {{ isLogin ? "Create an account" : "Already have an account? Login" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, defineExpose } from "vue";
import { auth, db } from "@/plugins/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const email = ref("");
const password = ref("");
const username = ref("");
const isLogin = ref(true);
const showDialog = ref(false);

// Toggle between Login and Register
const toggleMode = () => {
  isLogin.value = !isLogin.value;
};

// Close Modal
const closeModal = () => {
  showDialog.value = false;
};

// Login Function
const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    alert("✅ Logged in successfully!");
    closeModal();
  } catch (error) {
    alert(error);
  }
};

// Signup Function (Now Uses Username)
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

    // Set the username in Firebase Auth
    await updateProfile(user, { displayName: username.value });

    // Store username in Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: username.value,
      email: user.email,
    });

    alert("✅ Account created!");
    closeModal();
  } catch (error) {
    alert(error);
  }
};

// Google Sign-In
const googleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Store Google user in Firestore
    await setDoc(
      doc(db, "users", user.uid),
      {
        username: user.displayName || "Unknown",
        email: user.email,
      },
      { merge: true }
    );

    alert("✅ Logged in with Google!");
    closeModal();
  } catch (error) {
    alert(error);
  }
};

// **Expose for HeroPage.vue**
defineExpose({ showDialog, isLogin });
</script>

<style scoped>
/* Make sure buttons are properly displayed */
.v-card-actions {
  padding: 16px;
}
</style>
