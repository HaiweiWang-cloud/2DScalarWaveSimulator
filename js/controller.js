class Controller {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.sources = [];

        this.mouse = null;
        this.hovered = null;
        this.selected = null;
        this.dragging = false;

        this.#addEventListeners();
    }

    initialiseGrid(Nx, Ny, stability, maxFreq, res) {
        this.s = Math.min(stability, 0.25); // Courant stability factor
        this.res = Math.max(10, res);
        this.maxFreq = maxFreq;
        this.setGridSpacing(1);
        this.field = new Field(Nx, Ny, this.h, this.dt); 
        this.pxsX = this.canvas.width / Nx;
        this.pxsY = this.canvas.height / Ny;
        sourceFreq.max = this.maxFreq;
    }

    setGridSpacing(cMin) { // use to reset when the maximum refractive index in the model changes.
        this.h = cMin / this.maxFreq / this.res;
        this.dt = this.s * this.h;
    }

    getImageValues(canvas) {
        const ctx = canvas.getContext("2d");
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pxs = Math.floor(Math.min(canvas.width/this.field.Nx, canvas.height/this.field.Ny)); // pxs per grid spacing
        const pxs2 = 1 / (pxs * pxs);
        const n = this.field.Ny;
        const r = new Float32Array(this.field.num);
        const g = new Float32Array(this.field.num);
        const b = new Float32Array(this.field.num);
        const a = new Float32Array(this.field.num);
        for (let i=0; i<this.field.Nx; i++) {
            for (let j=0; j<this.field.Ny; j++) {
                let red = 0;
                let green = 0;
                let blue = 0;
                let alpha = 0;
                
                for (let x=j*pxs; x<(j+1)*pxs; x++) {
                    for (let y=i*pxs; y<(i+1)*pxs; y++) {
                        let p = 4*(x*n*pxs + y);
                        red += id[p++];
                        green += id[p++];
                        blue += id[p++];
                        alpha += id[p++];
                    }
                }

                r[i*n+j] = red * pxs2;
                g[i*n+j] = green * pxs2 / 255;
                b[i*n+j] = 1 - blue * pxs2 / 255;
                a[i*n+j] = alpha * pxs2;
            }
        }
        return {red: r, green: g, blue: b, alpha: a};

    }

    update() {
        this.applySources();
        this.field.update();
    }

    addSource(x, y, amplitude, freq, phase) {
        this.sources.push(new Source(x, y, amplitude, freq, phase));
    }

    applySources() {
        const n = this.field.Ny;
        for (const source of this.sources) {
            this.field.u[source.x*n+source.y] = source.amplitude * Math.sin(2*Math.PI * this.field.t * source.freq + source.phase);
        }
    }

    drawField() {
        colormesh(this.ctx, this.canvas.width, this.canvas.height, this.field.u, this.field.Nx, this.field.Ny, jet, {max: 1, min: -1, alpha: 0.5});
    }

    drawSelectedPoints() {
        if (this.selected) {
            const point = new Point(this.selected.x * this.pxsX, this.selected.y * this.pxsY);
            point.draw(this.ctx, {size: this.res, color: "white", outline: true});
        }
        if (this.hovered) {
            const point = new Point(this.hovered.x * this.pxsX, this.hovered.y * this.pxsY);
            point.draw(this.ctx, {size: this.res, color: "purple", outline: true});
        }
    }

    drawAllSources() {
        this.sources.forEach(source => {
            const point = new Point(source.x * this.pxsX, source.y * this.pxsY);
            point.draw(this.ctx, {size: this.res, color: "red", fill: true});
        })
    }

    draw({showAll = false} = {}) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawField();
        this.drawSelectedPoints();
        if (showAll) {
            this.drawAllSources();
        }
    }

    updateSourceInfo() {
        if (this.selected) {
            const x = this.selected.x * this.pxsX + this.canvas.offsetLeft;
            const y = this.selected.y * this.pxsY + this.canvas.offsetTop+5;
            sourceParameters.style.display = "block";
            sourceParameters.style.left = `${x}px`;
            sourceParameters.style.top = `${y}px`;
            sourceFreq.value = this.selected.freq.toFixed(3);
            sourceAmplitude.value = this.selected.amplitude.toFixed(3);
            sourcePhase.value = this.selected.phase.toFixed(3);
        } else {
            sourceParameters.style.display = "none";
        }
    }

    setSourceParameters() {
        this.selected.freq = Number(sourceFreq.value);
        this.selected.amplitude = Number(sourceAmplitude.value);
        this.selected.phase = Number(sourcePhase.value);
    }

    #addEventListeners() {
        this.canvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
        this.canvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
        this.canvas.addEventListener("mouseup", () => this.dragging = false);
        this.canvas.addEventListener("touchend", () => this.dragging = false);
        this.canvas.addEventListener("touchstart", this.#handleTouchStart.bind(this));
        this.canvas.addEventListener("touchmove", this.#handleTouchMove.bind(this));
        removeSource.addEventListener("click", this.#deleteSource.bind(this));
        window.addEventListener("keydown", this.#handleKeyDown.bind(this));
        this.canvas.addEventListener("contextmenu", (evt) => evt.preventDefault());
    }

    #handleDrag() {
        if (this.dragging && this.selected) {
            this.selected.x = this.mouse.x;
            this.selected.y = this.mouse.y;
            this.updateSourceInfo();
        }
    }

    #handleMouseMove(evt) {
        this.mouse = new Point(evt.offsetX / this.pxsX, evt.offsetY / this.pxsY);
        this.hovered = getNearestPoint(this.mouse, this.sources, 10);
    
        this.#handleDrag();
    }

    #handleMouseDown(evt) {
        this.dragging = true;
        if (evt.button == 0) {
            this.#handleLeftClick();
        }

        if (evt.button == 2) {
            if (this.selected) {
                this.setSourceParameters();
                this.selected = null;
            }
        }
        this.updateSourceInfo();
    }

    #handleLeftClick() {
        if (this.hovered) {
            if (this.selected) {
                this.setSourceParameters();
            }
            this.selected = this.hovered;
        } else if (this.selected) {
            this.setSourceParameters();
            this.selected = null;
        } else {
            this.selected = new Source(this.mouse.x, this.mouse.y, 1, this.maxFreq, 0);
            this.sources.push(this.selected);
        }
    }

    #getTouchMouse(evt) {
        this.mouse = new Point((evt.touches[0].pageX-this.canvas.offsetLeft + simContainer.offsetLeft) / this.pxsX, (evt.touches[0].pageY - simContainer.offsetTop) / this.pxsY);
    }

    #handleTouchStart(evt) {
        this.dragging = true;
        this.#getTouchMouse(evt);
        this.hovered = getNearestPoint(this.mouse, this.sources, 10);
        this.#handleLeftClick();
    }

    #handleTouchMove(evt) {
        this.#getTouchMouse(evt);

        this.#handleDrag();
    }

    #handleKeyDown(evt) {
        if (evt.key == "Delete") {
            console.log("deleting")
            if (this.selected) {
                this.#deleteSource(this.selected);
            }

            if (this.hovered) {
                this.#deleteSource(this.hovered);
            }
        }
    }

    #deleteSource(source) {
        this.sources.splice(this.sources.indexOf(source), 1);
        this.selected = null;
        this.hovered = null;
        this.updateSourceInfo();
    }

}