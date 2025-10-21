import { Button } from "@pixi/ui";
import { Container, Text, Graphics } from "pixi.js";

export default class WelcomeScene {
    constructor(onChoice, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();

        const title = new Text({text: "Space Tanks", style: {fontSize: 48, fill: "#ffffff"}});
        title.anchor.set(0.5);
        title.x = -title.width / 2;
        title.y = -200;
        column.addChild(title);

        const guestButtonBg = new Graphics().fill(0x4466aa).roundRect(0, 0, 200, 50, 10).fill();
        const guestButton = new Button(guestButtonBg);
        guestButton.onPress.connect(() => onChoice({type: "guest"}));
        const guestText = new Text({text: "Guest", style: {fill: "#ffffff", fontSize: 20}});
        guestText.anchor.set(0.5);
        guestText.x = guestButtonBg.width / 2;
        guestText.y = guestButtonBg.height / 2;
        guestButton.view.addChild(guestText);
        guestButton.view.x = 0;
        guestButton.view.y = -100;
        column.addChild(guestButton.view);

        const loginButtonBg = new Graphics().fill(0x4466aa).roundRect(0, 0, 200, 50, 10).fill();
        const loginButton = new Button(loginButtonBg);
        loginButton.onPress.connect(() => onChoice({type: "login"}));
        const loginText = new Text({text: "Login", style: {fill: "#ffffff", fontSize: 20}});
        loginText.anchor.set(0.5);
        loginText.x = loginButtonBg.width / 2;
        loginText.y = loginButtonBg.height / 2;
        loginButton.view.addChild(loginText);
        loginButton.view.x = 0;
        loginButton.view.y = 0;
        column.addChild(loginButton.view);

        const registerButtonBg = new Graphics().fill(0x4466aa).roundRect(0, 0, 200, 50, 10).fill();
        const registerButton = new Button(registerButtonBg);
        registerButton.onPress.connect(() => onChoice({type: "register"}));
        const registerText = new Text({text: "Register", style: {fill: "#ffffff", fontSize: 20}});
        registerText.anchor.set(0.5);
        registerText.x = registerButtonBg.width / 2;
        registerText.y = registerButtonBg.height / 2;
        registerButton.view.addChild(registerText);
        registerButton.view.x = 0;
        registerButton.view.y = 100;
        column.addChild(registerButton.view);
        
        column.x = baseWidth / 2;
        column.y = baseHeight / 2;
        this.container.addChild(column);
    }

    get view() {
        return this.container;
    }
}

/*
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
*/