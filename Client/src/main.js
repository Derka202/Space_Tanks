import { Application, Ticker, Container, Graphics, Assets, Text } from 'pixi.js';
import { AsteroidField } from "./asteroidField.js";
import { Ship, collision } from "./ship.js";
import RegisterScene from './register.js';
import WelcomeScene from './welcome.js';
import InputHandler from './input.js';
import MainMenuScene from './menu.js';
import LoginScene from './login.js';
import Network from "./network.js";
import { Button } from '@pixi/ui';



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
    let roomId;
    let userId;
    let user;
    const shipAsteroidHits = new Set();

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

    const welcomeScene = new WelcomeScene(handleLoginChoice, baseWidth, baseHeight);
    gameWorld.addChild(welcomeScene.view);
    // Scaling
    gameWorld.currentScale = 1;

    function handleLoginChoice(choice) {
        gameWorld.removeChild(welcomeScene.view);

        if (choice.type === "guest") {
            user = "Guest";
            userId = -1
            mainMenu(userId, user);
            return;
        } else if (choice.type === "login") {
            const loginScene = new LoginScene(submitLogin, backToWelcome, baseWidth, baseHeight);
            gameWorld.addChild(loginScene.view);
            return;
        } else if (choice.type === "register") {
            const registerScene = new RegisterScene(submitRegistration, backToWelcome, baseWidth, baseHeight);
            gameWorld.addChild(registerScene.view);
            return;
        }

        // Command that starts the game
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
    
    async function submitRegistration(info, res) {
        if (info.password.length  < 5) {
            res.style.fill = "#FF0000";
            res.text = "Error: Password Must Be At Least 5 Characters";
            return;
        }

        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: info.username, password: info.password})
        });
        if(!response.ok) {
            res.style.fill = "#FF0000";
            res.text = "Error: User Already Exists";
            return;
        }

        res.text = "Successful Registration!";
        res.style.fill = "#00FF00";
    }
    
    async function submitLogin(info, res) {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: info.username, password: info.password})
        });
        
        const data = await response.json();

        console.log(data);
        if(!data.success) {
            res.text = "Error: Incorrect Login";
            res.style.fill = "#FF0000";
            return;
        } else {
            console.log("Login Success");
            userId = data.userId;
            user = info.username;
            //1111 will be the userId once implemented
            mainMenu(userId, info.username);
        }
    }

    function clearScreen() {
        for (let child of gameWorld.children.slice()) {
            if (child !== border) gameWorld.removeChild(child);
        }
    }
    
    function backToWelcome() {
        clearScreen()
        gameWorld.addChild(welcomeScene.view);
    }
    
    function mainMenu(userId, username) {
        clearScreen();
        const mainMenu = new MainMenuScene(playGame, console.log("w"), console.log("w"), console.log("w"), username, baseWidth, baseHeight);
        gameWorld.addChild(mainMenu.view);
    }
    
    function playGame(userId) {
        clearScreen();

        queueText.anchor.set(0.5);
        queueText.x = baseWidth / 2;
        queueText.y = baseHeight / 2;
        gameWorld.addChild(queueText);
        network.autoJoin();
    }
    
    window.addEventListener('resize', resizeGame);

    
    // network.onRoomJoined(async ({ roomId: id, asteroidSeed, playerIndex, state }) => {
    //     roomId = id;
    //     console.log("Joined room:", roomId, "as player", playerIndex);
    //     // Optional: assign which ship is controlled by this client
    //     // If playerIndex === 0, control shipOne; else control shipTwo
    //     inputPlayerIndex = playerIndex;
        
    //     // spawn asteroids based on room seed
    //     asteroidField = new AsteroidField(asteroidSeed, { x: baseWidth, y: baseHeight });
    //     await asteroidField.init(gameWorld);

    //     //ticker.start();
    // });

    network.onRoomJoined(async ({ roomId: id, asteroidSeed, playerIndex, state }) => {
        roomId = id;
        console.log("Joined room:", roomId, "as player", playerIndex);
        inputPlayerIndex = playerIndex;
        
        asteroidField = new AsteroidField(asteroidSeed, { x: baseWidth, y: baseHeight });
        await asteroidField.init(gameWorld);

        // Instead of generating random asteroids here, sync with the server state:
        if (state?.asteroids) {
            asteroidField.syncFromServer(state.asteroids, gameWorld);
        }
    });

    
    network.onGameStart(async ({ startingTurn }) => {
        console.log("Starting game!");
        currentTurn = startingTurn;
        gameWorld.removeChild(queueText);
        await startGame();

    })

    async function startGame(loginType) {
        let turnCount = 1;
        const turnText = new Text({text: "Turn: 1", style: {fontSize: 24, fill: "#ffffff"}});
        const shipOne = new Ship(await Assets.load('assets/shipNone.png'), 40, baseHeight / 2, Math.PI / 2, 2, { width: baseWidth, height: baseHeight }, margin, 0);
        const shipTwo = new Ship(await Assets.load('assets/shipNone.png'), baseWidth - 40, baseHeight / 2, (Math.PI / 2) * 3, 2, { width: baseWidth, height: baseHeight }, margin, 1);
        const shipOneScoreText = new Text({text: "Score: 0", style: {fontSize: 24, fill: "#ffffff"}});
        const shipTwoScoreText = new Text({text: "Score: 0", style: {fontSize: 24, fill: "#ffffff"}});
        shipOneScoreText.x = 10;
        shipOneScoreText.y = 10;
        shipTwoScoreText.x = baseWidth - 110;
        shipTwoScoreText.y = 10;
        turnText.x = baseWidth / 2;
        turnText.y = 10
        gameWorld.addChild(shipOne.sprite);
        gameWorld.addChild(shipTwo.sprite);
        gameWorld.addChild(shipOneScoreText);
        gameWorld.addChild(shipTwoScoreText);
        gameWorld.addChild(turnText);
        
        inputHandler = new InputHandler(shipOne, shipTwo, () => gameWorld.currentScale, baseWidth, baseHeight, network);
        inputHandler.setPlayerIndex(inputPlayerIndex);
        inputHandler.canMove = (inputPlayerIndex === currentTurn);

        
        function checkBulletCollisions(attacker, target, container) {
            for (let i = attacker.bullets.length - 1; i >= 0 ; i--) {
                const bullet = attacker.bullets[i];
                if (!bullet.alive) continue;
                if (collision(target, bullet)) {
                    bullet.alive = false;
                    bullet.destroyBullet(container);
                    attacker.bullets.splice(i, 1);

                    if (attacker === (inputPlayerIndex === 0 ? shipOne : shipTwo)) {
                        network.sendBulletHit();
                        network.sendBulletEnded(roomId);
                    }
                }
            }
        }

        network.onTurnChange(({currentTurn: turnId, turnCount: turn, asteroidState}) => {
            currentTurn = turnId;
            inputHandler.canMove = (inputPlayerIndex === currentTurn);
            turnCount = turn;
            turnText.text = `Turn: ${turnCount}`;
        
            if (asteroidState && asteroidField) {
                asteroidField.syncFromServer(asteroidState, gameWorld);
            }
        });

        network.onAsteroidUpdate(({ asteroidState }) => {
            asteroidField.syncFromServer(asteroidState, gameWorld);
         });


        network.onScoreUpdated((scores) => {
            shipOneScoreText.text = `Score: ${scores.shipOne}`;
            shipTwoScoreText.text = `Score: ${scores.shipTwo}`;
        });

        network.onPlayerMoved(({ id, pos }) => {
            if (id === network.socket.id) return;
            
            const otherShip = inputPlayerIndex === 0 ? shipTwo : shipOne;
            otherShip.sprite.x = pos.x;
            otherShip.sprite.y = pos.y;
            otherShip.sprite.rotation = pos.rotation;
        });

        network.onBulletFired((data) => {
            if (data.owner === network.socket.id) return;

            const ship = (inputPlayerIndex === 0) ? shipTwo : shipOne;
            const bullet = ship.createBullet(data.x, data.y, data.rotation, gameWorld, inputPlayerIndex);
            ship.bullets.push(bullet);
        });

        network.onGameOver(({winner, scores}) => {
            ticker.stop()
            inputHandler.canMove = false;

            const overlay = new Graphics().rect(0, 0, baseWidth, baseHeight).fill({color: "#000000", alpha: 0.6});
            gameWorld.addChild(overlay);

            const gameOverText = new Text({text: "GAME OVER", style: {fontSize: 64, fill: "#ff0000", fontWeight: "bold", align: "center"}});
            gameOverText.anchor.set(0.5);
            gameOverText.x = baseWidth / 2
            gameOverText.y = baseHeight / 2 - 40;
            gameWorld.addChild(gameOverText);

            const scoreText = new Text({text: `Final Scores:\nShip One: ${scores.shipOne}\nShip Two: ${scores.shipTwo}`,
                style: {fontSize: 28, fill: "#ffffff", align: "center"}});
            scoreText.anchor.set(0.5);
            scoreText.x = baseWidth / 2;
            scoreText.y = baseHeight / 2 + 50;
            gameWorld.addChild(scoreText);

            const winnerText = new Text({text: `Winner: ${winner}`, style: {fontSize: 32, fill: "#ffff00"}});
            winnerText.anchor.set(0.5);
            winnerText.x = baseWidth / 2;
            winnerText.y = baseHeight / 2 + 130;
            gameWorld.addChild(winnerText);

            const menuButtonBg = new Graphics().roundRect(0, 0, 200, 50, 10).fill(0x44aa66);
            const menuButton = new Button(menuButtonBg);
            menuButton.onPress.connect(() => {
                clearScreen();
                mainMenu(userId, user);
            });
            const menuButtonText = new Text({text: "Main Menu", style: {fill: "#FFFFFF", fontSize: 20}});
            menuButtonText.anchor.set(0.5);
            menuButtonText.x = menuButtonBg.width / 2;
            menuButtonText.y = menuButtonBg.height / 2;
            menuButton.view.addChild(menuButtonText);
            menuButton.view.x = 320;
            menuButton.view.y = 500;
            gameWorld.addChild(menuButton.view);
        });

    ticker.start();

    ticker.add(() => {
        accumulator += ticker.deltaMS;

        while (accumulator >= tickInterval) {
            inputHandler.update();
            shipOne.updateBullets(gameWorld, {width: baseWidth, height: baseHeight}, network, roomId, inputPlayerIndex);
            shipTwo.updateBullets(gameWorld, {width: baseWidth, height: baseHeight}, network, roomId, inputPlayerIndex);
            //moving the asteroid update to the server
            //asteroidField.updateAll(ticker.deltaMS);
            shipAsteroidHits.clear();

            // Ship vs Bullet collisions
            checkBulletCollisions(shipOne, shipTwo, gameWorld);
            checkBulletCollisions(shipTwo, shipOne, gameWorld);

            // Bullet vs Asteroid collisions
            const allBullets = [...shipOne.bullets, ...shipTwo.bullets];
            asteroidField.checkBulletCollisions(allBullets, (bullet, asteroid, asteroidIndex) => {
                // Only process if this is the local player's bullet
                if (bullet.owner === inputPlayerIndex) {
                    console.log("My bullet hit asteroid!");
                    
                    // Destroy bullet locally
                    bullet.destroyBullet(gameWorld);
                    const ownerShip = bullet.owner === 0 ? shipOne : shipTwo;
                    const bulletIdx = ownerShip.bullets.indexOf(bullet);
                    if (bulletIdx > -1) {
                        ownerShip.bullets.splice(bulletIdx, 1);
                    }
                    
                    // Remove asteroid locally then send to server
                    asteroidField.removeAsteroid(asteroidIndex, gameWorld);
                    network.sendAsteroidHit(roomId, asteroid.id);
                }
            });

            // Ship vs Asteroid collisions
            asteroidField.checkShipCollisions([shipOne, shipTwo], (ship, asteroid, shipIndex, asteroidIndex) => {
                const hitKey = `${shipIndex}-${asteroid.id}`;
                
                if (shipIndex === inputPlayerIndex && !shipAsteroidHits.has(hitKey)) {
                    console.log(`My ship hit asteroid!`);
                    shipAsteroidHits.add(hitKey);
                    network.sendAsteroidDamage(roomId, asteroid.id);
                }
            });

            accumulator -= tickInterval;
        }
    });
    
    }
})();