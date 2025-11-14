import { Application, Ticker, Container, Graphics, Assets, Text } from 'pixi.js';
import PlayerHistoryScene from './playerHistory.js';
import InstructionsScene from './instructions.js';
import { AsteroidField } from "./asteroidField.js";
import { Ship, collision } from "./ship.js";
import RegisterScene from './register.js';
import GameOverScene from './gameOver.js';
import WelcomeScene from './welcome.js';
import InputHandler from './input.js';
import MainMenuScene from './menu.js';
import ReplayScene from './replay.js';
import LoginScene from './login.js';
import Network from "./network.js";
import { Button } from '@pixi/ui';
import HighScoresScene from './highScores.js';



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
    const backBg = new Graphics().roundRect(0, 0, 200, 50, 10).fill(0xaa4444);
    const backButton = new Button(backBg);
    const network = new Network("http://localhost:3000");
    let asteroidField;
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
    window.addEventListener('resize', resizeGame);
    resizeGame();
    app.stage.addChild(gameWorld);
    gameWorld.addChild(border);

    // Display welcome screen
    const welcomeScene = new WelcomeScene(handleLoginChoice, baseWidth, baseHeight);
    gameWorld.addChild(welcomeScene.view);

    function handleLoginChoice(choice) {
        gameWorld.removeChild(welcomeScene.view);

        if (choice.type === "guest") {
            user = "Guest";
            userId = -1;
            const res = new Text();
            submitLogin({username: "guest", password: ""}, res);
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
    }

    function resizeGame() {
        // Get size of browser window
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Resize the renderer to match the size of the window
        app.renderer.resize(screenWidth, screenHeight);

        // Maintain aspect ratio of the game
        const scaleX = screenWidth / baseWidth;
        const scaleY = screenHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        // Apply scale and center
        gameWorld.scale.set(scale);
        gameWorld.x = (screenWidth - baseWidth * scale) / 2;
        gameWorld.y = (screenHeight - baseHeight * scale) / 2;
    }
    
    async function submitRegistration(info, res) {
        // If password is less than 5 characters, do not allow registration
        if (info.password.length  < 5) {
            res.style.fill = "#FF0000";
            res.text = "Error: Password Must Be At Least 5 Characters";
            return;
        }
        // If there is a space in the username, do now allow registration
        if (info.username.includes(" ")) {
            res.style.fill = "#FF0000";
            res.text = "Error: Username cannot contain spaces";
            return;
        }
        // If there is a space in the password, do not allow registration
        if (info.password.includes(" ")) {
            res.style.fill = "#FF0000";
            res.text = "Error: Password cannot contain spaces";
            return;
        }

        // Send registration info to the server
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: info.username, password: info.password})
        });
        
        // If registration fails, that means the username is already taken
        if(!response.ok) {
            res.style.fill = "#FF0000";
            res.text = "Error: User Already Exists";
            return;
        }

        // Successful registration
        res.text = "Successful Registration!";
        res.style.fill = "#00FF00";
    }
    
    async function submitLogin(info, res) {
        // Send login information to the server
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: info.username, password: info.password})
        });
        // Wait for response
        const data = await response.json();

        // If login is unsuccessful, the user submitted an incorrect login
        if(!data.success) {
            res.text = "Error: Incorrect Login";
            res.style.fill = "#FF0000";
            return;
        }

        // Successful login, proceed to main menu
        userId = data.userId;
        user = info.username;
        mainMenu(info.username);
    }

    function clearScreen() {
        // For every element of the gameworld, if it's not the border then remove it
        for (let child of gameWorld.children.slice()) {
            if (child !== border) gameWorld.removeChild(child);
        }
    }
    
    // Go back to the welcome screen
    function backToWelcome() {
        clearScreen()
        gameWorld.addChild(welcomeScene.view);
    }
    
    // Create main menu and display
    function mainMenu() {
        clearScreen();
        const mainMenu = new MainMenuScene(playGame, playerHistory, highScores, instructions, user, baseWidth, baseHeight);
        gameWorld.addChild(mainMenu.view);
    }

    // Display the instructions for the game
    function instructions() {
        clearScreen();
        const instructions = new InstructionsScene(mainMenu, baseWidth, baseHeight);
        gameWorld.addChild(instructions.view);
    }

    // Display the previous games of player
    function playerHistory() {
        clearScreen();
        const playerHistory = new PlayerHistoryScene(userId, (gameId) => replayGame(gameId), mainMenu, baseWidth, baseHeight);
        gameWorld.addChild(playerHistory.view);
    }

    function replayGame(gameId) {
        console.log(gameId);
        clearScreen();
        const replayScene = new ReplayScene(gameId, playerHistory, baseWidth, baseHeight);
        gameWorld.addChild(replayScene.view);
    }

    // Display the leaderboard of high scores
    async function highScores() {
        clearScreen()
        const highScores = new HighScoresScene(mainMenu, baseWidth, baseHeight);
        gameWorld.addChild(highScores.view);
        await highScores.loadScores();
    }
    
    // Load playing screen
    function playGame() {
        clearScreen();

        // Display back button to leave the waiting queue
        backButton.onPress.connect(() => {
            network.sendLeaveQueue();
            mainMenu();
        });
        const backText = new Text({text: "Back", style: {fill: "#FFFFFF", fontSize: 20}});
        backText.anchor.set(0.5);
        backText.x = backBg.width / 2;
        backText.y = backBg.height / 2;
        backButton.view.addChild(backText);
        backButton.view.x = 20;
        backButton.view.y = 20;
        gameWorld.addChild(backButton.view);

        // Display queue text
        queueText.anchor.set(0.5);
        queueText.x = baseWidth / 2;
        queueText.y = baseHeight / 2;
        gameWorld.addChild(queueText);

        network.joinRoom(user, userId);
    }


    // Recieving information about the room the player joined
    network.onRoomJoined(async ({ roomId: id, asteroidSeed, playerIndex, state }) => {
        // Set room ID and the player's turn index
        roomId = id;
        inputPlayerIndex = playerIndex;
        
        asteroidField = new AsteroidField(asteroidSeed, { x: baseWidth, y: baseHeight });
        await asteroidField.init(gameWorld);

        // Instead of generating random asteroids here, sync with the server state:
        if (state?.asteroids) {
            asteroidField.syncFromServer(state.asteroids, gameWorld);
        }
    });

    // When the game starts
    network.onGameStart(async ({ startingTurn }) => {
        currentTurn = startingTurn;
        gameWorld.removeChild(backButton.view);
        gameWorld.removeChild(queueText);
        await startGame();

    })

    async function startGame() {
        let turnCount = 1;
        const turnText = new Text({text: "Turn: 1", style: {fontSize: 24, fill: "#ffffff"}});
        const shipOne = new Ship(await Assets.load('assets/shipNone.png'), 40, baseHeight / 2, Math.PI / 2, 2, { width: baseWidth, height: baseHeight }, margin, 0, network, roomId);
        const shipTwo = new Ship(await Assets.load('assets/shipNone.png'), baseWidth - 40, baseHeight / 2, (Math.PI / 2) * 3, 2, { width: baseWidth, height: baseHeight }, margin, 1, network, roomId);
        const shipOneScoreText = new Text({text: "Score: 0", style: {fontSize: 24, fill: "#ffffff"}});
        const shipTwoScoreText = new Text({text: "Score: 0", style: {fontSize: 24, fill: "#ffffff"}});
        const shipOneFuelText = new Text({text: "Fuel: 100", style: {fontSize: 20, fill: "#FFFF00"}});
        const shipTwoFuelText = new Text({text: "Fuel: 100", style: {fontSize: 20, fill: "#FFFF00"}});
        shipOneScoreText.x = 10;
        shipOneScoreText.y = 10;
        shipTwoScoreText.x = baseWidth - 110;
        shipTwoScoreText.y = 10;
        turnText.x = baseWidth / 2;
        turnText.y = 10
        shipOneFuelText.x = 10;
        shipOneFuelText.y = 40;
        shipTwoFuelText.x = baseWidth - 110;
        shipTwoFuelText.y = 40;
        gameWorld.addChild(shipOne.sprite);
        gameWorld.addChild(shipTwo.sprite);
        gameWorld.addChild(shipOneScoreText);
        gameWorld.addChild(shipTwoScoreText);
        gameWorld.addChild(turnText);
        gameWorld.addChild(shipOneFuelText);
        gameWorld.addChild(shipTwoFuelText);
        
        inputHandler = new InputHandler(shipOne, shipTwo, () => baseWidth, baseHeight, network);
        inputHandler.setPlayerIndex(inputPlayerIndex);
        inputHandler.canMove = (inputPlayerIndex === currentTurn);
        inputHandler.roomId = roomId;

        
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

        network.onTurnChange(({currentTurn: turnId, turnCount: turn, asteroidState, fuel}) => {
            currentTurn = turnId;
            inputHandler.canMove = (inputPlayerIndex === currentTurn);
            turnCount = turn;
            turnText.text = `Turn: ${turnCount}`;

            shipOne.fuel = fuel.shipOne;
            shipTwo.fuel = fuel.shipTwo;
            shipOneFuelText.text = `Fuel: ${Math.round(shipOne.fuel)}`;
            shipTwoFuelText.text = `Fuel: ${Math.round(shipTwo.fuel)}`;

            if (currentTurn === 0) {
                shipOne.refillFuel();
            }
            else {
                shipTwo.refillFuel();
            }
        
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
            console.log(pos);
            otherShip.sprite.x = pos.x;
            otherShip.sprite.y = pos.y;
            otherShip.sprite.rotation = pos.rotation;
        });

        network.onFuelUpdated((fuelState) => {
            shipOneFuelText.text = `Fuel: ${Math.round(fuelState.shipOne)}`;
            shipTwoFuelText.text = `Fuel: ${Math.round(fuelState.shipTwo)}`;
            
            if (inputPlayerIndex === 0) {
                shipOne.fuel = fuelState.shipOne;
            }
            else {
                shipTwo.fuel = fuelState.shipTwo;
            }
        });

        network.onBulletFired((data) => {
            if (data.owner === network.socket.id) return;

            const ship = (inputPlayerIndex === 0) ? shipTwo : shipOne;
            const bullet = ship.createBullet(data.x, data.y, data.rotation, gameWorld, inputPlayerIndex);
            ship.bullets.push(bullet);
        });

        network.onGameOver(async ({winner, players, scores}) => {
            console.log("GAMER OVER");
            ticker.stop()
            inputHandler.canMove = false;

            const gameOver = new GameOverScene(mainMenu, winner, players, scores, baseWidth, baseHeight);
            if (user !== "guest") {
                const response = await fetch(`http://localhost:3000/personalbest?username=${user}`);
                const data = await response.json();
                gameOver.setPersonalBest(data.personalBest);

                console.log(response);
                // gameOver.setPersonalBest();
            }

            gameWorld.addChild(gameOver.view);
        });

    ticker.start();

    ticker.add(() => {
        accumulator += ticker.deltaMS;

        while (accumulator >= tickInterval) {
            inputHandler.update();
            shipOneFuelText.style.fill = shipOne.fuel > 20 ? "#FFFF00" : "#FF0000";
            shipTwoFuelText.style.fill = shipTwo.fuel > 20 ? "#FFFF00" : "#FF0000";
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
                    // console.log(`My ship hit asteroid!`);
                    shipAsteroidHits.add(hitKey);
                    network.sendAsteroidDamage(roomId, asteroid.id);
                }
            });

            accumulator -= tickInterval;
        }
    });
    
    }
})();