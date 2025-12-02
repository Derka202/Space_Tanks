import { Graphics } from "pixi.js";

export function createBullet(x, y, rotation, owner) {
    const bullet = new Graphics()
        .circle(0, 0, 4)
        .fill(0xffffff);

    bullet.x = x;
    bullet.y = y;
    bullet.rotation = rotation;
    bullet.speed = 6; // pixels per tick
    bullet.owner = owner;
    bullet.alive = true;

    bullet.destroyBullet = (container) => {
        if (container && container.children.includes(bullet)) {
            container.removeChild(bullet);
        }
        bullet.alive = false;
    }

    return bullet;

    //add handleHit method to remove bullet on impact
}
