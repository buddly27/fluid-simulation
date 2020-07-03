import baseVertexShader from "./shader/base.vert";
import splatShader from "./shader/splat.frag";
import copyShader from "./shader/copy.frag";
import curlShader from "./shader/curl.frag";
import vorticityShader from "./shader/vorticity.frag";
import divergenceShader from "./shader/divergence.frag";
import clearShader from "./shader/clear.frag";
import pressureShader from "./shader/pressure.frag";
import gradientSubtractShader from "./shader/gradient_substract.frag";
import advectionShader from "./shader/advection.frag";
import bloomPrefilterShader from "./shader/bloom_prefilter.frag";
import bloomBlurShader from "./shader/bloom_blur.frag";
import bloomFinalShader from "./shader/bloom_final.frag";
import sunraysMaskShader from "./shader/sunrays_mask.frag";
import sunraysShader from "./shader/sunrays.frag";
import blurVertexShader from "./shader/blur.vert";
import blurShader from "./shader/blur.frag";
import colorShader from "./shader/color.frag";
import displayShaderSource from "./shader/display.frag";
import * as utility from "./utility";


class Base extends utility.ContextMixin {

    constructor(gl, vertexSource, fragmentSource, keywords = null) {
        super(gl);

        const vertex = loadVertexShader(gl, vertexSource);
        const fragment = loadFragmentShader(gl, fragmentSource, keywords);
        this._program = createProgram(this.gl, vertex, fragment);
        this._uniforms = getUniforms(this.gl, this._program);
    }

    get uniforms() {
        return this._uniforms;
    }

    set texelSize(size) {
        this.gl.uniform2f(this.uniforms["texelSize"], size.width, size.height);
    }

    bind() {
        this.gl.useProgram(this._program);
    }
}


export class Splat extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, splatShader);
    }

    set target(identifier) {
        this.gl.uniform1i(this.uniforms["uTarget"], identifier);
    }

    set ratio(value) {
        this.gl.uniform1f(this.uniforms["aspectRatio"], value);
    }

    set point(values) {
        this.gl.uniform2f(this.uniforms["point"], ...values);
    }

    set color(values) {
        this.gl.uniform3f(this.uniforms["color"], ...values);
    }

    set radius(value) {
        this.gl.uniform1f(this.uniforms["radius"], correctRadius(value / 100.0));
    }
}


export class Copy extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, copyShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }
}


export class Curl extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, curlShader);
    }

    set velocity(identifier) {
        this.gl.uniform1i(this.uniforms["uVelocity"], identifier);
    }
}


export class Vorticity extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, vorticityShader);
    }

    set velocity(identifier) {
        this.gl.uniform1i(this.uniforms["uVelocity"], identifier);
    }

    set curl(identifier) {
        this.gl.uniform1i(this.uniforms["uCurl"], identifier);
    }

    set vorticity(value) {
        this.gl.uniform1f(this.uniforms["curl"], value);
    }

    set deltaTime(value) {
        this.gl.uniform1f(this.uniforms["dt"], value);
    }
}


export class Divergence extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, divergenceShader);
    }

    set velocity(identifier) {
        this.gl.uniform1i(this.uniforms["uVelocity"], identifier);
    }
}


export class Clear extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, clearShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }

    set pressure(value) {
        this.gl.uniform1f(this.uniforms["value"], value);
    }
}


export class Pressure extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, pressureShader);
    }

    set divergence(identifier) {
        this.gl.uniform1i(this.uniforms["uDivergence"], identifier);
    }

    set pressure(identifier) {
        this.gl.uniform1i(this.uniforms["uPressure"], identifier);
    }
}


export class GradientSubtract extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, gradientSubtractShader);
    }

    set pressure(identifier) {
        this.gl.uniform1i(this.uniforms["uPressure"], identifier);
    }

    set velocity(identifier) {
        this.gl.uniform1i(this.uniforms["uVelocity"], identifier);
    }
}


export class Advection extends Base {

    constructor(gl, supportLinearFiltering) {
        const keywords = supportLinearFiltering ? null : ["MANUAL_FILTERING"];
        super(gl, baseVertexShader, advectionShader, keywords);
    }

