import { Application, Ticker, Container, Graphics } from 'pixi.js';
import InputHandler from './input.js';
import { setup, baseWidth, baseHeight } from './setup.js';


// Main loop
(async () => {
    // Set up constants
    const app = new Application();
    const ticker = new Ticker();
    const gameWorld = new Container();
    const border = new Graphics().rect(0, 0, baseWidth, baseHeight).fill('#000000', 0).stroke(2, '#ff0000');

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
    
    const { shipOne, shipTwo } = await setup(gameWorld);
    const input = new InputHandler(shipOne, shipTwo, () => gameWorld.currentScale, baseWidth, baseHeight);
    resizeGame();
    
    ticker.add(() => {
        input.update();
    });
    ticker.start();


})();