import { io } from "socket.io-client";

export default class Network {
    constructor(serverUrl) {
        this.socket = io(serverUrl);

        this.socket.on("connect", () => {
            console.log("Connected to server with ID:", this.socket.id);
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });
    }

    joinRoom(roomId) {
        this.socket.emit("joinRoom", roomId);
    }

    autoJoin() {
        this.socket.emit("autoJoin");
    }

    sendPosition(data, roomId) {
        this.socket.emit("updatePosition", data, roomId);
    }

    onPlayerMoved(callback) {
        this.socket.on("playerMoved", callback);
    }

    onRoomJoined(callback) {
        this.socket.on("roomJoined", callback);
    }

    onRoomUpdate(callback) {
        this.socket.on("roomUpdate", callback);
    }

    onPlayerLeft(callback) {
        this.socket.on("playerLeft", callback);
    }

    onRoomFull(callback) {
        this.socket.on("roomFull", callback);
    }
}
