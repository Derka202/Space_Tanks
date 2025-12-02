import { Button } from "@pixi/ui";
import { Container, Text, Graphics } from "pixi.js";

export default class WelcomeScene {
    constructor(onChoice, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();

        // Title text
        const title = new Text({text: "Space Tanks", style: {fontSize: 48, fill: "#ffffff"}});
        title.anchor.set(0.5);
        title.x = -title.width / 2;
        title.y = -200;
        column.addChild(title);

        // Button to sign in user has guest
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

        // Button to bring user to login screen
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

        // Button to bring user to registration screen
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
