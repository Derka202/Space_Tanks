import seedrandom from "seedrandom";
import { Asteroid } from "./Asteroid.js";
import { Assets, Sprite } from "pixi.js";

export class AsteroidField {
    //bounds is the bounds of the asteroid field, not the game window
    constructor(seed, bounds) {
        this.seed = seed;
        this.bounds = bounds;
        this.asteroids = [];
        this.rng = seedrandom(seed);
    }

    async init(gameWorld) {
        const texture = await Assets.load("../assets/asteroid.png");

        for (let i = 0; i < 10; i++) {
            const x = this.rng() * this.bounds.x;
            const y = this.rng() * this.bounds.y;
            const vx = (this.rng() - 0.5) * 0.5;
            const vy = (this.rng() - 0.5) * 0.5;
            const mass = 20 + this.rng() * 30;
            const radius = 20 + this.rng() * 30;

            const asteroid = new Asteroid(i, x, y, vx, vy, mass, radius, texture);
            this.asteroids.push(asteroid);
            gameWorld.addChild(asteroid.sprite);
        }
    }

    updateAll(deltaMS) {
        for (const a of this.asteroids) {
            a.update(deltaMS, this.bounds);
        }
    }

    // checkCollisions(ships, bullets) {
    //     this.checkBulletCollisions(bullets);
    //     this.checkShipCollisions(ships);
    //     this.checkAsteroidCollisions();
    // }

    // checkBulletCollisions(bullets) {
    //     for (const asteroid of this.asteroids) {
    //         for (const bullet of bullets) {
    //             if (this.intersects(asteroid, bullet)) {
    //                 asteroid.handleHit();
    //                 bullet.handleHit();
    //             }
    //         }
    //     }
    // }

    // checkShipCollisions(ships) {
    //     for (const asteroid of this.asteroids) {
    //         for (const ship of ships) {
    //             if (this.intersects(asteroid, ship)) {
    //                 ship.handleCollision(asteroid);
    //             }
    //         }
    //     }
    // }

    // checkAsteroidCollisions() {
    //     for (let i = 0; i < this.asteroids.length; i++) {
    //         for (let j = i + 1; j < this.asteroids.length; j++) {
    //             const a1 = this.asteroids[i];
    //             const a2 = this.asteroids[j];
    //             if (this.intersects(a1, a2)) {
    //                 this.resolveAsteroidCollision(a1, a2);
    //             }
    //         }
    //     }
    // }

    // //Assumes a & b have x,y,radius properties
    // intersects(a, b) {
    //     const difx = a.sprite.x - b.sprite.x;
    //     const dify = a.sprite.y - b.sprite.y;
    //     const distSq = difx * difx + dify * dify;
    //     const minDist = a.radius + b.radius;
    //     return distSq < minDist * minDist;
    // }

    // resolveAsteroidCollision(a1, a2) {
    //     // Bounce asteroids off each other
    //     const dx = a2.sprite.x - a1.sprite.x;
    //     const dy = a2.sprite.y - a1.sprite.y;
    //     const dist = Math.sqrt(dx * dx + dy * dy);
    //     const overlap = (a1.radius + a2.radius - dist) / 2;

    //     // separate them
    //     const nx = dx / dist;
    //     const ny = dy / dist;

    //     a1.sprite.x -= nx * overlap;
    //     a1.sprite.y -= ny * overlap;
    //     a2.sprite.x += nx * overlap;
    //     a2.sprite.y += ny * overlap;

    //     // reverse velocities
    //     const temp = { x: a1.vx, y: a1.vy };
    //     a1.vx = a2.vx;
    //     a1.vy = a2.vy;
    //     a2.vx = temp.x;
    //     a2.vy = temp.y;
    // }
}
