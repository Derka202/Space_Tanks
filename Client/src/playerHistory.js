import { Container, Text, Graphics } from "pixi.js";
import { Button } from "@pixi/ui";

export default class PlayerHistoryScene {
    constructor(userId, startReplay, backToMenu, baseWidth, baseHeight) {
        this.container = new Container();
        this.scrollContainer = new Container();
        this.scrollSpeed = 20;
        this.userId = userId;
        this.startReplay = startReplay;
        this.backToMenu = backToMenu;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;

        this.initUI();
        this.loadGames();
    }

    // Pre: None
    // Post: Menu UI is created
    initUI() {
        const column = new Container();

        const title = new Text({text: "Player History", style: {fill: "#FFFFFF", fontSize: 36}});
        title.anchor.set(0.5);
        title.x = -260;
        title.y = -260;
        column.addChild(title);

        const backBg = new Graphics().roundRect(0, 0, 200, 50, 10).fill(0xaa4444);
        const backButton = new Button(backBg);
        backButton.onPress.connect(() => this.backToMenu());
        const backText = new Text({text: "Back", style: {fill: "#FFFFFF", fontSize: 20}});
        backText.anchor.set(0.5);
        backText.x = backBg.width / 2;
        backText.y = backBg.height / 2;
        backButton.view.addChild(backText);
        backButton.view.x = 175;
        backButton.view.y = 240;
        column.addChild(backButton.view);

        this.gameListY = -this.baseHeight / 2 + 180;
        this.column = column;
        column.x = this.baseWidth / 2;
        column.y = this.baseHeight / 2;
        this.container.addChild(column);

        const mask = new Graphics().rect(0, 0, 350, this.baseHeight - 150).fill(0xffffff);
        mask.x = -150;
        mask.y = -this.baseHeight / 2 + 100;

        this.scrollContainer.x = -150;
        this.scrollContainer.y = mask.y;
        this.scrollContainer.mask = mask;
        this.column.addChild(mask);
        this.column.addChild(this.scrollContainer);

        window.addEventListener("wheel", (e) => {
            if (!this.container.visible) return;

            this.scrollContainer.y += -e.deltaY > 0 ? this.scrollSpeed : -this.scrollSpeed;

            const minY = - (this.gameListY - (-this.baseHeight / 2 + 180));
            const maxY = 0;

            if (this.scrollContainer.y < minY) this.scrollContainer.y = minY;
            if (this.scrollContainer.y > maxY) this.scrollContainer.y = maxY;
        });
    }

    // Pre: None
    // Post: Data of previous games played by user is fetched from server
    async loadGames() {
        console.log("loading games");
        try{
            const serverUrl = (import.meta.env.VITE_SERVER_URL) || "http://localhost:3000";
            console.log(this.userId);
            const res = await fetch(`${serverUrl}/getusergames?userid=${this.userId}`);
            console.log(res);
            const data = await res.json();
            console.log(data);

            data.games.forEach(game => {
                const gameBg = new Graphics().roundRect(0, 0, 300, 40, 8).fill(0x4444aa);
                const gameButton = new Button(gameBg);
                gameButton.onPress.connect(() => this.startReplay(game.game_id));
                const gameText = new Text({text: `Game ${game.game_id} - ${game.play_date_time}`, style: {fill: "#FFFFFF", fontSize: 18}});
                gameText.anchor.set(0.5, 0.5);
                gameText.x = gameBg.width / 2;
                gameText.y = gameBg.height / 2;
                gameButton.view.addChild(gameText);
                gameButton.view.y = this.gameListY;
                this.scrollContainer.addChild(gameButton.view);

                this.gameListY += 50;
            });
        } catch (err) {
            console.error(err);
        }
    }

    get view() {
        return this.container;
    }
}