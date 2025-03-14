<template>
  <div ref="canvasContainer" class="canvas-container">
    <canvas id="pixi-canvas"></canvas>
  </div>
  <v-btn color="error" class="mt-2" @click="clearCanvas">Clear</v-btn>
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
// Start drawing
const startDraw = (event: MouseEvent) => {
  if (!app) return;
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
  if (!drawing || !graphics) return;

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
  lastPos = null; // Reset last position when drawing stops

  graphics = null; // **Forget the last stroke completely**
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
  if (!graphics) return;
  graphics.clear();
  socket.emit("clear_canvas");
};

// Receive drawing events from others
let lastReceivedPos: { x: number; y: number } | null = null;

const setupSocketListeners = () => {
  socket.on(
    "start_draw",
    (data: { x: number; y: number; color: number; width: number }) => {
      if (!app) return;

      lastReceivedPos = null;
      graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      graphics.lineStyle(data.width, data.color, 1);
      graphics.moveTo(data.x, data.y);
    }
  );

  socket.on(
    "draw",
    (data: { x: number; y: number; color: number; width: number }) => {
      if (!graphics) return;

      graphics.lineStyle(data.width, data.color, 1);

      if (lastReceivedPos) {
        graphics.moveTo(lastReceivedPos.x, lastReceivedPos.y);
        graphics.lineTo(data.x, data.y);
      }

      lastReceivedPos = data;

      app?.renderer.render(app.stage);
    }
  );

  socket.on("clear_canvas", () => {
    app?.stage.removeChildren(); // **Completely wipe the canvas**
    lastReceivedPos = null;
  });
};

// Attach event listeners to canvas element
const attachEventListeners = () => {
  canvas = document.getElementById("pixi-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);
};

// Remove event listeners
const detachEventListeners = () => {
  if (!canvas) return;

  canvas.removeEventListener("mousedown", startDraw);
  canvas.removeEventListener("mousemove", draw);
  canvas.removeEventListener("mouseup", stopDraw);
  canvas.removeEventListener("mouseleave", stopDraw);
};

// Initialize PIXI Canvas
const initCanvas = async () => {
  await nextTick(); // Ensures the DOM is ready

  if (!canvasContainer.value) return;

  app = new PIXI.Application({
    view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
    width: 600,
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

  detachEventListeners();

  app?.destroy(true);
  app = null;
  graphics = null;
});
</script>

<style scoped>
.canvas-container {
  width: 600px;
  height: 400px;
  border: 2px solid #000;
}
</style>
