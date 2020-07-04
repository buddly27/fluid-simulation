export class ContextMixin {

    constructor(gl) {
        this._gl = gl;
    }

    get gl() {
        return this._gl;
    }
}


export const getContext = (canvas) => {
    const params = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false
    };

    let gl = canvas.current.getContext("webgl2", params);
    const isWebGL2 = !!gl;
    if (!isWebGL2) {
        gl = canvas.current.getContext("webgl", params)
            || canvas.current.getContext("experimental-webgl", params);
    }

    let halfFloat;
    let supportLinearFiltering;

    if (isWebGL2) {
        gl.getExtension("EXT_color_buffer_float");
        supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    }
    else {
        halfFloat = gl.getExtension("OES_texture_half_float");
        supportLinearFiltering = gl.getExtension(
            "OES_texture_half_float_linear"
        );
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2 ?
        gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }
    else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return {
        gl,
        ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        }
    };
};


const getSupportedFormat = (gl, internalFormat, format, type) => {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
            case gl.R16F:
                return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F:
                return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default:
                return null;
        }
    }

    return {internalFormat, format}
};


const supportRenderTextureFormat = (gl, internalFormat, format, type) => {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null
    );

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status === gl.FRAMEBUFFER_COMPLETE;
};


export const getTextureScale = (texture, width, height) => {
    return {
        x: width / texture.width,
        y: height / texture.height
    };
};


export const getPointerPosition = (canvas, x, y) => {
    return {
        x: scaleByPixelRatio(x) / canvas.width,
        y: 1.0 - scaleByPixelRatio(y) / canvas.height,
    };
};


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
