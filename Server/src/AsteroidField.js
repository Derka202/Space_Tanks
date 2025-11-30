import seedrandom from "seedrandom";
import { Asteroid } from "./Asteroid.js";


export class AsteroidField {
    //Pre: seed is string for RNG, bounds is {x, y}
    //Post: initialized asteroid field with 10 asteroids
    constructor(seed, bounds) {
        this.seed = seed;
        this.bounds = bounds;
        this.asteroids = [];
        this.rng = seedrandom(seed);
        this.init();
    }

    //Pre: none
    //Post: populates asteroid field with randomly generated asteroids
    init() {
        for (let i = 0; i < 10; i++) {
            const x = this.rng() * this.bounds.x;
            const y = this.rng() * this.bounds.y;
            const vx = (this.rng() - 0.5) * 50;
            const vy = (this.rng() - 0.5) * 50;
            const mass = 20 + this.rng() * 30;
            const radius = 20 + this.rng() * 30;

            this.asteroids.push(new Asteroid(i, x, y, vx, vy, mass, radius));
        }
    }

    //Pre: deltaMS in milliseconds
    //Post: calls update method of all asteroids in the field
    updateAll(deltaMS) {
        for (const a of this.asteroids) {
            a.update(deltaMS, this.bounds);
        }
    }

    //Pre: none
    //Post: returns array of asteroid states for the client
    getState() {
        return this.asteroids.map(a => ({
            id: a.id,
            x: a.x,
            y: a.y,
            vx: a.vx,
            vy: a.vy,
            mass: a.mass,
            radius: a.radius
        }));
    }

    //Pre: asteroidId is the id of an asteroid to remove from this.asteroids
    //Post: removed asteroid with an id matching asteroid.id from this.asteroids
    removeAsteroid(asteroidId) {
        const index = this.asteroids.findIndex(a => a.id === asteroidId);
        if (index !== -1) {
            this.asteroids.splice(index, 1);
            return true;
        }
        return false;
    }
}