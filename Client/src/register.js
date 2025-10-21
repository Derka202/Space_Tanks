import { Button, Input } from "@pixi/ui";
import { Container, Graphics, Text } from "pixi.js";

export default class RegisterScene {
    constructor(onSubmit, onBack, baseWidth, baseHeight) {
        this.container = new Container();
        const column = new Container();

        const title = new Text({text: "Create Account", style: {fontSize: 42, fill: "#ffffff", align: "center"}});
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -200;
        column.addChild(title);

        const usernameLabel = new Text({text: "Username:", style: {fontSize: 20, fill: "#ffffff"}});
        usernameLabel.x = -100;
        usernameLabel.y = -100;
        column.addChild(usernameLabel);
        const usernameInput = new Input({bg: new Graphics().roundRect(0, 0, 250, 40, 6).fill(0x222222),
            textStyle: {fill: "#ffffff", fontSize: 18}, placeholder: "Enter username"});
        usernameInput.x = 50;
        usernameInput.y = -100;
        column.addChild(usernameInput);

        const passwordLabel = new Text({text: "Password:", style: {fontSize: 20, fill: "#ffffff"}});
        passwordLabel.x = -100;
        passwordLabel.y = -30;
        column.addChild(passwordLabel);
        const passwordInput = new Input({bg: new Graphics().roundRect(0, 0, 250, 40, 6).fill(0x222222),
            textStyle: {fill: "#ffffff", fontSize: 18}, placeholder: "Enter Password", secure: true});
        passwordInput.x = 50;
        passwordInput.y = -30;
        column.addChild(passwordInput);

        this.errorText = new Text({text: "", style: {fontSize: 18}});
        this.errorText.x = -100;
        this.errorText.y = -130;
        column.addChild(this.errorText);

        const submitButtonBg = new Graphics().roundRect(0, 0, 200, 50, 10).fill(0x44aa66);
        const submitButton = new Button(submitButtonBg);
        submitButton.onPress.connect(() => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (username) usernameLabel.style.fill = "#FFFFFF";
            else if (!username) {
                usernameLabel.style.fill = "#FF0000";
                usernameInput.placeholder.style.fill = "#AA0000";
            }
            if (password) passwordLabel.style.fill = "#FFFFFF";
            else if (!password) {
                passwordLabel.style.fill = "#FF0000"
                passwordInput.placeholder.style.fill = "#AA0000";
            }
            if (username && password) {
                onSubmit({username, password}, this.errorText);
            }
        });
        const submitButtonText = new Text({text: "Register", style: {fill: "#ffffff", fontSize: 20}});
        submitButtonText.anchor.set(0.5);
        submitButtonText.x = submitButtonBg.width / 2;
        submitButtonText.y = submitButtonBg.height / 2;
        submitButton.view.addChild(submitButtonText);
        submitButton.view.y = 60;
        column.addChild(submitButton.view);

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