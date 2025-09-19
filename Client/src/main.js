import { Application, Ticker, Container, Graphics, Assets } from 'pixi.js';
import InputHandler from './input.js';
import { io } from "socket.io-client";
import Ship from "./ship.js";


// Main loop
(async () => {
    // Set up constants
    const tickRate = 30;
    const tickInterval = 1000 / tickRate;
    const baseWidth = 800;
    const baseHeight = 600;
    
    const app = new Application();
    const ticker = new Ticker();
    const gameWorld = new Container();
    const border = new Graphics().rect(0, 0, baseWidth, baseHeight).fill('#000000', 0).stroke(2, '#ff0000');
    const socket = io("http://localhost:3000");

    let accumulator = 0;

    // Screen configuration
    await app.init({
        resizeTo: window,
        background: '#1099bb'
    });
    app.canvas.style.position = 'absolute';
    document.body.appendChild(app.canvas);
    gameWorld.addChild(border);
    resizeGame();
    app.stage.addChild(gameWorld);

    // Scaling
    gameWorld.currentScale = 1;

    function resizeGame() {
        const scaleX = app.screen.width / baseWidth;
        const scaleY = app.screen.height / baseHeight;
        gameWorld.currentScale = Math.min(scaleX, scaleY);

        gameWorld.scale.set(gameWorld.currentScale);
        gameWorld.x = (app.screen.width - baseWidth * gameWorld.currentScale) / 2;
        gameWorld.y = (app.screen.height - baseHeight * gameWorld.currentScale) / 2;
    }

    window.addEventListener('resize', resizeGame);
    
    // const { shipOne, shipTwo } = await setup(gameWorld);
    const shipOne = new Ship(await Assets.load('assets/shipNone.png'), 40, baseHeight / 2, Math.PI / 2);
    const shipTwo = new Ship(await Assets.load('assets/shipNone.png'), baseWidth - 40, baseHeight / 2, (Math.PI / 2) * 3);
    gameWorld.addChild(shipOne.sprite);
    const input = new InputHandler(shipOne, shipTwo, () => gameWorld.currentScale, baseWidth, baseHeight, socket);
    resizeGame();

    socket.on("connect", () => {
        console.log("connected to server");
    });
    
    ticker.add(() => {
        accumulator += ticker.deltaMS;

        while (accumulator >= tickInterval) {
            input.update();
            shipOne.updateBullets(gameWorld, {width: baseWidth, height: baseHeight});

            accumulator -= tickInterval;
        }
    });
    ticker.start();
})();