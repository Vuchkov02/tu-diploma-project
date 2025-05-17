<template>
  <div ref="canvasContainer" class="canvas-container">
    <canvas id="pixi-canvas"></canvas>
  </div>
  <v-btn color="error" class="mt-2" @click="clearCanvas" :disabled="!isDrawer">
    Clear
  </v-btn>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as PIXI from "pixi.js";
import socket from "@/plugins/socket";

const canvasContainer = ref<HTMLElement | null>(null);
let app: PIXI.Application | null = null;
let graphics: PIXI.Graphics | null = null;
let drawing = false;
let canvas: HTMLCanvasElement | null = null;

const strokeColor = ref(0x000000); // Default black
const strokeWidth = ref(2); // Default width
const isDrawer = ref(false); // ⬅️ само рисувачът може да рисува

// Start drawing
const startDraw = (event: MouseEvent) => {
  if (!app || !isDrawer.value) return;
  drawing = true;
  lastPos = null;

  const pos = getMousePosition(event);

  graphics = new PIXI.Graphics();
  app.stage.addChild(graphics);

  graphics.lineStyle(strokeWidth.value, strokeColor.value, 1);
  graphics.moveTo(pos.x, pos.y);

  socket.emit("start_draw", {
    ...pos,
    color: strokeColor.value,
    width: strokeWidth.value,
  });
};

// Draw on the canvas
let lastPos: { x: number; y: number } | null = null;

const draw = (event: MouseEvent) => {
  if (!drawing || !graphics || !isDrawer.value) return;

  const pos = getMousePosition(event);

  graphics.lineStyle(strokeWidth.value, strokeColor.value, 1);

  if (lastPos) {
    graphics.moveTo(lastPos.x, lastPos.y);
    graphics.lineTo(pos.x, pos.y);
  }

  lastPos = pos;

  app?.renderer.render(app.stage);

  socket.emit("draw", {
    ...pos,
    color: strokeColor.value,
    width: strokeWidth.value,
  });
};

const stopDraw = () => {
  drawing = false;
  lastPos = null;
  graphics = null;
};

// Get mouse position relative to canvas
const getMousePosition = (event: MouseEvent) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

// Clear the canvas
const clearCanvas = () => {
  if (!isDrawer.value) return;

  app?.stage.removeChildren(); // маха всичко от сцената
  graphics = new PIXI.Graphics();
  app?.stage.addChild(graphics);

  socket.emit("clear_canvas");
};

// Receive drawing events from others
let lastReceivedPos: { x: number; y: number } | null = null;

const setupSocketListeners = () => {
  socket.on("start_draw", (data) => {
    if (!app) return;

    lastReceivedPos = null;
    graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    graphics.lineStyle(data.width, data.color, 1);
    graphics.moveTo(data.x, data.y);
  });

  socket.on("draw", (data) => {
    if (!graphics) return;

    graphics.lineStyle(data.width, data.color, 1);

    if (lastReceivedPos) {
      graphics.moveTo(lastReceivedPos.x, lastReceivedPos.y);
      graphics.lineTo(data.x, data.y);
    }

    lastReceivedPos = data;
    app?.renderer.render(app.stage);
  });

  socket.on("clear_canvas", () => {
    app?.stage.removeChildren();
    lastReceivedPos = null;
  });

  // 👇 Засичане на рисувача при старт на рунда
  socket.on("round_started", ({ drawerId }) => {
    isDrawer.value = socket.id === drawerId;
    console.log("🎨 You are drawer:", isDrawer.value);
  });
};

// Attach event listeners to canvas
const attachEventListeners = () => {
  canvas = document.getElementById("pixi-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);
};

const detachEventListeners = () => {
  if (!canvas) return;
  canvas.removeEventListener("mousedown", startDraw);
  canvas.removeEventListener("mousemove", draw);
  canvas.removeEventListener("mouseup", stopDraw);
  canvas.removeEventListener("mouseleave", stopDraw);
};

// Initialize PIXI Canvas
const initCanvas = async () => {
  await nextTick();
  if (!canvasContainer.value) return;

  app = new PIXI.Application({
    view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
    width: 832,
    height: 400,
    backgroundColor: 0xffffff,
    antialias: true,
  });

  graphics = new PIXI.Graphics();
  app.stage.addChild(graphics);

  attachEventListeners();
};

// Lifecycle Hooks
onMounted(() => {
  initCanvas();
  setupSocketListeners();
});

onUnmounted(() => {
  socket.off("draw");
  socket.off("clear_canvas");
  socket.off("round_started");

  detachEventListeners();

  app?.destroy(true);
  app = null;
  graphics = null;
});
</script>

<style scoped>
.canvas-container {
  border: 2px solid #000;
}
</style>
