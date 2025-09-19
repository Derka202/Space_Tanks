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
        

        const myShip = this.playerIndex === 0 ? this.shipOne : this.shipTwo;
        const otherShip = this.playerIndex === 0 ? this.shipTwo : this.shipOne;

        if (this.keys["w"]) myShip.move(0, -2, otherShip);
        if (this.keys["s"]) myShip.move(0, 2, otherShip);
        if (this.keys["a"]) myShip.move(-2, 0, otherShip);
        if (this.keys["d"]) myShip.move(2, 0, otherShip);
        if (this.keys["e"]) myShip.rotate(1);
        if (this.keys["q"]) myShip.rotate(-1);
        if (this.keys[" "]) {
            myShip.fire(myShip.sprite.parent);
            this.keys[" "] = false;
        }
    }

    isMoving() {
        return Object.values(this.keys).some(v => v);
    }

    setPlayerIndex(index) {
        this.playerIndex = index; // 0 = shipOne, 1 = shipTwo
    }
}