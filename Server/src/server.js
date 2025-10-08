import { createServer } from "http";
import { Server } from "socket.io";


const rooms = {};
const socketRooms = {};

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, rooms);

  socket.on("updatePosition", (pos) => {
    const roomId = socketRooms[socket.id];
    if (!roomId) return;

    const room = rooms[roomId];

    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex === 0) room.state.p1 = pos;
    if (playerIndex === 1) room.state.p2 = pos;

    socket.to(roomId).emit("playerMoved", { id: socket.id, pos });

    console.log(rooms);
  });

  socket.on("autoJoin", () => {
    const roomId = findOrCreateRoom();
    const room = rooms[roomId];
    room.players.push(socket.id);
    socket.join(roomId);
    socketRooms[socket.id] = roomId;
    socket.emit("roomJoined", { roomId, playerIndex: rooms[roomId].players.length - 1, state: rooms[roomId].state, asteroidSeed: rooms[roomId].asteroidSeed });

    if (room.players.length === 2) {
      room.state.turn = 0;
      io.to(roomId).emit("gameStart", {  startingTurn: room.state.turn });
    }

    console.log("Current rooms:", JSON.stringify(rooms, null, 2));
  });

  socket.on("fireBullet", (bullet) => {
    const roomId = socketRooms[socket.id];
    if (!roomId) return;

    const room = rooms[roomId];

    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex === -1) return;
    if (playerIndex !== room.state.turn) return;

    room.state.bullets.push({
        x: bullet.x,
        y: bullet.y,
        rotation: bullet.rotation,
        owner: socket.id
      });

    io.to(roomId).emit("bulletFired", {
        x: bullet.x,
        y: bullet.y,
        rotation: bullet.rotation,
        owner: socket.id
      });

      room.state.turn = (room.state.turn + 1) % 2;
      io.to(roomId).emit("turnChange", {currentTurn: room.state.turn});
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
        if (rooms[id] && rooms[id].players.length < 2) return id;
    }
    const newId = generateRoomId();
    const asteroidSeed = newId + "_asteroidSeed";
    rooms[newId] = { players: [], state: { p1: null, p2: null, bullets: [], turn: 0 }, asteroidSeed };
    return newId;
}