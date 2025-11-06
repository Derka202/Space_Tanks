import { createUser, isValidUser, getTopHighScores, createGameRecord, recordGameStats } from "./database.js";
import { createServer } from "http";
import { Server } from "socket.io";
import seedrandom from "seedrandom";

const rooms = {};
const socketRooms = {};

// Server-side Asteroid class (deterministic physics)
class Asteroid {
    constructor(id, x, y, vx, vy, mass, radius) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.radius = radius;
    }

    update(deltaMS, bounds) {
        const dt = deltaMS / 1000;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wrap around edges
        if (this.x < 0) this.x += bounds.x;
        if (this.x > bounds.x) this.x -= bounds.x;
        if (this.y < 0) this.y += bounds.y;
        if (this.y > bounds.y) this.y -= bounds.y;
    }
}

// Server-side AsteroidField
class AsteroidField {
    constructor(seed, bounds) {
        this.seed = seed;
        this.bounds = bounds;
        this.asteroids = [];
        this.rng = seedrandom(seed);
        this.init();
    }

    init() {
        for (let i = 0; i < 10; i++) {
            const x = this.rng() * this.bounds.x;
            const y = this.rng() * this.bounds.y;
            const vx = (this.rng() - 0.5) * 50;
            const vy = (this.rng() - 0.5) * 50;
            const mass = 20 + this.rng() * 30;
            const radius = 20 + this.rng() * 30;

            this.asteroids.push(new Asteroid(i, x, y, vx, vy, mass, radius));
        }
    }

    updateAll(deltaMS) {
        for (const a of this.asteroids) {
            a.update(deltaMS, this.bounds);
        }
    }

    getState() {
        return this.asteroids.map(a => ({
            id: a.id,
            x: a.x,
            y: a.y,
            vx: a.vx,
            vy: a.vy,
            mass: a.mass,
            radius: a.radius
        }));
    }

    removeAsteroid(asteroidId) {
        const index = this.asteroids.findIndex(a => a.id === asteroidId);
        if (index !== -1) {
            this.asteroids.splice(index, 1);
            return true;
        }
        return false;
    }
}

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
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

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
    socket.emit("roomJoined", { 
      roomId, 
      playerIndex: room.players.length - 1, 
      state: room.state, 
      asteroidSeed: room.asteroidSeed 
    });

    if (room.players.length === 2) {
      room.state.turn = 0;
      io.to(roomId).emit("gameStart", { startingTurn: room.state.turn });
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
      owner: socket.id,
      playerIndex: playerIndex
    });
  });
    
  socket.on("bulletEnded", async ({roomId}) => {
    const room = rooms[roomId];
    
    // Update asteroids before turn change
    room.asteroidField.updateAll(1000); // 1 second of physics per turn
    
    room.state.turn = (room.state.turn + 1) % 2;
    room.state.turnCount++;
    
    // Send turn change with asteroid state
    io.to(roomId).emit("turnChange", {
      currentTurn: room.state.turn, 
      turnCount: room.state.turnCount,
      asteroidState: room.asteroidField.getState()
    });

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
    if (room.state.turnCount == 21) {
      let winningShip = null;
      if (room.state.scores.shipOne > room.state.scores.shipTwo) winningShip = "Ship One";
      else if (room.state.scores.shipOne < room.state.scores.shipTwo) winningShip = "Ship Two";
      else winningShip = "Tie";
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

  // Handle bullet hitting asteroid
  socket.on("asteroidHit", ({ roomId, asteroidId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Remove asteroid from server state
    const removed = room.asteroidField.removeAsteroid(asteroidId);
    if (removed) {
      const playerIndex = room.players.indexOf(socket.id);
      
      // Award points for destroying asteroid
      if (playerIndex === 0) {
        room.state.scores.shipOne += 10;
      } else if (playerIndex === 1) {
        room.state.scores.shipTwo += 10;
      }
      
      // Broadcast updated scores
      io.to(roomId).emit("scoreUpdated", room.state.scores);
    }
  });

  // Handle ship hitting asteroid (damage)
  socket.on("asteroidDamage", ({ roomId, asteroidId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const playerIndex = room.players.indexOf(socket.id);
    
    // Create unique key to prevent duplicate damage in same turn
    const damageKey = `${playerIndex}-${asteroidId}-${room.state.turnCount}`;
    
    // Initialize damage tracking if not exists
    if (!room.asteroidDamageTracking) {
      room.asteroidDamageTracking = new Set();
    }
    
    // Only apply damage if not already processed this turn
    if (!room.asteroidDamageTracking.has(damageKey)) {
      room.asteroidDamageTracking.add(damageKey);
      
      // Deduct points for hitting asteroid
      if (playerIndex === 0) {
        room.state.scores.shipOne = Math.max(0, room.state.scores.shipOne - 5);
      } else if (playerIndex === 1) {
        room.state.scores.shipTwo = Math.max(0, room.state.scores.shipTwo - 5);
      }
      
      // Broadcast updated scores
      io.to(roomId).emit("scoreUpdated", room.state.scores);
    }
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
  
  // Create room with asteroid field
  rooms[newId] = { 
    players: [], 
    userIds: [],
    state: { 
      p1: null, 
      p2: null, 
      bullets: [], 
      turn: 0, 
      turnCount: 1, 
      scores: {shipOne: 0, shipTwo: 0} 
    }, 
    asteroidSeed,
    asteroidField: new AsteroidField(asteroidSeed, { x: 800, y: 600 })
  };
  return newId;
}

// Server-wide asteroid tick
const ASTEROID_TICK_MS = 100; // send updates every 100ms
let lastServerTick = Date.now();

function serverAsteroidTick() {
  const now = Date.now();
  const deltaMS = now - lastServerTick;
  lastServerTick = now;

  // iterate rooms and update asteroid fields, then emit updates
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (!room || !room.asteroidField) continue;

    room.asteroidField.updateAll(deltaMS);
    io.to(roomId).emit("asteroidUpdate", {
      asteroidState: room.asteroidField.getState(),
      timestamp: now
    });
  }
}

// Start the loop
setInterval(serverAsteroidTick, ASTEROID_TICK_MS);
