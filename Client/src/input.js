export default class InputHandler {
    constructor(shipOne, shipTwo, getScale, baseWidth, baseHeight, network, keysDivId = "keys") {
        const validInput = ['w', 's', 'a', 'd', 'q', 'e', ' '];
        this.keysDiv = document.querySelector("#" + keysDivId);
        this.keys = {};
        this.shipOne = shipOne;
        this.shipTwo = shipTwo;
        this.margin = 5;
        this.network = network;
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
            this.network.sendPosition(this.playerIndex === 0 ? this.shipOne.getPosition() : this.shipTwo.getPosition());
        });
    }

    update() {
        if (this.keysDiv) this.keysDiv.innerHTML = JSON.stringify(this.keys);
        const scale = this.getScale();

        for (const k in this.keys) {
            if (this.keys[k] === true) {
                //this.socket.emit("keyInput", this.keys);
                break;
            }
            else this.movement = false;
        }
        

        if (this.keys["w"]) this.shipOne.move(0, -2, this.shipTwo);
        if (this.keys["s"]) this.shipOne.move(0, 2, this.shipTwo);
        if (this.keys["a"]) this.shipOne.move(-2, 0, this.shipTwo);
        if (this.keys["d"]) this.shipOne.move(2, 0, this.shipTwo);
        if (this.keys["e"]) this.shipOne.rotate(1);
        if (this.keys["q"]) this.shipOne.rotate(-1);
        if (this.keys[" "]) {
            this.shipOne.fire(this.shipOne.sprite.parent);
            this.keys[" "] = false;
        }

        if (this.keysDiv) return this.keysDiv.innerHTML;
    }

    isMoving() {
        return Object.values(this.keys).some(v => v);
    }

    setPlayerIndex(index) {
        this.playerIndex = index; // 0 = shipOne, 1 = shipTwo
    }
}