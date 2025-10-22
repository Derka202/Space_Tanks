// asteroid.js
import { Sprite } from "pixi.js";

export class Asteroid {
    constructor(id, x, y, vx, vy, mass, radius, texture) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.radius = radius;
        this.destroyed = false;

        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.width = this.sprite.height = radius * 2;
        this.sprite.x = x;
        this.sprite.y = y;
    }

    update(deltaMS, bounds) {
        const dt = deltaMS / 1000; // convert ms to seconds
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wrap around edges
        if (this.x < 0) this.x += bounds.x;
        if (this.x > bounds.x) this.x -= bounds.x;
        if (this.y < 0) this.y += bounds.y;
        if (this.y > bounds.y) this.y -= bounds.y;

        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    checkBulletCollision(bullet) {
        if (!bullet.alive || this.destroyed) return false;
        
        const dx = this.x - bullet.x;
        const dy = this.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.radius + 4); // 4 is bullet radius
    }

    checkShipCollision(ship) {
        if (this.destroyed) return false;
        
        const dx = this.x - ship.sprite.x;
        const dy = this.y - ship.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.radius + 20); // 20 is approximate ship radius
    }

    handleHit(container) {
        this.destroyed = true;
        if (container && container.children.includes(this.sprite)) {
            container.removeChild(this.sprite);
        }
    }
}