import { Button } from "@pixi/ui";
import { Container, Graphics, Text } from "pixi.js";

export default class InstructionsScene {
    constructor(onBack, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();

        const title = new Text({text: "Instructions", style: {fontSize: 42, fill: "#ffffff", align: "center"}});
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -200;
        column.addChild(title);

        const instructionsText = new Text({text: "Space Tanks is a turn based strategy shooter game where players must deal as much\ndamage as possible to their opponents. Hitting another player with a bullet give you 20 points.\n\n\n\n\n        WASD controls movement\n        QE controls rotation\n        Spacebar to shoot",
            style: {fontSize: 18, fill: "#FFFFFF"}});
        instructionsText.x = -375;
        instructionsText.y = -100;
        column.addChild(instructionsText);

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

    get view() {
        return this.container;
    }
}