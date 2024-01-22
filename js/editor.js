const R = 0;
const G = 1;
const B = 2;

class Editor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        this.mouse = null;
        this.pointRadius = 6;

        this.drawing = false;
        this.drawChannel = B;

        this.#addEventListeners();
    }

    #addEventListeners() {
        this.canvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.#handleMouseUp.bind(this));
    }

    #handleMouseDown(evt) {
        this.drawing = true;
    }

    #handleMouseUp(evt) {
        this.drawing = false;
    }

    #handleMouseMove(evt) {
        this.mouse = new Point(evt.offsetX, evt.offsetY);
        if (this.drawing) {
            this.drawCircle()
        }
    }

    drawCircle() {
        switch(this.drawChannel) {
            case R: this.ctx.fillStyle = "red"; break;
            case G: this.ctx.fillStyle = "green"; break;
            case B: this.ctx.fillStyle = "blue"; break;
        }

        this.ctx.beginPath()
        this.ctx.arc(this.mouse.x, this.mouse.y, this.pointRadius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    displayImage(image) {
        this.ctx.drawImage(image, 0, 0);
    }
}