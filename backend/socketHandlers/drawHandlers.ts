import { Server, Socket } from "socket.io";
import { StartDrawData, DrawData } from "../types/index.js";

export default function registerDrawHandlers(io: Server, socket: Socket): void {
  socket.on("start_draw", (data: StartDrawData) => {
    socket.broadcast.emit("start_draw", data);
  });

  socket.on("draw", (data: DrawData) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear_canvas", () => {
    io.emit("clear_canvas");
  });
} 