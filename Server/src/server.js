import { createUser, isValidUser, getTopHighScores, createGameRecord, recordGameStats, saveReplay, getReplay, getUserGames, getUserHighScore } from "./database.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { AsteroidField } from "./AsteroidField.js";

const rooms = {};
const socketRooms = {};

//Pre: req is incoming HTTP request: this callback handles the request and routes it manually
//Post: processes HTTP requests for user registration, login, highscores, game records, and user games
const httpServer = createServer(async (req, res) => {
  
  //Pre: req is incoming HTTP request
  //Post: returns parsed JSON body of request
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

  //Pre: res is HTTP response, obj is object to send as JSON, status is HTTP status code
  //Post: sends JSON response with given status code
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

  if (req.method == "GET" && req.url.startsWith("/personalbest")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const username = url.searchParams.get("username");
    const personalBest = await getUserHighScore(username);
    

    sendJson(res, {success: true, personalBest})
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
      const scores = await getTopHighScores(15);

      sendJson(res, {success: true, scores});
    } catch (err) {
      sendJson(res, {success: false, error: err.message}, 500)
    }
  }

  if (req.method === "POST" && req.url === "/creategamerecord") {
    try {
      const ids = await getJsonBody(req);

      const gameId = await createGameRecord(ids.userId1, ids.userId2);
      sendJson(res, {success: true, gameId});
    } catch (err) {
      sendJson(res, {success: false, error: err.message}, 500);
    }
  }

  if (req.method === "GET" && req.url.startsWith("/getusergames")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get("userid");
      const games = await getUserGames(userId);
      sendJson(res, {success: true, games});
    } catch (err) {
      sendJson(res, {success: false, error: err.message}, 500)
    }
  }

  if (req.method === "GET" && req.url.startsWith("/getgamedata")) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const gameId = url.searchParams.get("gameid");
      const replayRows = await getReplay(gameId);
      const replayData = replayRows[0].replay_data;
      sendJson(res, {success: true, replayData});
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


