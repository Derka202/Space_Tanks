import { Container, Graphics, Text, Assets } from "pixi.js";
import { AsteroidField } from "./asteroidField.js";
import { Button } from "@pixi/ui";
import { Ship } from "./ship.js";

export default class ReplayScene {
    constructor(gameId, backToHistory, baseWidth, baseHeight) {
        this.container = new Container();
        this.gameId = gameId;
        this.backToHistory = backToHistory;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.frameIndex = 0;

        this.initUI();
        this.loadReplayData();
    }

    //initialize UI elements for game replay
    initUI() {
        // Replay Game Title
        const title = new Text({text: `Replaying Game ${this.gameId}`, style: {fill: "#FFFFFF", fontSize: 30}});
        title.anchor.set(0.5);
        title.x = this.baseWidth / 2;
        title.y = 20;
        this.container.addChild(title);

        // Button to go back to player history screen
        const backBg = new Graphics().roundRect(0, 0, 150, 40, 10).fill(0xaa4444);
        const backButton = new Button(backBg);
        backButton.onPress.connect(() => {
            this.backToHistory();
        });
        const backText = new Text({text: "Back", style: {fill: "#FFFFFF", fontSize: 20}});
        backText.anchor.set(0.5);
        backText.x = backBg.width / 2;
        backText.y = backBg.height / 2;
        backButton.view.addChild(backText);
        backButton.view.x = 20;
        backButton.view.y = this.baseHeight - 50;
        this.container.addChild(backButton.view);

        // Previous button to look at previous turns
        const prevBg = new Graphics().roundRect(0, 0, 120, 40, 10).fill(0x6666ff);
        const prevButton = new Button(prevBg);
        prevButton.onPress.connect(() => this.prevFrame());
        const prevText = new Text({
            text: "Previous",
            style: { fill: "#FFFFFF", fontSize: 18 },
        });
        prevText.anchor.set(0.5);
        prevText.x = prevBg.width / 2;
        prevText.y = prevBg.height / 2;
        prevButton.view.addChild(prevText);
        prevButton.view.x = this.baseWidth / 2 - 140;
        prevButton.view.y = this.baseHeight - 50;
        this.container.addChild(prevButton.view);

        // Next button to progress turns
        const nextBg = new Graphics().roundRect(0, 0, 120, 40, 10).fill(0x66aa66);
        const nextButton = new Button(nextBg);
        nextButton.onPress.connect(() => this.nextFrame());
        const nextText = new Text({
            text: "Next",
            style: { fill: "#FFFFFF", fontSize: 18 },
        });
        nextText.anchor.set(0.5);
        nextText.x = nextBg.width / 2;
        nextText.y = nextBg.height / 2;
        nextButton.view.addChild(nextText);
        nextButton.view.x = this.baseWidth / 2 + 20;
        nextButton.view.y = this.baseHeight - 50;
        this.container.addChild(nextButton.view);
    }

    // Get each frame of gameplay
    async loadReplayData() {
        try {
            // Get data from server and store in this.frames
            const res = await fetch(`http://localhost:3000/getgamedata?gameid=${this.gameId}`);
            const data = await res.json();
            this.frames = data.replayData.turns;

            // Setup the game replay
            await this.setupScene();
            // Start on the first frame
            this.showFrame(0);
        } catch (err) {
            console.error("Failed to load replay: ", err);
        }
    }

