import { Sprite, Assets } from "pixi.js";
import { createBullet } from "./bullets.js";
import Network from "./network.js";

export class Ship {
    constructor(texture, x, y, rotation = 0, scale = 2, bounds = { width: 800, height: 600 }, margin = 5, playerIndex, network, roomId) {
        this.sprite = new Sprite(texture);
        this.sprite.pivot.set(texture.width / 2, texture.height / 2);
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.rotation = rotation;
        this.sprite.scale.set(scale);
        this.bounds = bounds;
        this.margin = margin;
        this.playerIndex = playerIndex
        this.network = network;
        this.roomId = roomId;

        this.speed = 2;
        this.rotationSpeed = 0.05;
        this.bullets = [];
        this.maxFuel = 100;
        this.fuel = this.maxFuel;
    }

    move(dx, dy, otherShip) {
        if (this.fuel <= 0) return;

        const nextX = this.sprite.x + dx * this.speed;
        const nextY = this.sprite.y + dy * this.speed;

        const clampedX = Math.min(Math.max(nextX, this.margin), this.bounds.width - this.margin);
        const clampedY = Math.min(Math.max(nextY, this.margin), this.bounds.height - this.margin);

        if (otherShip) {
            const padding = -20;

            const dxShip = clampedX - otherShip.sprite.x;
            const dyShip = clampedY - otherShip.sprite.y;
            const distance = Math.sqrt(dxShip * dxShip + dyShip * dyShip);
            const minDistance = (this.sprite.width + otherShip.sprite.width) / 2 + padding;

            if (distance < minDistance) {
                const angle = Math.atan2(dyShip, dxShip);
                this.sprite.x = otherShip.sprite.x + Math.cos(angle) * minDistance;
                this.sprite.y = otherShip.sprite.y + Math.sin(angle) * minDistance;
                return;
            }
    }

    this.sprite.x = clampedX;
    this.sprite.y = clampedY;
    this.useFuel(0.5, this.network, this.roomId);
    }

    rotate(dir) {
        this.sprite.rotation += dir * this.rotationSpeed;
    }

    fire(container) {
        const bullet = createBullet(
            this.sprite.x,
            this.sprite.y,
            this.sprite.rotation
        );
        this.bullets.push(bullet);
        container.addChild(bullet);

        return bullet;
    }

    updateBullets(container, bounds, network, roomId, inputPlayerIndex) {
        this.bullets.forEach((bullet, i) => {
            bullet.x += Math.cos(bullet.rotation - (Math.PI / 2)) * bullet.speed;
            bullet.y += Math.sin(bullet.rotation - (Math.PI / 2)) * bullet.speed;

            if (
                bullet.x < 0 || bullet.x > bounds.width ||
                bullet.y < 0 || bullet.y > bounds.height
            ) {
                container.removeChild(bullet);
                this.bullets.splice(i, 1);
                if (bullet.owner === inputPlayerIndex) {
                    network.sendBulletEnded(roomId);
                }
            }
        });
    }

    getPosition() {
    return { x: this.sprite.x, y: this.sprite.y, rotation: this.sprite.rotation };
    }

    createBullet(x, y, rotation, container, inputPlayerIndex) {
        const bullet = createBullet(x, y, rotation, inputPlayerIndex);
        container.addChild(bullet);
        return bullet;
    }

    useFuel(amount, network, roomId) {
        this.fuel  = Math.max(0, this.fuel - amount);
        network.sendFuelUsed(roomId, this.playerIndex, amount);
        console.log("Current fuel level: ", this.fuel);
    }

    refillFuel() {
        this.fuel = this.maxFuel
    }
}

export function collision(a, b) {
    const dx = (a.sprite ? a.sprite.x : a.x) - (b.sprite ? b.sprite.x : b.x);
    const dy = (a.sprite ? a.sprite.y : a.y) - (b.sprite ? b.sprite.y : b.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radiusA = (a.radius || a.sprite?.width / 2 || 0) * 0.62;
    const radiusB = (b.radius || b.sprite?.width / 2 || 0) * 0.62;
    return distance < (radiusA + radiusB);
}
