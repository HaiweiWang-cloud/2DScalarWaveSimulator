class Field {
    constructor(Nx, Ny, h, dt) {
        this.Nx = Nx;
        this.Ny = Ny;
        this.num = Nx * Ny;
        this.u = new Float32Array(this.num); // field
        this.prevU = new Float32Array(this.num); // field at previous timestep
        this.c = new Float32Array(this.num); // wave velocity field;
        this.c.fill(1.0);
        this.d = new Float32Array(this.num); // damping field
        this.d.fill(1.0);
        this.newU = new Float32Array(this.num); // update field
        this.h = h;
        this.dt = dt;
        this.t = 0;
    }

    update() {
        //this.newU.set(this.u);
        const n = this.Ny;
        const h1 = 1.0 / this.h / this.h;
        const dt = this.dt;
        const width = 0.5;
        const t0 = 6
    
        for (let i=1; i<this.Nx-1; i++) {
            for (let j=1; j<this.Ny-1; j++) {
                const f = this.u[i*n+j];
                const c = this.c[i*n+j];
                const L = (this.u[(i+1)*n+j] + this.u[(i-1)*n+j] + this.u[i*n+j+1] + this.u[i*n+j-1] - 4*f)*h1;

                const v = L * c * c * dt * dt + 2 * f - this.prevU[i*n+j] - dt * (1-this.d[i*n+j]) * (f - this.prevU[i*n+j]);
                
                this.newU[i*n+j] = v;
            }
        }
        this.prevU.set(this.u);
        this.u.set(this.newU);
        this.t += dt;
    }

    setRefractiveIndex(r) {
        const n = this.Ny;
        for (let i=0; i<this.Nx; i++) {
            for (let j=0; j<this.Ny; j++) {
                this.c[i*n+j] = 1.0 / Math.max(r[i*n+j], 1);
            }
        }
    }

    setDamping(d) {
        const n = this.Ny;
        for (let i=0; i<this.Nx; i++) {
            for (let j=0; j<this.Ny; j++) {
                this.d[i*n+j] = Math.max(0, Math.min(d[i*n+j], 1));
            }
        }
    }

    setPML(thickness) {
        const n = this.Ny;
        // vertical boundaries
        for (let i=0; i<thickness; i++) {
            const v = Math.sqrt(i / thickness);
            for (let j=0; j<this.Ny; j++) {
                this.d[i*n+j] = v;
                this.d[(this.Nx-1-i)*n+j] = v;
            }
        }

        // horizontal boundaries 
        for (let j=0; j<thickness; j++) {
            const v = Math.sqrt(j / thickness);
            for (let i=0; i<this.Nx; i++) {
                this.d[i*n+j] = v;
                this.d[i*n+(this.Ny-1-j)] = v;
            }
        }
    }

}