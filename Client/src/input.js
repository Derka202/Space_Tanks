export default class InputHandler {
    constructor(shipOne, shipTwo, getScale, baseWidth, baseHeight, network, keysDivId = "keys") {
        const validInput = ['w', 's', 'a', 'd', 'q', 'e', ' '];
        this.keysDiv = document.querySelector("#" + keysDivId);
        this.keys = {};
        this.shipOne = shipOne;
        this.shipTwo = shipTwo;
        this.network = network;
        this.getScale = getScale;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.canMove = false;

        window.addEventListener('keydown', (e) => {
            if (validInput.includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (validInput.includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
                if (this.canMove) {
                    this.network.sendPosition(this.playerIndex === 0 ? this.shipOne.getPosition() : this.shipTwo.getPosition(), this.roomId);
                }
            }
        });
    }

    update() {
        if (!this.canMove) return;
        if (this.keysDiv) this.keysDiv.innerHTML = JSON.stringify(this.keys);
        // const scale = this.getScale();      
        
        const myShip = this.playerIndex === 0 ? this.shipOne : this.shipTwo;
        const otherShip = this.playerIndex === 0 ? this.shipTwo : this.shipOne;
        const hasFuel = myShip.fuel > 0;
        console.log(hasFuel);
        
        if (hasFuel) {
            if (this.keys["w"]) myShip.move(0, -2, otherShip, this.network, this.roomId);
            if (this.keys["s"]) myShip.move(0, 2, otherShip, this.network, this.roomId);
            if (this.keys["a"]) myShip.move(-2, 0, otherShip, this.network, this.roomId);
            if (this.keys["d"]) myShip.move(2, 0, otherShip, this.network, this.roomId);
        }
        if (this.keys["e"]) myShip.rotate(1);
        if (this.keys["q"]) myShip.rotate(-1);
        if (this.keys[" "]) {
            this.canMove = false;
            console.log("BULLET FIRED");
            const bullet = myShip.fire(this.shipOne.sprite.parent);

            this.network.sendBullet({
                x: bullet.x,
                y: bullet.y,
                rotation: bullet.rotation
            });

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