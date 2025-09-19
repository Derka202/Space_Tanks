import { Sprite, Assets } from "pixi.js";
import { createBullet } from "./bullets.js";

export default class Ship {
    constructor(texture, x, y, rotation = 0, scale = 2) {
        this.sprite = new Sprite(texture);
        this.sprite.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.rotation = rotation;
        this.sprite.scale.set(scale);

        this.speed = 2;
        this.rotationSpeed = 0.05;
        this.bullets = [];
    }

    move(dx, dy) {
        this.sprite.x += dx * this.speed;
        this.sprite.y += dy * this.speed;
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
    }

    updateBullets(container, bounds) {
        this.bullets.forEach((bullet, i) => {
            bullet.x += Math.cos(bullet.rotation - (Math.PI / 2)) * bullet.speed;
            bullet.y += Math.sin(bullet.rotation - (Math.PI / 2)) * bullet.speed;

            if (
                bullet.x < 0 || bullet.x > bounds.width ||
                bullet.y < 0 || bullet.y > bounds.height
            ) {
                container.removeChild(bullet);
                this.bullets.splice(i, 1);
            }
        });
    }

    getPosition() {
    return { x: this.sprite.x, y: this.sprite.y, rotation: this.sprite.rotation };
    }
}
