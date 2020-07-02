import LDR_LLL1_0 from "./texture/LDR_LLL1_0.png";


class Frame {

    constructor(gl, width, height, internalFormat, format, texType, filtering) {
        this._gl = gl;
        this._width = width;
        this._height = height;

        gl.activeTexture(gl.TEXTURE0);

        this._texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, internalFormat, this._width, this._height, 0,
            format, texType, null
        );

        this._buffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._buffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this._texture, 0
        );

        gl.viewport(0, 0, this._width, this._height);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    get texture() {
        return this._texture;
    }

    get object() {
        return this._buffer;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    get texel() {
        return {
            width: 1.0 / this._width,
            height: 1.0 / this._height,
        };
    }

    attach(identifier) {
        this._gl.activeTexture(this._gl.TEXTURE0 + identifier);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        return identifier;
    }
}


class DoubleFrame {

    constructor(gl, width, height, internalFormat, format, texType, filtering) {
        this._buffer1 = new Frame(
            gl, width, height,
            internalFormat, format,
            texType, filtering
        );
        this._buffer2 = new Frame(
            gl, width, height,
            internalFormat, format,
            texType, filtering
        );
    }

    get width() {
        return this._buffer1.width;
    }

    get height() {
        return this._buffer1.height;
    }

    get texel() {
        return this._buffer1.texel;
    }

    get buffer1() {
        return this._buffer1;
    }

    get buffer2() {
        return this._buffer2;
    }

    swap() {
        let temp = this._buffer1;
        this._buffer1 = this._buffer2;
        this._buffer2 = temp;
    }
}


export class Texture {

    constructor(gl) {
        this._gl = gl;
        this._width = 1;
        this._height = 1;

        this._texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGB, this._width, this._height, 0,
            gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255])
        );

        const image = new Image();
        image.onload = () => {
            this._width = image.width;
            this._height = image.height;
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image
            );
        };
        image.src = LDR_LLL1_0;
    }

    get texture() {
        return this._texture;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    attach(identifier) {
        this._gl.activeTexture(this._gl.TEXTURE0 + identifier);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        return identifier;
    }
}


export class Dye extends DoubleFrame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatRGBA;
        const texType = ext.halfFloatTexType;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        super(gl, width, height, internalFormat, format, texType, filtering);
    }
}


export class Velocity extends DoubleFrame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatRG;
        const texType = ext.halfFloatTexType;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        super(gl, width, height, internalFormat, format, texType, filtering);
    }
}


export class Divergence extends Frame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatR;
        const texType = ext.halfFloatTexType;
        super(gl, width, height, internalFormat, format, texType, gl.NEAREST);
    }
}


export class Curl extends Frame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatR;
        const texType = ext.halfFloatTexType;
        super(gl, width, height, internalFormat, format, texType, gl.NEAREST);
    }
}


export class Pressure extends DoubleFrame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatR;
        const texType = ext.halfFloatTexType;
        super(gl, width, height, internalFormat, format, texType, gl.NEAREST);
    }
}


export class Bloom extends Frame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatRGBA;
        const texType = ext.halfFloatTexType;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        super(gl, width, height, internalFormat, format, texType, filtering);
    }
}


export class Sunrays extends Frame {

    constructor(gl, size, ext) {
        const {width, height} = size;
        const {internalFormat, format} = ext.formatR;
        const texType = ext.halfFloatTexType;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        super(gl, width, height, internalFormat, format, texType, filtering);
    }
}
