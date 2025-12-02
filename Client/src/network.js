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

    joinRoom(user, userId) {
        this.socket.emit("joinRoom", user, userId);
    }

    sendPosition(data, roomId) {
        this.socket.emit("updatePosition", data, roomId);
    }

    onPlayerMoved(callback) {
        this.socket.on("playerMoved", callback);
    }

    sendFuelUsed(roomId, player, amount) {
        this.socket.emit("fuelUsed", { roomId, player, amount });
    }

    onFuelUpdated(callback) {
        this.socket.on("fuelUpdated", callback)
    }

    sendLeaveQueue() {
        this.socket.emit("leaveQueue");
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

    sendAsteroidHit(roomId, asteroidId, bulletOwnerIndex, bulletIndex) {
        console.log(roomId, asteroidId, bulletOwnerIndex, bulletIndex);
        this.socket.emit("asteroidHit", { roomId, asteroidId, bulletOwnerIndex, bulletIndex });
    }

    sendAsteroidDamage(roomId, asteroidId) {
        this.socket.emit('asteroidDamage', { roomId, asteroidId });
    }

    onAsteroidUpdate(callback) {
        this.socket.on("asteroidUpdate", callback);
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

    onPowerUpSpawn(callback) {
        this.socket.on("powerUpSpawn", callback);
    }

    sendPowerUpCollected(roomId, id) {
        this.socket.emit("powerUpCollected", {roomId, id});
    }

    onPowerUpRemoved(callback) {
        this.socket.on("powerUpRemoved", callback);
    }

    onPowerUpExpired(callback) {
        this.socket.on("powerUpExpired", callback);
    }

    onBulletDestroyed(callback) {
        this.socket.on("bulletDestroyed", callback);
    }
}
