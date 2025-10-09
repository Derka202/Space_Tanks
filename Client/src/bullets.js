import { Graphics } from "pixi.js";

export function createBullet(x, y, rotation) {
    const bullet = new Graphics()
        .circle(0, 0, 4)
        .fill(0xffffff);

    bullet.x = x;
    bullet.y = y;
    bullet.rotation = rotation;
    bullet.speed = 6;         // pixels per tick

    return bullet;

    //Add radius property for collision detection
    //add handleHit method to remove bullet on impact
}
