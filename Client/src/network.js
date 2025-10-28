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

    autoJoin(userId) {
        this.socket.emit("autoJoin", userId);
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

    sendBulletHit() {
        this.socket.emit("bulletHit");
    }

    onScoreUpdated(callback) {
        this.socket.on("scoreUpdated", callback);
    }

    onGameStart(callback) {
        this.socket.on('gameStart', callback);
    }

    onTurnChange(callback) {
        this.socket.on("turnChange", callback);
    }

    sendBulletEnded(roomId) {
        this.socket.emit("bulletEnded", {roomId});
    }
    onGameOver(callback) {
        this.socket.on("gameOver", callback);
    }

    getUserIds() {
        this.socket.emit("getUserIds");
    }

    onUserIds(callback) {
        this.socket.once("userIds", (ids) => callback(ids || []));
    }
}
