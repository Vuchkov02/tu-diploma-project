<template>
  <v-container class="fill-height">
    <v-responsive class="align-center fill-height mx-auto" max-width="900">
      <div class="text-center">
        <div class="text-body-2 font-weight-light mb-n1">Welcome to</div>
        
        <h1 class="text-h2 font-weight-bold primary--text">DRAW & GUESS</h1>
        
        <div class="text-body-1 mt-4 mb-8">
          The ultimate multiplayer drawing and guessing game!
        </div>
        
        <v-row justify="center" class="mt-8">
          <v-col cols="12" md="6">
            <v-card
              class="py-6"
              color="surface-variant"
              prepend-icon="mdi-pencil"
              rounded="lg"
              variant="outlined"
            >
              <template #title>
                <h3 class="text-h5 font-weight-bold">🎨 Draw</h3>
              </template>
              <template #subtitle>
                <div class="text-subtitle-1">
                  Use your artistic skills to draw the given word and help your teammates guess it!
                </div>
              </template>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-card
              class="py-6"
              color="surface-variant"
              prepend-icon="mdi-help-circle"
              rounded="lg"
              variant="outlined"
            >
              <template #title>
                <h3 class="text-h5 font-weight-bold">🤔 Guess</h3>
              </template>
              <template #subtitle>
                <div class="text-subtitle-1">
                  Watch the drawing and try to guess the word before time runs out!
                </div>
              </template>
            </v-card>
          </v-col>
        </v-row>
        
        <v-row justify="center" class="mt-8">
          <v-col cols="12" md="8">
            <v-card
              class="py-6"
              color="primary"
              prepend-icon="mdi-gamepad-variant"
              rounded="lg"
            >
              <template #title>
                <h3 class="text-h5 font-weight-bold text-black">🚀 Ready to Play?</h3>
              </template>
              <template #subtitle>
                <div class="text-subtitle-1 text-black">
                  Create or join a lobby to start playing with friends!
                </div>
              </template>
              
              <v-btn
                color="secondary"
                size="large"
                class="mt-4"
                @click="startGame"
              >
                Start Playing
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-responsive>
  </v-container>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const startGame = () => {
  router.push('/lobby');
};
</script>

<style scoped>
.primary--text {
  color: #94F8D0 !important;
}
</style>
