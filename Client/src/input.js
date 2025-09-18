export default class InputHandler {
    constructor(shipOne, shipTwo, getScale, baseWidth, baseHeight, socket, keysDivId = "keys") {
        this.keysDiv = document.querySelector("#" + keysDivId);
        this.keys = {};
        this.shipOne = shipOne;
        this.shipTwo = shipTwo;
        this.margin = 5;
        this.getScale = getScale;
        this.baseWidth = baseWidth;
        this.socket = socket;
        this.baseHeight = baseHeight;

        window.addEventListener('keydown', (e) => {
            console.log(e.key.toLowerCase());
            this.keys[e.key.toLowerCase()] = true;
            console.log(this.keys);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update() {
        if (this.keysDiv) this.keysDiv.innerHTML = JSON.stringify(this.keys);

        const scale = this.getScale();

        // Ship One (W/S)
        if (this.keys["w"] && this.shipOne.y - this.shipOne.height / 2 > this.margin) this.shipOne.y -= 2;
        if (this.keys["s"] && this.shipOne.y + this.shipOne.height / 2 < this.baseHeight - this.margin) this.shipOne.y += 2;
        if (this.keys["a"] && this.shipOne.x - this.shipOne.width / 2 > this.margin) this.shipOne.x -= 2;
        if (this.keys["d"] && this.shipOne.x + this.shipOne.width / 2 < this.baseWidth - this.margin) this.shipOne.x += 2;
        if (this.keys["q"]) this.shipOne.rotation -= 0.01;
        if (this.keys["e"]) this.shipOne.rotation += 0.01;
        
        // Ship Two (ArrowUp/ArrowDown)
        if (this.keys["arrowup"] && this.shipTwo.y >= this.margin) this.shipTwo.y -= 2;
        if (this.keys["arrowdown"] && this.shipTwo.y <= window.innerHeight - this.margin) this.shipTwo.y += 2;

        for (const k in this.keys) {
            if (this.keys[k] === true) {
                this.socket.emit("keyInput", this.keys);
            }
        }

        if (this.keysDiv) return this.keysDiv.innerHTML;
    }
}