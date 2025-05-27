export default function registerDrawHandlers(io, socket) {
    socket.on("start_draw", (data) => {
      // Кажи на всички останали да започнат нова линия
      socket.broadcast.emit("start_draw", data);
    });
  
    socket.on("draw", (data) => {
      // Кажи на всички останали да следват рисуването
      socket.broadcast.emit("draw", data);
    });
  
    socket.on("clear_canvas", () => {
      // Изчисти платното за всички
      io.emit("clear_canvas");
    });
  }
  