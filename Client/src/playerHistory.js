import { Container, Text, Graphics } from "pixi.js";
import { Button } from "@pixi/ui";

export default class PlayerHistoryScene {
    constructor(userId, startReplay, backToMenu, baseWidth, baseHeight) {
        this.container = new Container();
        this.userId = userId;
        this.startReplay = startReplay;
        this.backToMenu = backToMenu;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;

        this.initUI();
        this.loadGames();
    }

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
        backButton.view.y = -this.baseHeight / 2 + 120;
        column.addChild(backButton.view);

        this.gameListY = -this.baseHeight / 2 + 180;
        this.column = column;
        column.x = this.baseWidth / 2;
        column.y = this.baseHeight / 2;
        this.container.addChild(column);
    }

    async loadGames() {
        console.log("loading games");
        try{
            const res = await fetch(`http://localhost:3000/getusergames?userid=${this.userId}`);
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
                this.column.addChild(gameButton.view);

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