    set dyeTexelSize(size) {
        this.gl.uniform2f(this.uniforms["dyeTexelSize"], size.width, size.height);
    }

    set velocity(identifier) {
        this.gl.uniform1i(this.uniforms["uVelocity"], identifier);
    }

    set source(identifier) {
        this.gl.uniform1i(this.uniforms["uSource"], identifier);
    }

    set deltaTime(value) {
        this.gl.uniform1f(this.uniforms["dt"], value);
    }

    set dissipation(value) {
        this.gl.uniform1f(this.uniforms["dissipation"], value);
    }
}


export class BloomPrefilter extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, bloomPrefilterShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }

    set threshold(value) {
        this.gl.uniform1f(this.uniforms["threshold"], value);
    }

    set curves(values) {
        this.gl.uniform3f(this.uniforms["curve"], ...values);
    }
}


export class BloomBlur extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, bloomBlurShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }
}


export class BloomFinal extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, bloomFinalShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }

    set intensity(value) {
        this.gl.uniform1f(this.uniforms["intensity"], value);
    }
}


export class SunraysMask extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, sunraysMaskShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }
}


export class Sunrays extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, sunraysShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }

    set weight(value) {
        this.gl.uniform1f(this.uniforms["weight"], value);
    }
}


export class Blur extends Base {

    constructor(gl) {
        super(gl, blurVertexShader, blurShader);
    }

    set texture(identifier) {
        this.gl.uniform1i(this.uniforms["uTexture"], identifier);
    }
}


export class Color extends Base {

    constructor(gl) {
        super(gl, baseVertexShader, colorShader);
    }

    set color(values) {
        this.gl.uniform4f(this.uniforms["color"], ...values);
    }
}


export class Display extends utility.ContextMixin {

    constructor(gl, config) {
        super(gl);

        this._vertex = loadVertexShader(gl, baseVertexShader);

        this._programs = {};
        this._current_hash = null;
        this._uniforms = {};

        // Create fragment shader depending to config.
        this.update(config);
    }

    update(config) {
        let hash = 0;
        const keywords = [];

        if (config.shadingEnabled) { keywords.push("SHADING"); }
        if (config.bloomEnabled) { keywords.push("BLOOM"); }
        if (config.sunraysEnabled) { keywords.push("SUNRAYS"); }

        keywords.forEach((keyword) => {
            hash += hashCode(keyword);
        });

        let program = this._programs[hash];
        if (!program) {
            const fragment = loadFragmentShader(this.gl, displayShaderSource, keywords);
            program = createProgram(this.gl, this._vertex, fragment);
            this._programs[hash] = program;
        }

        if (this._current_hash !== hash) {
            this._current_hash = hash;
            this._uniforms = getUniforms(this.gl, this._programs[this._current_hash]);
        }
    }

    set texelSize(size) {
        this.gl.uniform2f(this._uniforms["texelSize"], size.width, size.height);
    }

    set texture(identifier) {
        this.gl.uniform1i(this._uniforms["uTexture"], identifier);
    }

    set bloom(identifier) {
        this.gl.uniform1i(this._uniforms["uBloom"], identifier);
    }

    set sunrays(identifier) {
        this.gl.uniform1i(this._uniforms["uSunrays"], identifier);
    }

    set dithering(identifier) {
        this.gl.uniform1i(this._uniforms["uDithering"], identifier);
    }

    set ditherScale(scale) {
        this.gl.uniform2f(this._uniforms["ditherScale"], scale.x, scale.y);
    }

    bind() {
        this.gl.useProgram(this._programs[this._current_hash]);
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


const loadVertexShader = (gl, source) => {
    return loadShader(gl, gl.VERTEX_SHADER, source);
};


const loadFragmentShader = (gl, source, keywords = null) => {
    return loadShader(gl, gl.FRAGMENT_SHADER, source, keywords);
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
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
        const uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }

    return uniforms;
};


const correctRadius = (canvas, radius) => {
    const aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) {
        return radius * aspectRatio;
    }
    return radius;
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
