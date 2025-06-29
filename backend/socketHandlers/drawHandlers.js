export default function registerDrawHandlers(io, socket) {
    socket.on("start_draw", (data) => {
      socket.broadcast.emit("start_draw", data);
    });
  
    socket.on("draw", (data) => {
      socket.broadcast.emit("draw", data);
    });
  
    socket.on("clear_canvas", () => {
      io.emit("clear_canvas");
    });
  }
  