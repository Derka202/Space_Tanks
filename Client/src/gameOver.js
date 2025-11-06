import { Button } from "@pixi/ui";
import { Container, Graphics, Text } from "pixi.js";

export default class GameOverScene {
    constructor(onMenu, winner, scores, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();

        const overlay = new Graphics().rect(0, 0, baseWidth, baseHeight).fill({color: "#000000", alpha: 0.6});
        column.addChild(overlay);
        
        const gameOverText = new Text({text: "GAME OVER", style: {fontSize: 64, fill: "#ff0000", fontWeight: "bold", align: "center"}});
        gameOverText.anchor.set(0.5);
        gameOverText.x = baseWidth / 2
        gameOverText.y = baseHeight / 2 - 40;
        column.addChild(gameOverText);
        
        const scoreText = new Text({text: `Final Scores:\nShip One: ${scores.shipOne}\nShip Two: ${scores.shipTwo}`, style: {fontSize: 28, fill: "#ffffff", align: "center"}});
        scoreText.anchor.set(0.5);
        scoreText.x = baseWidth / 2;
        scoreText.y = baseHeight / 2 + 50;
        column.addChild(scoreText);
        
        const winnerText = new Text({text: `Winner: ${winner}`, style: {fontSize: 32, fill: "#ffff00"}});
        winnerText.anchor.set(0.5);
        winnerText.x = baseWidth / 2;
        winnerText.y = baseHeight / 2 + 130;
        column.addChild(winnerText);
        
        const menuButtonBg = new Graphics().roundRect(0, 0, 200, 50, 10).fill(0x44aa66);
        const menuButton = new Button(menuButtonBg);
        menuButton.onPress.connect(onMenu);
        const menuButtonText = new Text({text: "Main Menu", style: {fill: "#FFFFFF", fontSize: 20}});
        menuButtonText.anchor.set(0.5);
        menuButtonText.x = menuButtonBg.width / 2;
        menuButtonText.y = menuButtonBg.height / 2;
        menuButton.view.addChild(menuButtonText);
        menuButton.view.x = 320;
        menuButton.view.y = 500;
        column.addChild(menuButton.view);

        this.container.addChild(column);
    }

    get view() {
        return this.container;
    }
}