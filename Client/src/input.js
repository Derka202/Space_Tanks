export default class InputHandler {
    constructor(shipOne, shipTwo, baseWidth, baseHeight, network, keysDivId = "keys") {
        const validInput = ['w', 's', 'a', 'd', 'q', 'e', ' '];
        this.keysDiv = document.querySelector("#" + keysDivId);
        this.keys = {};
        this.shipOne = shipOne;
        this.shipTwo = shipTwo;
        this.network = network;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.canMove = false;

        // When a key is pressed down, add to this.keys as true
        window.addEventListener('keydown', (e) => {
            if (validInput.includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
            }
        });

        // When a pressed key is released, set key in this.keys to false
        window.addEventListener('keyup', (e) => {
            if (validInput.includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
                if (this.canMove) {
                    this.network.sendPosition(this.playerIndex === 0 ? this.shipOne.getPosition() : this.shipTwo.getPosition(), this.roomId);
                }
            }
        });
    }

    // Pre: User is giving player input
    // Post: Update ship according to player input
    update() {
        if (!this.canMove) return;
        if (this.keysDiv) this.keysDiv.innerHTML = JSON.stringify(this.keys);
        
        const myShip = this.playerIndex === 0 ? this.shipOne : this.shipTwo;
        const otherShip = this.playerIndex === 0 ? this.shipTwo : this.shipOne;
        const hasFuel = myShip.fuel > 0;
        
        if (hasFuel) {
            if (this.keys["w"]) myShip.move(0, -1, otherShip);
            if (this.keys["s"]) myShip.move(0, 1, otherShip);
            if (this.keys["a"]) myShip.move(-1, 0, otherShip);
            if (this.keys["d"]) myShip.move(1, 0, otherShip);
        }
        if (this.keys["e"]) myShip.rotate(1);
        if (this.keys["q"]) myShip.rotate(-1);
        if (this.keys[" "]) {
            this.canMove = false;
            const bullet = myShip.fire(this.shipOne.sprite.parent);

            this.network.sendBullet({
                x: bullet.x,
                y: bullet.y,
                rotation: bullet.rotation
            });

            this.keys[" "] = false;
        }

    }

    setPlayerIndex(index) {
        this.playerIndex = index; // 0 = shipOne, 1 = shipTwo
    }
}