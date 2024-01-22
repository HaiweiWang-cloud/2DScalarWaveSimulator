function plasma(max, min, value) {
    let val = Math.min(Math.max(value, min), max - 0.0001);
    const d = max - min;
    val = (val - min) / d;
    const m = 1.5;
    const num = Math.floor(val * m);
    const s = (val * m) - num;

    return [val * 255, val * 170, 20, 255];
}

