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

    /**
     * Sync asteroid state from server
     * @param {Array} serverAsteroids - Array of asteroid states from server
     * @param {Container} gameWorld - Game world container
     */
    syncFromServer(serverAsteroids, gameWorld) {
        // Handle removed asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const localAsteroid = this.asteroids[i];
            const serverAsteroid = serverAsteroids.find(sa => sa.id === localAsteroid.id);
            
            if (!serverAsteroid) {
                // Asteroid was destroyed on server
                localAsteroid.handleHit(gameWorld);
                this.asteroids.splice(i, 1);
            }
        }

        // Update or add asteroids
        serverAsteroids.forEach(serverState => {
            let localAsteroid = this.asteroids.find(a => a.id === serverState.id);
            
            if (localAsteroid) {
                // Update existing asteroid
                localAsteroid.x = serverState.x;
                localAsteroid.y = serverState.y;
                localAsteroid.vx = serverState.vx;
                localAsteroid.vy = serverState.vy;
                localAsteroid.sprite.x = serverState.x;
                localAsteroid.sprite.y = serverState.y;
            } else if (this.texture) {
                // Add new asteroid (e.g., from splitting - if you add that later)
                const newAsteroid = new Asteroid(
                    serverState.id,
                    serverState.x,
                    serverState.y,
                    serverState.vx,
                    serverState.vy,
                    serverState.mass,
                    serverState.radius,
                    this.texture
                );
                this.asteroids.push(newAsteroid);
                gameWorld.addChild(newAsteroid.sprite);
            }
        });
    }

    /**
     * Get serializable state for server
     */
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

    /**
     * Check collisions between bullets and asteroids
     */
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

    /**
     * Check collisions between ships and asteroids
     */
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

    /**
     * Remove an asteroid
     */
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