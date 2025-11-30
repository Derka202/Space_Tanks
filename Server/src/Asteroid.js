export class Asteroid {
    //Pre: id is unique identifier, x and y are position, vx and vy are velocity, mass and radius are physical properties
    //Post: initialized values in an asteroid object
    constructor(id, x, y, vx, vy, mass, radius) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.radius = radius;
    }

    //Pre: deltaMS in milliseconds, bounds is {x, y}
    //Post: updates position based on velocity and deltaMS
    update(deltaMS, bounds) {
        const dt = deltaMS / 1000;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wrap around edges
        if (this.x < 0) this.x += bounds.x;
        if (this.x > bounds.x) this.x -= bounds.x;
        if (this.y < 0) this.y += bounds.y;
        if (this.y > bounds.y) this.y -= bounds.y;
    }
}