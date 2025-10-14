import { Container, Graphics, Text } from "pixi.js";

export default class LoginScene extends Container {
    constructor(onSelect) {
        super();

        this.onSelect = onSelect;

        const style = { fontSize: 24, fill: "#ffffff" };

        const background = new Graphics().rect(0, 0, 800, 600).fill("#223344");
        this.addChild(background);

        const title = new Text({text: "Space Tanks",style: { fontSize: 32, fill: "#ffcc00" }});
        title.x = 200;
        title.y = 100;
        this.addChild(title);

        this.addChild(this.makeButton("Guest", 300, 200, () => {
            this.onSelect({ type: "guest" });
        }));

        this.addChild(this.makeButton("Login", 300, 280, () => {
            this.onSelect({ type: "login" });
        }));

        this.addChild(this.makeButton("Register", 300, 360, () => {
            this.onSelect({ type: "register" });
        }));
    }

    makeButton(label, x, y, onClick) {
        const container = new Container();

        const buttonBg = new Graphics()
            .roundRect(0, 0, 200, 50, 10)
            .fill("#4466aa");
        container.addChild(buttonBg);

        const text = new Text({text: label, style: { fontSize: 20, fill: "#ffffff" }});
        text.x = 100 - text.width / 2;
        text.y = 25 - text.height / 2;
        container.addChild(text);

        container.x = x;
        container.y = y;

        container.interactive = true;
        container.cursor = "pointer";
        container.on("pointerdown", onClick);

        return container;
    }
}
