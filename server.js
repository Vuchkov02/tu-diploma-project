import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
const lobbies = {};

app.use(cors());

app.get("/", (req, res) => {
    res.send("Skribbl.io Clone Server Running...");
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    // **When a user starts a new stroke, tell everyone to reset last position**
    socket.on("start_draw", (data) => {
        socket.broadcast.emit("start_draw", data); // **Now other clients reset strokes properly**
    });

    // **When a user draws, tell others to follow**
    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data);
    });

    socket.on("clear_canvas", () => {
        io.emit("clear_canvas");
    });

    socket.on("create_lobby", (data, callback) => {
        const roomId = Math.random().toString(36).substring(7);
        lobbies[roomId] = { players: [] };
        socket.join(roomId);
        callback({ roomId });
    });

    socket.on("join_lobby", ({ roomId, player }) => {
        if (lobbies[roomId]) {
            lobbies[roomId].players.push(player);
            socket.join(roomId);
            io.to(roomId).emit("update_lobby", lobbies[roomId].players);
        }
    });

    socket.on("send_message", ({ roomId, message, player }) => {
        io.to(roomId).emit("receive_message", { player, message });
    });

    socket.on("start_game", (roomId) => {
        io.to(roomId).emit("game_started", {});
    });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
