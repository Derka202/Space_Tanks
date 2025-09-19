import { Application, Ticker, Container, Graphics, Assets } from 'pixi.js';
import InputHandler from './input.js';
import Network from "./network.js";
import Ship from "./ship.js";


// Main loop
(async () => {
    // Set up constants
    const tickRate = 30;
    const tickInterval = 1000 / tickRate;
    const baseWidth = 800;
    const baseHeight = 600;
    const margin = 40;
    
    const app = new Application();
    const ticker = new Ticker();
    const gameWorld = new Container();
    const border = new Graphics().rect(0, 0, baseWidth, baseHeight).fill('#000000', 0).stroke(2, '#ff0000');
    const network = new Network("http://localhost:3000");

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
    
    const shipOne = new Ship(await Assets.load('assets/shipNone.png'), 40, baseHeight / 2, Math.PI / 2, 2, { width: baseWidth, height: baseHeight }, margin);
    const shipTwo = new Ship(await Assets.load('assets/shipNone.png'), baseWidth - 40, baseHeight / 2, (Math.PI / 2) * 3, 2, { width: baseWidth, height: baseHeight }, margin);
    gameWorld.addChild(shipOne.sprite);
    gameWorld.addChild(shipTwo.sprite);
    const input = new InputHandler(shipOne, shipTwo, () => gameWorld.currentScale, baseWidth, baseHeight, network);
    resizeGame();

    network.autoJoin();

    network.onRoomJoined(({ roomId, playerIndex, state }) => {
        console.log("Joined room:", roomId, "as player", playerIndex);
        // Optional: assign which ship is controlled by this client
        // If playerIndex === 0, control shipOne; else control shipTwo
        input.setPlayerIndex(playerIndex);
    });

    network.onPlayerMoved(({ id, pos }) => {
        // Update the other player's ship
        if (id !== network.socket.id) {
            // Determine which ship is the other player
            const otherShip = input.playerIndex === 0 ? shipTwo : shipOne;
            otherShip.sprite.x = pos.x;
            otherShip.sprite.y = pos.y;
            otherShip.sprite.rotation = pos.rotation;
        }
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