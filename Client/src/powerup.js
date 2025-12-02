import { Sprite } from "pixi.js";

export class PowerUp {
    constructor(type, x, y, texture) {
        this.type = type;
        this.sprite = new Sprite(texture);
        this.sprite.pivot.set(texture.width / 2, texture.height / 2);
        this.sprite.x = x;
        this.sprite.y = y;
        this.collected = false;
        this.id = crypto.randomUUID();
    }
}