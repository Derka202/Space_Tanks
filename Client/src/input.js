export default class InputHandler {
    constructor(shipOne, shipTwo, getScale, baseWidth, baseHeight, socket, keysDivId = "keys") {
        const validInput = ['w', 's', 'a', 'd', 'q', 'e', ' '];
        this.keysDiv = document.querySelector("#" + keysDivId);
        this.keys = {};
        this.shipOne = shipOne;
        this.shipTwo = shipTwo;
        this.margin = 5;
        this.socket = socket;
        this.getScale = getScale;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.position = {
            x: null, y: null, rotation: null
        };
        this.movement = false;

        window.addEventListener('keydown', (e) => {
            if (validInput.includes(e.key.toLowerCase())) {
                if (!this.isMoving()) {
                    this.position = this.shipOne.getPosition();
                }
                this.keys[e.key.toLowerCase()] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (validInput.includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;

                if (!this.isMoving()) {
                    this.position = this.shipOne.getPosition();
                }
            }
            console.log(this.position);
            this.socket.emit("updatePosition", this.position);
        });
    }

    update() {
        if (this.keysDiv) this.keysDiv.innerHTML = JSON.stringify(this.keys);

        const scale = this.getScale();

        for (const k in this.keys) {
            if (this.keys[k] === true) {
                this.socket.emit("keyInput", this.keys);
                break;
            }
            else this.movement = false;
        }
        
        // Ship One (W/S)
        if (this.keys["w"] && this.shipOne.sprite.y - this.shipOne.sprite.height / 2 > this.margin) this.shipOne.move(0, -2);
        if (this.keys["s"] && this.shipOne.sprite.y + this.shipOne.sprite.height / 2 < this.baseHeight - this.margin) this.shipOne.move(0, 2);
        if (this.keys["a"] && this.shipOne.sprite.x - this.shipOne.sprite.width / 2 > this.margin) this.shipOne.move(-2, 0);
        if (this.keys["d"] && this.shipOne.sprite.x + this.shipOne.sprite.width / 2 < this.baseWidth - this.margin) this.shipOne.move(2, 0);
        if (this.keys["q"]) this.shipOne.rotate(-1);
        if (this.keys["e"]) this.shipOne.rotate(1);
        if (this.keys[" "]) {
            this.shipOne.fire(this.shipOne.sprite.parent);
            this.keys[" "] = false;
        }
        
        // Ship Two (ArrowUp/ArrowDown)
        if (this.keys["arrowup"] && this.shipTwo.y >= this.margin) this.shipTwo.y -= 2;
        if (this.keys["arrowdown"] && this.shipTwo.y <= window.innerHeight - this.margin) this.shipTwo.y += 2;


        if (this.keysDiv) return this.keysDiv.innerHTML;
    }

    isMoving() {
        return Object.values(this.keys).some(v => v);
    }
}