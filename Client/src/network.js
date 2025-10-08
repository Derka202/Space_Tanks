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

    sendBullet(bullet) {
        this.socket.emit("fireBullet", bullet);
    }

    onBulletFired(callback) {
        this.socket.on("bulletFired", callback);
    }

    onGameStart(callback) {
        this.socket.on('gameStart', callback);
    }

    onTurnChange(callback) {
        this.socket.on("turnChange", callback);
    }
}
