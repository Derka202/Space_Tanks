import { Application, Ticker, Container, Graphics, Assets, Text } from 'pixi.js';
import InputHandler from './input.js';
import Network from "./network.js";
import { Ship, collision } from "./ship.js";
import { AsteroidField } from "./asteroidField.js";
import LoginScene from './login.js';



(async () => {
    const tickRate = 30;
    const tickInterval = 1000 / tickRate;
    const baseWidth = 800;
    const baseHeight = 600;
    const margin = 40;
    
    const app = new Application();
    const ticker = new Ticker();
    const gameWorld = new Container();
    const border = new Graphics().rect(0, 0, baseWidth, baseHeight).fill('#000000ff', 0).stroke(2, '#ff0000');
    const queueText = new Text({text: "Waiting For Player...", style: {fontSize: 32, fill: "#ffffff", allign: "center"}});
    let asteroidField;
    const network = new Network("http://localhost:3000");
    let accumulator = 0;
    let inputPlayerIndex;
    let inputHandler = null;
    let currentTurn = 0;

    // Screen configuration
    await app.init({
        resizeTo: window,
        background: '#1099bb'
    });
    app.canvas.style.position = 'absolute';
    document.body.appendChild(app.canvas);
    
    resizeGame();
    app.stage.addChild(gameWorld);
    gameWorld.addChild(border);

    const loginScene = new LoginScene(handleLoginChoice);
    loginScene.x = baseWidth / 2;
    loginScene.y = baseHeight / 2;
    loginScene.pivot.set(loginScene.width / 2, loginScene.height / 2);
    gameWorld.addChild(loginScene);
    // Scaling
    gameWorld.currentScale = 1;

    function handleLoginChoice(choice) {
        console.log("User chose:", choice);

        if (choice.type === "guest") {
            // startGame("Guest_" + Math.floor(Math.random() * 1000));
        } else if (choice.type === "login") {
            // Later: Show login form, send creds to server
            // startGame("LoginUser");
        } else if (choice.type === "register") {
            // Later: Show registration form
            // startGame("NewUser");
        }

        gameWorld.removeChild(loginScene);
        queueText.anchor.set(0.5);
        queueText.x = baseWidth / 2;
        queueText.y = baseHeight / 2;
        gameWorld.addChild(queueText);
        network.autoJoin();
    }

    function resizeGame() {
        const scaleX = app.screen.width / baseWidth;
        const scaleY = app.screen.height / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        gameWorld.scale.set(scale);
        gameWorld.x = (app.screen.width - baseWidth * scale) / 2;
        gameWorld.y = (app.screen.height - baseHeight * scale) / 2;
    }

    function checkBulletCollisions(attacker, target, container) {
        attacker.bullets.forEach((bullet, i) => {
            if(!bullet.alive) return;
            if (collision(target, bullet)) {
                console.log("HIT");
                bullet.destroyBullet(container);
                attacker.bullets.splice(i, 1);
            }
        });
    }

    window.addEventListener('resize', resizeGame);

    network.onGameStart(async ({ startingTurn }) => {
        console.log("Starting game!");
        currentTurn = startingTurn;
        gameWorld.removeChild(queueText);
        await startGame();
    })

    network.onRoomJoined(async ({ roomId, asteroidSeed, playerIndex, state }) => {
        console.log("Joined room:", roomId, "as player", playerIndex);
        // Optional: assign which ship is controlled by this client
        // If playerIndex === 0, control shipOne; else control shipTwo
        inputPlayerIndex = playerIndex;

        // spawn asteroids based on room seed
        asteroidField = new AsteroidField(asteroidSeed, { x: baseWidth, y: baseHeight });
        await asteroidField.init(gameWorld);

        ticker.start();
    });
    
    async function startGame(loginType) {
        const shipOne = new Ship(await Assets.load('assets/shipNone.png'), 40, baseHeight / 2, Math.PI / 2, 2, { width: baseWidth, height: baseHeight }, margin);
        const shipTwo = new Ship(await Assets.load('assets/shipNone.png'), baseWidth - 40, baseHeight / 2, (Math.PI / 2) * 3, 2, { width: baseWidth, height: baseHeight }, margin);
        gameWorld.addChild(shipOne.sprite);
        gameWorld.addChild(shipTwo.sprite);
        
        inputHandler = new InputHandler(shipOne, shipTwo, () => gameWorld.currentScale, baseWidth, baseHeight, network);
        inputHandler.setPlayerIndex(inputPlayerIndex);
        inputHandler.canMove = (inputPlayerIndex === currentTurn);

        network.onTurnChange(({currentTurn: turnId}) => {
            currentTurn = turnId;
            console.log("Current Turn:", currentTurn);
            inputHandler.canMove = (inputPlayerIndex === currentTurn);
        });

        network.onPlayerMoved(({ id, pos }) => {
            if (id === network.socket.id) return;
            
            const otherShip = inputPlayerIndex === 0 ? shipTwo : shipOne;
            otherShip.sprite.x = pos.x;
            otherShip.sprite.y = pos.y;
            otherShip.sprite.rotation = pos.rotation;
        });

        network.onBulletFired((data) => {
            const ship = (data.owner === network.socket.id) ? (inputPlayerIndex === 0 ? shipOne : shipTwo) : (inputPlayerIndex === 0 ? shipTwo : shipOne);

            const bullet = ship.createBullet(data.x, data.y, data.rotation, gameWorld);
            ship.bullets.push(bullet);
        });

        
        ticker.add(() => {
            accumulator += ticker.deltaMS;

        while (accumulator >= tickInterval) {
            inputHandler.update();
            shipOne.updateBullets(gameWorld, {width: baseWidth, height: baseHeight});
            shipTwo.updateBullets(gameWorld, {width: baseWidth, height: baseHeight});
            asteroidField.updateAll(ticker.deltaMS);

            checkBulletCollisions(shipOne, shipTwo, gameWorld);
            checkBulletCollisions(shipTwo, shipOne, gameWorld);

            // asteroidField.checkCollisions(
            //     [shipOne, shipTwo],
            //     [...shipOne.bullets, ...shipTwo.bullets] // ...spread operator flattens arrays
            // );

                accumulator -= tickInterval;
            }
        });
    }
})();