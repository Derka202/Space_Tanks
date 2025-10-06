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
        const texture = await Assets.load("assets/asteroid.png");

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
}
