import { Container, Graphics, Text } from "pixi.js";
import { Button } from "@pixi/ui";

export default class MainMenuScene {
    constructor(onPlay, onHistory, onHighScores, onInstructions, username, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();

        // Title text
        const title = new Text({text: "Space Tanks", style: {fontSize: 48, fill: "#FFFFFF", align: "center"}});
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -200;
        column.addChild(title);

        // Text that displays the username of user
        const userText = new Text({text: `Signed in as: ${username}`, style: {fontSize: 18, fill: "#FFFF00", align: "center"}});
        userText.anchor.set(0.5);
        userText.x = 0;
        userText.y = -150;
        column.addChild(userText);

        // Pre: label is the text on the button, y is the y cordinate of the created button, callback is the function passed through to call when the button is pressed
        // Post: A button is created, positioned, and given functionality
        const createButton = (label, y, callback,) => {
            const bg = new Graphics().roundRect(0, 0, 250, 50, 10).fill(0x4466aa);
            const button = new Button(bg);
            button.onPress.connect(callback);

            const text = new Text({text: label, style: {fontSize: 20, fill: "#FFFFFF"}});
            text.anchor.set(0.5);
            text.x = bg.width / 2;
            text.y = bg.height / 2;
            button.view.addChild(text);

            button.view.x = -100;
            button.view.y = y;
            column.addChild(button.view);
        }

        createButton("Play", -50, onPlay);
        createButton("Player History", 20, onHistory);
        createButton("High Scores", 90, onHighScores);
        createButton("Instructions", 160, onInstructions);

        column.x = baseWidth / 2;
        column.y = baseHeight / 2;
        this.container.addChild(column);
    }

    get view() {
        return this.container
    }
}