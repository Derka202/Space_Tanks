import { createUser, isValidUser, getTopHighScores, createGameRecord, recordGameStats } from "./database.js";
import { createServer } from "http";
import { Server } from "socket.io";


const rooms = {};
const socketRooms = {};

const httpServer = createServer(async (req, res) => {
  function getJsonBody(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => (data += chunk.toString()));
      req.on("end", () => {
        try {
          resolve(JSON.parse(data || "{}"));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  function sendJson(res, obj, status = 200) {
    res.writeHead(status, {"Content-Type": "application/json"});
    res.end(JSON.stringify(obj));
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/register") {
    try {
      const body = await getJsonBody(req);
      
      const user = await createUser(body.username, body.password);
      if (!user) {
        res.writeHead(409, {"Content-Type": "application/json"});
        res.end(JSON.stringify({success: false, error: "Username already exists"}));
        return;
      }
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify({success: true, user}));
    } catch (err) {
      console.error("Failed to parse request body", err);
    }
    return;
  }

  if (req.method === "POST" && req.url === "/login") {
    try {
      const body = await getJsonBody(req);
      const userId = await isValidUser(body.username, body.password);

      if (!userId) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end(JSON.stringify({success: false, error: "Invalid Username or Password"}));
        return;
      }
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify({success: true, userId}));
      return;
    } catch (err) {
      console.error("Failed to parse request body", err);
    }
  }

  if (req.method === "GET" && req.url === "/highscores") {
    try {
      console.log("Received request for high scores");
      const scores = await getTopHighScores(10);
      console.log(scores);

      sendJson(res, {success: true, scores});
    } catch (err) {
      sendJson(res, {success: false, error: err.message}, 500)
    }
  }

  if (req.method === "POST" && req.url === "/creategamerecord") {
    console.log("Received request to create game record");
    try {
      const ids = await getJsonBody(req);

      const gameId = await createGameRecord(ids.userId1, ids.userId2);
      console.log("Created game record with ID:", gameId);
      sendJson(res, {success: true, gameId});
    } catch (err) {
      sendJson(res, {success: false, error: err.message}, 500);
    }
  }
});

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
  });

  socket.on("autoJoin", (userId) => {
    const roomId = findOrCreateRoom();
    const room = rooms[roomId];
    room.players.push(socket.id);
    room.userIds.push(userId);
    socket.join(roomId);
    socketRooms[socket.id] = roomId;
    socket.emit("roomJoined", { roomId, playerIndex: rooms[roomId].players.length - 1, state: rooms[roomId].state, asteroidSeed: rooms[roomId].asteroidSeed });

    if (room.players.length === 2) {
      room.state.turn = 0;
      io.to(roomId).emit("gameStart", {  startingTurn: room.state.turn });
    }
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

    });
    
    socket.on("bulletEnded", async ({roomId}) => {
      const room = rooms[roomId];
      
      room.state.turn = (room.state.turn + 1) % 2;
      room.state.turnCount++;
      io.to(roomId).emit("turnChange", {currentTurn: room.state.turn, turnCount: room.state.turnCount});

      if (room.state.turnCount == 21) {
        let winningShip = null;
        let winnerId = null;
        let winnerScore = null;
        let loserId = null;
        let loserScore = null;
        if (room.state.scores.shipOne > room.state.scores.shipTwo) {
          winningShip = "Ship One";
          winnerId = room.userIds[0];
          winnerScore = room.state.scores.shipOne;
          loserId = room.userIds[1];
          loserScore = room.state.scores.shipTwo;
        }
        else if (room.state.scores.shipOne < room.state.scores.shipTwo) {
          winningShip = "Ship Two";
          winnerId = room.userIds[1];
          winnerScore = room.state.scores.shipTwo;
          loserId = room.userIds[0];
          loserScore = room.state.scores.shipOne;
        }
        else {
          winningShip = "Tie";
        }

        const gameId = await createGameRecord(room.userIds[0], room.userIds[1]);
        console.log("Created game record with ID---:", gameId);
        const gameRecord = await recordGameStats(gameId, winnerId, loserId, winnerScore, loserScore);
        console.log("Recorded game stats:", gameRecord);

        io.to(roomId).emit("gameOver", {winner: winningShip, scores: room.state.scores});
      }
  });

  socket.on("bulletHit", () => {
    const roomId = socketRooms[socket.id];
    const room = rooms[roomId];
    const playerIndex = room.players.indexOf(socket.id);

    if (playerIndex === 0) room.state.scores.shipOne += 20;
    else if (playerIndex === 1) room.state.scores.shipTwo += 20;

    io.to(roomId).emit("scoreUpdated", room.state.scores);
  });

  socket.on("getUserIds", () => {
    const roomId = socketRooms[socket.id];
    const room = rooms[roomId];

    io.to(roomId).emit("userIds", room.userIds);
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


httpServer.listen(3000, async () => {
  console.log("Server running on http://localhost:3000");

  let guestId = await isValidUser("guest", "");
  if (!guestId) {
    guestId = await createUser("guest", "");
    console.log("Created Guest user with ID:", guestId);
  }
  else {
    console.log("Guest user exists with ID:", guestId);
  }
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
    rooms[newId] = { players: [], userIds: [], state: { p1: null, p2: null, bullets: [], turn: 0, turnCount: 1, scores: {shipOne: 0, shipTwo: 0} }, asteroidSeed };
    return newId;
}