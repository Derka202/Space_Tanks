import { Assets, Sprite } from 'pixi.js';

export const baseWidth = 800;
export const baseHeight = 600;

export async function setup(container) {
    // Load texture
    const texture = await Assets.load('assets/shipNone.png');

    // Ship One
    const shipOne = new Sprite(texture);
    shipOne.pivot.set(shipOne.width / 2, shipOne.height / 2);
    shipOne.rotation = Math.PI / 2;
    shipOne.x = 40;
    shipOne.y = baseHeight / 2;
    shipOne.scale.set(2);

    // Ship Two
    const shipTwo = new Sprite(texture);
    shipTwo.pivot.set(shipTwo.width / 2, shipTwo.height / 2);
    shipTwo.rotation = (Math.PI / 2) * 3;
    shipTwo.x = baseWidth - 40;
    shipTwo.y = baseHeight / 2;
    shipTwo.scale.set(2);

    // Add them to the stage
    container.addChild(shipOne);
    container.addChild(shipTwo);

    console.log("Ship One:", shipOne.x, shipOne.y, shipOne.width, shipOne.height, shipOne.pivot);
    console.log("Ship Two:", shipTwo.x, shipTwo.y, shipTwo.width, shipTwo.height, shipTwo.pivot);

    // Return references
    return { shipOne, shipTwo };
}