//Pre: socket is connected client socket
//Post: handles all socket events for game rooms, player actions, and game state updates
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("updatePosition", (data) => {
    const roomId = socketRooms[socket.id];
    if (!roomId) return;
    const room = rooms[roomId];

    const playerIndex = room.players.indexOf(socket.id);
    const shipKey = playerIndex === 0 ? "shipOne" : "shipTwo";

    if (playerIndex === room.state.turn) {
      const fuelCost = 1;
      if (room.state.fuel[shipKey] >= fuelCost) {
        room.state.fuel[shipKey] -= fuelCost;
      }

      const pos = {x: data.x, y: data.y, rotation: data.rotation};
      if (playerIndex === 0) room.state.p1 = pos;
      else room.state.p2 = pos;
      
      io.to(roomId).emit("playerMoved", {
        id: socket.id,
        pos: pos,
      });
    }
  });

  socket.on("joinRoom", (user, userId) => {
    const roomId = findOrCreateRoom();
    const room = rooms[roomId];
    room.players.push(socket.id);
    room.usernames.push(user);
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
      owner: playerIndex
    });
  });

  socket.on("leaveQueue", () => {
    const roomId = socketRooms[socket.id];
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        room.userIds.splice(playerIndex, 1);
        socket.leave(roomId);
        delete socketRooms[socket.id];
        delete rooms[roomId];
    }
  });

  socket.on("powerUpCollected", ({roomId, id}) => {
    const room = rooms[roomId];
    const p = room.powerups.find(p => p.id === id);
    if (!p) return;

    room.powerups = room.powerups.filter(pp => pp.id !== id);
    const playerIndex = room.players.indexOf(socket.id);
    const key = playerIndex === 0 ? "shipOne" : "shipTwo";

    if (p.type === "shield") {
      p.turnsLeft = 3;
      room.state.powerups[key].shield = p;
    }

    io.to(roomId).emit("powerUpRemoved", {id, playerIndex, type: p.type});
  });
    
  socket.on("bulletEnded", async ({roomId}) => {
    const room = rooms[roomId];
    
    progressTurn(roomId);
  });

  socket.on("bulletHit", () => {
    const roomId = socketRooms[socket.id];
    const room = rooms[roomId];
    const shooterIndex = room.players.indexOf(socket.id);
    const hitPlayerIndex = shooterIndex === 0 ? 1 : 0;
    const hitKey = hitPlayerIndex === 0 ? "shipOne" : "shipTwo";
    const shooterKey = shooterIndex === 0 ? "shipOne" : "shipTwo";
    const shieldPowerUp = room.state.powerups[hitKey].shield;

    if (shieldPowerUp && shieldPowerUp.turnsLeft > 0) {
      room.state.powerups[hitKey].shield = null;
      io.to(roomId).emit("powerUpExpired", {playerKey: hitKey, type: shieldPowerUp.type});
      return;
    }

    room.state.scores[shooterKey] += 20;
    io.to(roomId).emit("scoreUpdated", room.state.scores);
  });

  // Handle bullet hitting asteroid
  socket.on("asteroidHit", ({ roomId, asteroidId, bulletOwnerIndex, bulletIndex }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Remove asteroid from server state
    const removed = room.asteroidField.removeAsteroid(asteroidId);
    if (removed) {
      // Award points for destroying asteroid
      if (bulletOwnerIndex === 0) {
        room.state.scores.shipOne += 10;
      } else if (bulletOwnerIndex === 1) {
        room.state.scores.shipTwo += 10;
      }
      
      // Broadcast updated scores
      io.to(roomId).emit("scoreUpdated", room.state.scores);

      io.to(roomId).emit("bulletDestroyed", {ownerIndex: bulletOwnerIndex, bulletIndex});

      progressTurn(roomId);
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

  socket.on("fuelUsed", ({ roomId, player, amount }) => {
    const room = rooms[roomId];

    const fuelKey = player === 0 ? "shipOne" : "shipTwo";
    room.state.fuel[fuelKey] = Math.max(0, room.state.fuel[fuelKey] - amount);

    io.to(roomId).emit("fuelUpdated", room.state.fuel);
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


//Pre: none
//Post: starts HTTP and WebSocket server on port 3000, ensures guest user exists
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

async function progressTurn(roomId) {
  const room = rooms[roomId];

  // Update asteroids before turn change
  room.asteroidField.updateAll(1000);

  //Record Game Events
    room.replay.turns.push({
      turn: room.state.turnCount,
      scores: { ...room.state.scores },
      fuel: { ...room.state.fuel },
      asteroids: room.asteroidField.getState(),
      ships: {
        shipOne: room.state.p1,
        shipTwo: room.state.p2
      },
      activePowerups: { ...room.state.powerups },
      uncollectedPowerups: room.powerups
    });

    // Decrement powerup life
    for (const key of ["shipOne", "shipTwo"]) {
      const shipPowerups = room.state.powerups[key];
      for (const type in shipPowerups) {
        const powerup = shipPowerups[type];
        if (!powerup) continue;

        powerup.turnsLeft--;
        if (powerup.turnsLeft <= 0) {
          shipPowerups[type] = null;
          io.to(roomId).emit("powerUpExpired", {playerKey: key, type: powerup.type});
        }
      }
    }

    // Progress Turn
    room.state.turn = (room.state.turn + 1) % 2;
    room.state.turnCount++;

    // Refuel ship if turn
    if (room.state.turn === 0) room.state.fuel.shipOne = 100;
    else room.state.fuel.shipTwo = 100;
    
    // Send turn change with asteroid state
    io.to(roomId).emit("turnChange", {
      currentTurn: room.state.turn, 
      turnCount: room.state.turnCount,
      asteroidState: room.asteroidField.getState(),
      fuel: room.state.fuel
    });

    if (Math.floor(Math.random() * 5) + 1 === 5) {
      const type = "shield";
      const x = Math.floor(Math.random() * 700) + 50;
      const y = Math.floor(Math.random() * 500) + 50;
      const id = crypto.randomUUID();

      room.powerups.push({id, type, x, y});
      io.to(roomId).emit("powerUpSpawn", {id, type, x, y});
    }

    if (room.state.turnCount == 21) {
      let winningShip = null;
      let winnerId = null;
      let winnerScore = null;
      let loserId = null;
      let loserScore = null;
      if (room.state.scores.shipOne > room.state.scores.shipTwo) {
        winningShip = room.usernames[0];
        winnerId = room.userIds[0];
        winnerScore = room.state.scores.shipOne;
        loserId = room.userIds[1];
        loserScore = room.state.scores.shipTwo;
      }
      else if (room.state.scores.shipOne < room.state.scores.shipTwo) {
        winningShip = room.usernames[1];
        winnerId = room.userIds[1];
        winnerScore = room.state.scores.shipTwo;
        loserId = room.userIds[0];
        loserScore = room.state.scores.shipOne;
      }
      else {
        winningShip = "Tie";
      }

      if (!(room.userIds[0] === 1 && room.userIds[1] === 1)) {
        const gameId = await createGameRecord(room.userIds[0], room.userIds[1]);
        const gameRecord = await recordGameStats(gameId, winnerId, loserId, winnerScore, loserScore);

        try {
          await saveReplay(gameId, room.replay);
        } catch (err) {
          console.error("Failed to save replay: ", err);
        }
      }

      io.to(roomId).emit("gameOver", {winner: winningShip, players: room.usernames, scores: room.state.scores});
    }
}

async function progressTurn(roomId) {
  const room = rooms[roomId];

  // Update asteroids before turn change
  room.asteroidField.updateAll(1000);

  //Record Game Events
    room.replay.turns.push({
      turn: room.state.turnCount,
      scores: { ...room.state.scores },
      fuel: { ...room.state.fuel },
      asteroids: room.asteroidField.getState(),
      ships: {
        shipOne: room.state.p1,
        shipTwo: room.state.p2
      },
      activePowerups: { ...room.state.powerups },
      uncollectedPowerups: room.powerups
    });

    // Decrement powerup life
    for (const key of ["shipOne", "shipTwo"]) {
      const shipPowerups = room.state.powerups[key];
      for (const type in shipPowerups) {
        const powerup = shipPowerups[type];
        if (!powerup) continue;

        powerup.turnsLeft--;
        if (powerup.turnsLeft <= 0) {
          shipPowerups[type] = null;
          io.to(roomId).emit("powerUpExpired", {playerKey: key, type: powerup.type});
        }
      }
    }

    // Progress Turn
    room.state.turn = (room.state.turn + 1) % 2;
    room.state.turnCount++;

    // Refuel ship if turn
    if (room.state.turn === 0) room.state.fuel.shipOne = 100;
    else room.state.fuel.shipTwo = 100;
    
    // Send turn change with asteroid state
    io.to(roomId).emit("turnChange", {
      currentTurn: room.state.turn, 
      turnCount: room.state.turnCount,
      asteroidState: room.asteroidField.getState(),
      fuel: room.state.fuel
    });

    if (Math.floor(Math.random() * 5) + 1 === 5) {
      const type = "shield";
      const x = Math.floor(Math.random() * 700) + 50;
      const y = Math.floor(Math.random() * 500) + 50;
      const id = crypto.randomUUID();

      room.powerups.push({id, type, x, y});
      io.to(roomId).emit("powerUpSpawn", {id, type, x, y});
    }

    if (room.state.turnCount == 21) {
      let winningShip = null;
      let winnerId = null;
      let winnerScore = null;
      let loserId = null;
      let loserScore = null;
      if (room.state.scores.shipOne > room.state.scores.shipTwo) {
        winningShip = room.usernames[0];
        winnerId = room.userIds[0];
        winnerScore = room.state.scores.shipOne;
        loserId = room.userIds[1];
        loserScore = room.state.scores.shipTwo;
      }
      else if (room.state.scores.shipOne < room.state.scores.shipTwo) {
        winningShip = room.usernames[1];
        winnerId = room.userIds[1];
        winnerScore = room.state.scores.shipTwo;
        loserId = room.userIds[0];
        loserScore = room.state.scores.shipOne;
      }
      else {
        winningShip = "Tie";
      }

      if (!(room.userIds[0] === 1 && room.userIds[1] === 1)) {
        const gameId = await createGameRecord(room.userIds[0], room.userIds[1]);
        const gameRecord = await recordGameStats(gameId, winnerId, loserId, winnerScore, loserScore);

        try {
          await saveReplay(gameId, room.replay);
        } catch (err) {
          console.error("Failed to save replay: ", err);
        }
      }

      io.to(roomId).emit("gameOver", {winner: winningShip, players: room.usernames, scores: room.state.scores});
    }
}


//Pre: length is length of room ID to generate
//Post: returns a random alphanumeric string of given length
function generateRoomId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}


//Pre: none
//Post: either finds existing room with space or creates new room, then returns room ID
function findOrCreateRoom() {
  for (const id in rooms) {
    if (rooms[id] && rooms[id].players.length < 2) return id;
  }
  const newId = generateRoomId();
  const asteroidSeed = newId + "_asteroidSeed";
  
  // Create room with asteroid field
  rooms[newId] = { 
    players: [],
    usernames: [],
    userIds: [],
    state: { 
      p1: null, 
      p2: null, 
      bullets: [], 
      turn: 0, 
      turnCount: 1, 
      scores: {shipOne: 0, shipTwo: 0},
      fuel: {shipOne: 100, shipTwo: 100},
      powerups: { shipOne: {}, shipTwo: {} }
    }, 
    asteroidSeed,
    asteroidField: new AsteroidField(asteroidSeed, { x: 800, y: 600 }),
    replay: {
      turns: []
    },
    powerups: []
  };
  return newId;
}


// Server-wide asteroid tick
const ASTEROID_TICK_MS = 50; // send updates every 100ms
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
