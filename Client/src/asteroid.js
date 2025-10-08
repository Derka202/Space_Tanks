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
}
