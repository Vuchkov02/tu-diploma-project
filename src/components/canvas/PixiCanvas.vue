<template>
  <div ref="canvasContainer" class="canvas-container">
    <canvas id="pixi-canvas"></canvas>

    <div class="controls" v-if="isDrawer">
      <input type="color" v-model="strokeColorHex" aria-label="Brush color" />

      <input
        type="range"
        min="1"
        max="30"
        step="1"
        v-model.number="strokeWidth"
        aria-label="Brush width"
      />
      <button
        style="
          padding: 8px 16px;
          font-weight: bold;
          font-size: 14px;
          color: #fff;
          background: linear-gradient(145deg, #ff4c4c, #c03030);
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          cursor: pointer;
        "
        @click="clearCanvas"
      >
        CLEAR
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import * as PIXI from "pixi.js";
import socket from "@/plugins/socket";

const canvasContainer = ref<HTMLElement | null>(null);
let app: PIXI.Application | null = null;
let graphics: PIXI.Graphics | null = null;
let drawing = false;
let canvas: HTMLCanvasElement | null = null;

const strokeColor = ref<number>(0x000000);
const strokeWidth = ref<number>(2);
const strokeColorHex = ref<string>("#000000");
const isDrawer = ref<boolean>(false);
let lastReceivedPos: { x: number; y: number } | null = null;
let lastPos: { x: number; y: number } | null = null;
watch(strokeColorHex, (val) => {
  strokeColor.value = parseInt(val.replace("#", ""), 16);
});
watch(strokeColor, (val) => {
  const hex = "#" + val.toString(16).padStart(6, "0");
  if (hex.toLowerCase() !== strokeColorHex.value.toLowerCase()) {
    strokeColorHex.value = hex;
  }
});
const getMousePosition = (event: MouseEvent) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

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

const clearCanvas = () => {
  if (!isDrawer.value) return;

  app?.stage.removeChildren();
  graphics = new PIXI.Graphics();
  app?.stage.addChild(graphics);

  socket.emit("clear_canvas");
};

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

  socket.on("round_started", ({ drawerId }) => {
    isDrawer.value = socket.id === drawerId;
    console.log("You are drawer:", isDrawer.value);
  });
};

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

const initCanvas = async () => {
  await nextTick();
  if (!canvasContainer.value) return;

  app = new PIXI.Application({
    view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
    resizeTo: canvasContainer.value!,
    backgroundColor: 0xffffff,
    antialias: true,
  });

  graphics = new PIXI.Graphics();
  app.stage.addChild(graphics);

  attachEventListeners();
};
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
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  border: 2px solid #000;
}

canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.controls {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.controls input[type="range"] {
  width: 120px;
}
</style>
