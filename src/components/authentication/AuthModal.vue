<template>
  <v-dialog v-model="showDialog" max-width="400px">
    <v-card>
      <v-card-title class="text-h5">
        {{ isLogin ? "Login" : "Sign Up" }}
      </v-card-title>

      <v-card-text>
        <LoginForm v-if="isLogin" @success="closeModal" />
        <RegisterForm v-else @success="closeModal" />
      </v-card-text>

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
import LoginForm from "./Login.vue";
import RegisterForm from "./Register.vue";

const showDialog = ref(false);
const isLogin = ref(true);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
};
const closeModal = () => {
  showDialog.value = false;
};

defineExpose({ showDialog, isLogin });
</script>

<style scoped>
.v-card-actions {
  padding: 16px;
}
</style>
