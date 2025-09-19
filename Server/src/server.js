import { createServer } from "http";
import { Server } from "socket.io";


const rooms = {};
const socketRooms = {};
const gameState = {
  p1: { x: 40, y: 300, rotation: (Math.PI / 2) },
  p2: { x: 760, y: 300, rotation: (Math.PI / 2) * 3 },
  turn: 1
};

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all origins (for testing)
  }
});
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, rooms);
  socket.emit("welcome", "Hello from server!");

  socket.on("updatePosition", (pos) => {
    const roomId = socketRooms[socket.id];
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room.state) room.state = { p1: null, p2: null, bullets: [] };

    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex === 0) room.state.p1 = pos;
    if (playerIndex === 1) room.state.p2 = pos;

    socket.to(roomId).emit("playerMoved", { id: socket.id, pos });

    console.log(rooms);
  });

  socket.on("joinRoom", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = { players: [] };

    if (rooms[roomId].players.length < 2) {
        rooms[roomId].players.push(socket.id);
        socket.join(roomId);
        socketRooms[socket.id] = roomId;
        socket.to(roomId).emit("roomUpdate", rooms[roomId].players);
    } else {
        socket.emit("roomFull", roomId);
    }
  });

  socket.on("autoJoin", () => {
    const roomId = findOrCreateRoom();
    rooms[roomId].players.push(socket.id);
    socket.join(roomId);
    socketRooms[socket.id] = roomId;
    socket.emit("roomJoined", { roomId, playerIndex: rooms[roomId].players.length - 1, state: rooms[roomId].state });
    socket.to(roomId).emit("roomUpdate", rooms[roomId].players);
  });

  socket.on("disconnect", () => {
    const roomId = socketRooms[socket.id];
    if (!roomId) return;

    const room = rooms[roomId];
    const index = room.players.indexOf(socket.id);
    if (index !== -1) {
        room.players.splice(index, 1);
        socket.to(roomId).emit("playerLeft", socket.id);
    }

    if (room.players.length === 0) delete rooms[roomId];

    delete socketRooms[socket.id];
  });
});


httpServer.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

function generateRoomId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function findOrCreateRoom() {
    for (const id in rooms) {
        if (rooms[id].players.length < 2) return id;
    }
    const newId = generateRoomId();
    rooms[newId] = { players: [], state: { p1: null, p2: null, bullets: [] } };
    return newId;
}