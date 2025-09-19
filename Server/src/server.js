import { createServer } from "http";
import { Server } from "socket.io";


const gameState = {
  p1: { x: 40, y: 300, rotation: (Math.PI / 2) },
  p2: { x: 760, y: 300, rotation: (Math.PI / 2) * 3 },
  turn: 1
};

// Create HTTP server
const httpServer = createServer();

// Attach Socket.IO to the server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all origins (for testing)
  }
});

// Listen for client connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Example: handle custom event
  socket.on("message", (data) => {
    console.log("Message from client:", data);
  });

  // Example: send message to client
  socket.emit("welcome", "Hello from server!");

  socket.on("keyInput", (keys) => {
    //console.log(keys);
  });

  socket.on("updatePosition", (pos) => {
    gameState.p1 = pos;

    console.log(gameState);
  })
});

// Start the server
httpServer.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
