import { Container, Graphics, Text } from "pixi.js";
import { Button, List } from "@pixi/ui";


export default class HighScoresScene {
    constructor(onBack, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();
        
        const title = new Text({text: "High Scores", style: {fontSize: 42, fill: "#FFFFFF", align: "center"}});
        title.anchor.set(0.5);
        title.y = -200;
        column.addChild(title);

        this.scoresContainer = new List({type: 'vertical', elementsMargin: 10, align: 'center'});
        this.scoresContainer.x = -50;
        this.scoresContainer.y = -100;
        column.addChild(this.scoresContainer);

        const backBg = new Graphics().roundRect(0, 0, 200, 40, 10).fill(0xaa4444);
        const backButton = new Button(backBg);
        backButton.onPress.connect(onBack);
        const backText = new Text({text: "Back", style: {fill: "#ffffff", fontSize: 18}});
        backText.anchor.set(0.5);
        backText.x = backBg.width / 2;
        backText.y = backBg.height / 2;
        backButton.view.addChild(backText);
        backButton.view.y = 130;
        column.addChild(backButton.view);

        column.x = baseWidth / 2;
        column.y = baseHeight / 2;
        this.container.addChild(column);
    }

    async loadScores() {
        try {
            const response = await fetch("http://localhost:3000/highscores");
            const data = await response.json();

            this.scoresContainer.removeChildren();

            data.scores.forEach((score, index) => {
                console.log("Adding score:", score, index);
                if (score.username !== "guest") {
                    const line = new Text({text: `${index + 1}. ${score.username} - ${score.score}`, style: {fill: "#FFFF00", fontSize: 20}});
                    this.scoresContainer.addChild(line);
                }
            });
            console.log(this.scoresContainer);
        } catch (err) {
            console.log("Failed to load scores: ", err);
        }
    }

    get view() {
        return this.container;
    }
}