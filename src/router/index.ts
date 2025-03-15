import { createRouter, createWebHistory } from 'vue-router';
import HeroPage from '@/views/HeroPage.vue';
import Lobby from '@/views/Lobby.vue';
import Game from '@/views/Game.vue';

const routes = [
  { path: '/', component: HeroPage },
  { path: '/lobby', component: Lobby },
  { path: '/game', component: Game },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
