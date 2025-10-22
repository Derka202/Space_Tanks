import seedrandom from "seedrandom";
import { Asteroid } from "./asteroid.js";
import { Assets } from "pixi.js";

export class AsteroidField {
    constructor(seed, bounds) {
        this.seed = seed;
        this.bounds = bounds;
        this.asteroids = [];
        this.rng = seedrandom(seed);
        this.texture = null;
    }

    async init(gameWorld) {
        try {
            this.texture = await Assets.load("assets/asteroid.png");
        } catch (error) {
            console.error("Failed to load asteroid texture:", error);
            // Create a fallback colored circle if texture fails
            this.texture = null;
        }

        for (let i = 0; i < 10; i++) {
            const x = this.rng() * this.bounds.x;
            const y = this.rng() * this.bounds.y;
            const vx = (this.rng() - 0.5) * 50;
            const vy = (this.rng() - 0.5) * 50;
            const mass = 20 + this.rng() * 30;
            const radius = 20 + this.rng() * 30;

            const asteroid = new Asteroid(i, x, y, vx, vy, mass, radius, this.texture);
            this.asteroids.push(asteroid);
            gameWorld.addChild(asteroid.sprite);
        }
    }

    updateAll(deltaMS) {
        for (const a of this.asteroids) {
            a.update(deltaMS, this.bounds);
        }
    }

    checkBulletCollisions(bullets, onHit) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.alive) continue;

            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                
                if (asteroid.checkBulletCollision(bullet)) {
                    onHit(bullet, asteroid, j);
                    break;
                }
            }
        }
    }

    checkShipCollisions(ships, onHit) {
        ships.forEach((ship, shipIndex) => {
            for (let j = 0; j < this.asteroids.length; j++) {
                const asteroid = this.asteroids[j];
                
                if (asteroid.checkShipCollision(ship)) {
                    onHit(ship, asteroid, shipIndex, j);
                }
            }
        });
    }

    removeAsteroid(index, container) {
        if (index >= 0 && index < this.asteroids.length) {
            const asteroid = this.asteroids[index];
            asteroid.handleHit(container);
            this.asteroids.splice(index, 1);
            return asteroid;
        }
        return null;
    }
}