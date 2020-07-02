export const getBufferSize = (gl, resolution) => {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1)
        aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
        return {width: max, height: min};
    }

    return {width: min, height: max};
};


export const resizeCanvas = (canvas) => {
    let width = scaleByPixelRatio(canvas.clientWidth);
    let height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
};


export const scaleByPixelRatio = (input) => {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
};


export const wrap = (value, min, max) => {
    let range = max - min;
    if (range === 0)
        return min;

    return (value - min) % range + min;
};

export const generateColor = () => {
    let color = HSVtoRGB(Math.random(), 1.0, 1.0);
    color.red *= 0.15;
    color.green *= 0.15;
    color.blue *= 0.15;
    return color;
};


const HSVtoRGB = (hue, saturation, value) => {
    const i = Math.floor(hue * 6);
    const f = hue * 6 - i;
    const p = value * (1 - saturation);
    const q = value * (1 - f * saturation);
    const t = value * (1 - (1 - f) * saturation);

    switch (i % 6) {
        default:
        case 0:
            return {red: value, green: t, blue: p};
        case 1:
            return {red: q, green: value, blue: p};
        case 2:
            return {red: p, green: value, blue: t};
        case 3:
            return {red: p, green: q, blue: value};
        case 4:
            return {red: t, green: p, blue: value};
        case 5:
            return {red: value, green: p, blue: q};
    }
};
