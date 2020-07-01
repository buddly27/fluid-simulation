export class Program {

    constructor(gl, vertexShaderSource, fragmentShaderSource, fragmentKeywords = null) {
        const vertexShader = loadShader(
            gl, gl.VERTEX_SHADER, vertexShaderSource
        );
        const fragmentShader = loadShader(
            gl, gl.FRAGMENT_SHADER, fragmentShaderSource, fragmentKeywords
        );
        this._program = createProgram(gl, vertexShader, fragmentShader);
        this._uniforms = getUniforms(gl, this._program);
    }

    bind(gl) {
        gl.useProgram(this._program);
    }
}


export class Material {

    constructor(gl, vertexShaderSource, fragmentShaderSource, fragmentKeywords) {
        this._vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        this._fragmentShaderSource = fragmentShaderSource;

        this._programs = {};
        this._current_hash = null;
        this._uniforms = [];

        // Initiate material.
        this.update(gl, fragmentKeywords)
    }

    update(gl, keywords) {
        let hash = 0;

        keywords.forEach((keyword) => {
            hash += hashCode(keyword);
        });

        let program = this._programs[hash];
        if (!program) {
            const fragmentShader = loadShader(
                gl, gl.FRAGMENT_SHADER, this._fragmentShaderSource
            );
            program = createProgram(gl, this._vertexShader, fragmentShader);
            this._programs[hash] = program;
        }

        if (this._current_hash !== hash) {
            this._current_hash = hash;
            this._uniforms = getUniforms(gl, this._programs[this._current_hash]);
        }
    }

    bind(gl) {
        gl.useProgram(this._programs[this._current_hash]);
    }
}


export class Framebuffer {

    constructor(gl, width, height, internalFormat, format, type, param) {
        this.width = width;
        this.height = height;

        gl.activeTexture(gl.TEXTURE0);

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, internalFormat, this.width, this.height, 0,
            format, type, null
        );

        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            this.texture, 0
        );

        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.texelSizeX = 1.0 / this.width;
        this.texelSizeY = 1.0 / this.height;
    }

    attach(gl, id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        return id;
    }
}


export class DoubleFramebuffer {

    constructor(gl, width, height, internalFormat, format, type, param) {
        this.width = width;
        this.height = height;

        this._fbo1 = new Framebuffer(
            gl, this.width, this.height, internalFormat, format, type, param
        );
        this._fbo2 = new Framebuffer(
            gl, this.width, this.height, internalFormat, format, type, param
        );

        this._texelSizeX = this._fbo1.texelSizeX;
        this._texelSizeY = this._fbo1.texelSizeY;
    }

    get read() {
        return this._fbo1;
    }

    set read(value) {
        this._fbo1 = value;
    }

    get write() {
        return this._fbo2;
    }

    set write(value) {
        this._fbo2 = value;
    }

    swap() {
        let temp = this._fbo1;
        this._fbo1 = this._fbo2;
        this._fbo2 = temp;
    }
}


const createProgram = (gl, vertexShader, fragmentShader) => {
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(shaderProgram);
    }

    return shaderProgram;
};


const loadShader = (gl, type, source, keywords = null) => {
    const shader = gl.createShader(type);
    let _source = source;

    if (keywords != null) {
        let keywordsString = "";
        keywords.forEach(keyword => {
            keywordsString += `#define ${keyword}\n`;
        });
        _source = keywordsString + source
    }

    gl.shaderSource(shader, _source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(shader);
    }

    return shader;
};


const getUniforms = (gl, program) => {
    const uniforms = [];
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }

    return uniforms;
};


const hashCode = (string) => {
    if (string.length === 0)
        return 0;

    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = (hash << 5) - hash + string.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