    // Setup the game replay
    async setupScene() {
        // Create asteroid field and initalize
        this.asteroidField = new AsteroidField(Math.random(), {
            x: this.baseWidth,
            y: this.baseHeight,
        });
        await this.asteroidField.init(this.container);

        const shipOneTexture = await Assets.load("assets/shipNone.png");
        const shipTwoTexture = await Assets.load("assets/shipNone.png");

        // Create player sprites
        this.shipOne = new Ship(shipOneTexture, 40, this.baseHeight / 2, Math.PI / 2, 2, { width: this.baseWidth, height: this.baseHeight }, 40);
        this.shipTwo = new Ship(shipTwoTexture, this.baseWidth - 40, this.baseHeight / 2, -Math.PI / 2, 2, { width: this.baseWidth, height: this.baseHeight }, 40);
        this.container.addChild(this.shipOne.sprite);
        this.container.addChild(this.shipTwo.sprite);

        // Create turn text
        this.turnText = new Text({text: "Turn: 1", style: { fontSize: 24, fill: "#ffffff" },});
        this.turnText.x = this.baseWidth / 2 - 40;
        this.turnText.y = 40;
        this.container.addChild(this.turnText);

        // Create ship scores text
        this.shipOneScoreText = new Text({text: "Score: 0", style: { fontSize: 20, fill: "#ffffff" }});
        this.shipTwoScoreText = new Text({text: "Score: 0", style: { fontSize: 20, fill: "#ffffff" }});
        this.shipOneScoreText.x = 10;
        this.shipOneScoreText.y = 10;
        this.shipTwoScoreText.x = this.baseWidth - 120;
        this.shipTwoScoreText.y = 10;
        this.container.addChild(this.shipOneScoreText);
        this.container.addChild(this.shipTwoScoreText);

        // Create ship fuel levels
        this.shipOneFuelText = new Text({text: "Fuel: 100", style: {fontSize: 20, fill: "#FFFF00"}});
        this.shipTwoFuelText = new Text({text: "Fuel: 100", style: {fontSize: 20, fill: "#FFFF00"}});
        this.shipOneFuelText.x = 10;
        this.shipOneFuelText.y = 40;
        this.shipTwoFuelText.x = this.baseWidth - 110;
        this.shipTwoFuelText.y = 40;
        this.container.addChild(this.shipOneFuelText);
        this.container.addChild(this.shipTwoFuelText);
    }

    // View the next frame if there is one
    nextFrame() {
        if (this.frameIndex < this.frames.length - 1) {
            this.frameIndex++;
            this.showFrame(this.frameIndex);
        }
    }

    // View the previous frame if there is one
    prevFrame() {
        if (this.frameIndex > 0) {
            this.frameIndex--;
            this.showFrame(this.frameIndex);
        }
    }

    // Show the frame at the index
    showFrame(index) {
        const frame = this.frames[index];

        // If the player has not moved their position is a null value, if this is the case update the values to the default positions
        if (!frame.ships.shipOne) frame.ships.shipOne = { x: 40, y: this.baseHeight / 2, rotation: Math.PI / 2 };
        if (!frame.ships.shipTwo) frame.ships.shipTwo = {x: this.baseWidth - 40, y: this.baseHeight / 2, rotation: (Math.PI / 2) * 3};

        // Update player sprite positions
        this.shipOne.sprite.x = frame.ships.shipOne.x;
        this.shipOne.sprite.y = frame.ships.shipOne.y;
        this.shipOne.sprite.rotation = frame.ships.shipOne.rotation;
        this.shipTwo.sprite.x = frame.ships.shipTwo.x;
        this.shipTwo.sprite.y = frame.ships.shipTwo.y;
        this.shipTwo.sprite.rotation = frame.ships.shipTwo.rotation;

        // Update score  and turn texts
        this.shipOneScoreText.text = `Score: ${frame.scores.shipOne}`;
        this.shipTwoScoreText.text = `Score: ${frame.scores.shipTwo}`;
        this.turnText.text = `Turn: ${frame.turn}`;

        // Update fuel levels
        this.shipOneFuelText.text = `Fuel: ${Math.round(frame.fuel.shipOne)}`;
        this.shipTwoFuelText.text = `Fuel: ${Math.round(frame.fuel.shipTwo)}`;
        // If fuel is below 20, change color to red
        this.shipOneFuelText.style.fill = frame.fuel.shipOne > 20 ? "#FFFF00" : "#FF0000";
        this.shipTwoFuelText.style.fill = frame.fuel.shipTwo > 20 ? "#FFFF00" : "#FF0000";

        if (frame.asteroids) {
            this.asteroidField.syncFromServer(frame.asteroids, this.container);
        }
    }

    get view() {
        return this.container;
    }
}