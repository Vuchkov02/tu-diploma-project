import { createRouter, createWebHistory } from 'vue-router';
import LoginRegisterPage from '@/views/LoginRegisterPageView.vue';
import Lobby from '@/views/LobbyPageView.vue';
import Game from '@/views/GameView.vue';

const routes = [
  { path: '/login', component: LoginRegisterPage },
  { path: '/lobby', component: Lobby },
  { path: '/game/:roomId', name: 'Game', component: Game },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
