import baseVertexShader from "./shader/base.vert";
import blurVertexShader from "./shader/blur.vert";
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
import blurShader from "./shader/blur.frag";
import colorShader from "./shader/color.frag";
import checkerboardShader from "./shader/checkerboard.frag";
import displayShaderSource from "./shader/display.frag";


class Base {

    constructor(gl) {
        this._gl = gl;
    }

    get gl() {
        return this._gl;
    }

    createVertex(source) {
        return loadShader(this.gl, this.gl.VERTEX_SHADER, source);
    }

    createFragment(source, keywords = null) {
        return loadShader(this.gl, this.gl.FRAGMENT_SHADER, source, keywords);
    }
}


class BaseProgram extends Base {

    constructor(gl, vertexSource, fragmentSource, keywords = null) {
        super(gl);

        const vertex = this.createVertex(vertexSource);
        const fragment = this.createFragment(fragmentSource, keywords);
        this._program = createProgram(this.gl, vertex, fragment);
        this._uniforms = getUniforms(this.gl, this._program);
    }

    get uniforms() {
        return this._uniforms;
    }

    bind() {
        this.gl.useProgram(this._program);
    }
}


export class Splat extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, splatShader);
    }

    apply(dyeFrame, velocityFrame, radius, x, y, dx, dy, color) {
        const {width, height} = this.gl.canvas;

        this.bind();

        this.gl.uniform1i(this.uniforms["uTarget"], velocityFrame.buffer1.attach(0));
        this.gl.uniform1f(this.uniforms["aspectRatio"], width / height);
        this.gl.uniform2f(this.uniforms["point"], x, y);
        this.gl.uniform3f(this.uniforms["color"], dx, dy, 0.0);
        this.gl.uniform1f(this.uniforms["radius"], correctRadius(radius / 100.0));
        blit(this.gl, velocityFrame.buffer2.object);
        velocityFrame.swap();

        this.gl.viewport(0, 0, dyeFrame.width, dyeFrame.height);
        this.gl.uniform1i(this.uniforms["uTarget"], dyeFrame.buffer1.attach(0));
        this.gl.uniform3f(this.uniforms["color"], color.red, color.green, color.blue);
        blit(this.gl, dyeFrame.buffer2.object);
        dyeFrame.swap();
    }
}


export class Copy extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, copyShader);
    }

    apply(frame1, frame2) {
        this.bind();

        this.gl.uniform1i(this.uniforms["uTexture"], frame1.attach(0));
        blit(frame2.object);
    }
}


export class Curl extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, curlShader);
    }

    apply(velocityFrame, curlFrame) {
        this.bind();

        const {texel} = velocityFrame;

        this.gl.uniform2f(this.uniforms["texelSize"], texel.width, texel.height);
        this.gl.uniform1i(this.uniforms["uVelocity"], velocityFrame.buffer1.attach(0));
        blit(curlFrame.object);
    }
}


export class Vorticity extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, vorticityShader);
    }

    apply(velocityFrame, curlFrame, vorticity, deltaTime) {
        this.bind();

        const {texel} = velocityFrame;

        this.gl.uniform2f(this.uniforms["texelSize"], texel.width, texel.height);
        this.gl.uniform1i(this.uniforms["uVelocity"], velocityFrame.buffer1.attach(0));
        this.gl.uniform1i(this.uniforms["uCurl"], curlFrame.attach(1));
        this.gl.uniform1f(this.uniforms["curl"], vorticity);
        this.gl.uniform1f(this.uniforms["dt"], deltaTime);
        blit(velocityFrame.buffer2.object);
        velocityFrame.swap();
    }
}


export class Divergence extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, divergenceShader);
    }

    apply(velocityFrame, divergenceFrame) {
        this.bind();

        const {texel} = velocityFrame;

        this.gl.uniform2f(this.uniforms["texelSize"], texel.width, texel.height);
        this.gl.uniform1i(this.uniforms["uVelocity"], velocityFrame.buffer1.attach(0));
        blit(divergenceFrame.object);
    }
}


export class Clear extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, clearShader);
    }

    apply(frame, pressure) {
        this.bind();

        this.gl.uniform1i(this.uniforms["uTexture"], frame.buffer1.attach(0));
        this.gl.uniform1f(this.uniforms["value"], pressure);
        blit(frame.buffer2.object);
        frame.swap();
    }
}


export class Pressure extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, pressureShader);
    }

    apply(velocityFrame, divergenceFrame, pressureFrame, iterations) {
        this.bind();

        const {texel} = velocityFrame;

        this.gl.uniform2f(this.uniforms["texelSize"], texel.width, texel.height);
        this.gl.uniform1i(this.uniforms["uDivergence"], divergenceFrame.attach(0));

        for (let i = 0; i < iterations; i++) {
            this.gl.uniform1i(this.uniforms["uPressure"], pressureFrame.buffer1.attach(1));
            blit(pressureFrame.buffer2.object);
            pressureFrame.swap();
        }
    }
}


export class GradientSubtract extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, gradientSubtractShader);
    }

    apply(velocityFrame, pressureFrame) {
        this.bind();

        const {texel} = velocityFrame;

        this.gl.uniform2f(this.uniforms["texelSize"], texel.width, texel.height);
        this.gl.uniform1i(this.uniforms["uPressure"], pressureFrame.buffer1.attach(0));
        this.gl.uniform1i(this.uniforms["uVelocity"], velocityFrame.buffer1.attach(1));
        blit(velocityFrame.buffer2.object);
        velocityFrame.swap();
    }
}


export class Advection extends BaseProgram {

    constructor(gl, supportLinearFiltering) {
        const keywords = supportLinearFiltering ? null : ["MANUAL_FILTERING"];
        super(gl, baseVertexShader, advectionShader, keywords);
        this._supportLinearFiltering = supportLinearFiltering;
    }

    apply(dyeFrame, velocityFrame, velocityDissipation, densityDissipation, deltaTime) {
        this.bind();

        const vTexel = velocityFrame.texel;
        const dTexel = dyeFrame.texel;

        this.gl.uniform2f(this.uniforms["texelSize"], vTexel.width, vTexel.height);

        if (!this._supportLinearFiltering) {
            this.gl.uniform2f(
                this.uniforms["dyeTexelSize"], vTexel.width, vTexel.height
            );
        }

        let velocityId = velocityFrame.buffer1.attach(0);
        this.gl.uniform1i(this.uniforms["uVelocity"], velocityId);
        this.gl.uniform1i(this.uniforms["uSource"], velocityId);
        this.gl.uniform1f(this.uniforms["dt"], deltaTime);
        this.gl.uniform1f(this.uniforms["dissipation"], velocityDissipation);
        blit(velocityFrame.buffer2.object);
        velocityFrame.swap();

        this.gl.viewport(0, 0, dyeFrame.width, dyeFrame.height);

        if (!this._supportLinearFiltering) {
            this.gl.uniform2f(
                this.uniforms["dyeTexelSize"], dTexel.width, dTexel.height
            );
        }

        this.gl.uniform1i(this.uniforms["uVelocity"], velocityFrame.buffer1.attach(0));
        this.gl.uniform1i(this.uniforms["uSource"], dyeFrame.buffer1.attach(1));
        this.gl.uniform1f(this.uniforms["dissipation"], densityDissipation);
        blit(dyeFrame.buffer2.object);
        dyeFrame.swap();
    }
}


export class BloomPrefilter extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, bloomPrefilterShader);
    }

    apply(frame1, frame2, threshold, softKnee) {
        this.gl.disable(this.gl.BLEND);

        this.bind();

        let knee = threshold * softKnee + 0.0001;
        let curve0 = softKnee - knee;
        let curve1 = knee * 2;
        let curve2 = 0.25 / knee;

        this.gl.uniform3f(this.uniforms["curve"], curve0, curve1, curve2);
        this.gl.uniform1f(this.uniforms["threshold"], threshold);
        this.gl.uniform1i(this.uniforms["uTexture"], frame1.attach(0));
        this.gl.viewport(0, 0, frame2.width, frame2.height);
        blit(frame2.object);
    }
}


export class BloomBlur extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, bloomBlurShader);
    }

    apply(frame, bloomFrameBuffers) {
        this.bind();

        let last = frame;

        for (let i = 0; i < bloomFrameBuffers.length; i++) {
            const _frame = bloomFrameBuffers[i];
            const {width, height} = last.texel;
            this.gl.uniform2f(this.uniforms["texelSize"], width, height);
            this.gl.uniform1i(this.uniforms["uTexture"], last.attach(0));
            this.gl.viewport(0, 0, _frame.width, _frame.height);
            blit(_frame.object);
            last = _frame;
        }

        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        this.gl.enable(this.gl.BLEND);

        for (let i = bloomFrameBuffers.length - 2; i >= 0; i--) {
            const _frame = bloomFrameBuffers[i];
            const {width, height} = last.texel;
            this.gl.uniform2f(this.uniforms["texelSize"], width, height);
            this.gl.uniform1i(this.uniforms["uTexture"], last.attach(0));
            this.gl.viewport(0, 0, _frame.width, _frame.height);
            blit(_frame.object);
            last = _frame;
        }

        return last;
    }
}


export class BloomFinal extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, bloomFinalShader);
    }

    apply(frame, bloomIntensity) {
        const {texel, width, height} = frame;

        this.gl.disable(this.gl.BLEND);

        this.bind();

        this.gl.uniform2f(this.uniforms["texelSize"], texel.width, texel.height);
        this.gl.uniform1i(this.uniforms["uTexture"], frame.attach(0));
        this.gl.uniform1f(this.uniforms["intensity"], bloomIntensity);
        this.gl.viewport(0, 0, width, height);
        blit(frame.object);
    }
}


export class SunraysMask extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, sunraysMaskShader);
    }

    apply(frame1, frame2) {
        this.gl.disable(this.gl.BLEND);

        this.bind();

        this.gl.uniform1i(this.uniforms["uTexture"], frame1.attach(0));
        this.gl.viewport(0, 0, frame2.width, frame2.height);
        blit(frame2.object);
    }
}


export class Sunrays extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, sunraysShader);
    }

    apply(frame1, frame2, weight) {
        this.bind();

        this.gl.uniform1f(this.uniforms["weight"], weight);
        this.gl.uniform1i(this.uniforms["uTexture"], frame2.attach(0));
        this.gl.viewport(0, 0, frame1.width, frame1.height);
        blit(frame1.object);
    }
}


export class Blur extends BaseProgram {

    constructor(gl) {
        super(gl, blurVertexShader, blurShader);
    }

    apply(frame1, frame2, iterations) {
        this.bind();

        for (let i = 0; i < iterations; i++) {
            this.gl.uniform2f(this.uniforms["texelSize"], frame1.texel.width, 0.0);
            this.gl.uniform1i(this.uniforms["uTexture"], frame1.attach(0));
            blit(frame2.object);

            this.gl.uniform2f(this.uniforms["texelSize"], 0.0, frame1.texel.height);
            this.gl.uniform1i(this.uniforms["uTexture"], frame2.attach(0));
            blit(frame1.object);
        }
    }
}


export class Color extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, colorShader);
    }

    apply(buffer, color) {
        this.bind();

        this.gl.uniform4f(this.uniforms["color"], color.r, color.g, color.b, 1);
        blit(buffer);
    }
}


export class CheckerBoard extends BaseProgram {

    constructor(gl) {
        super(gl, baseVertexShader, checkerboardShader);
    }

    apply(buffer) {
        const {width, height} = this.gl.canvas;

        this.bind();

        this.gl.uniform1f(this.uniforms["aspectRatio"], width / height);
        blit(buffer);
    }
}


export class Display extends Base {

    constructor(gl, shadingEnabled, bloomEnabled, sunraysEnabled) {
        super(gl);

        this._shadingEnabled = shadingEnabled;
        this._bloomEnabled = bloomEnabled;
        this._sunraysEnabled = sunraysEnabled;

        this._vertex = this.createVertex(baseVertexShader);

        this._programs = {};
        this._current_hash = null;
        this._uniforms = {};

        // Initiate material.
        this.update(shadingEnabled, bloomEnabled, sunraysEnabled)
    }

    update(shadingEnabled, bloomEnabled, sunraysEnabled) {
        this._shadingEnabled = shadingEnabled;
        this._bloomEnabled = bloomEnabled;
        this._sunraysEnabled = sunraysEnabled;

        let hash = 0;
        const materialKeywords = [];

        if (shadingEnabled) {
            materialKeywords.push("SHADING");
        }
        if (bloomEnabled) {
            materialKeywords.push("BLOOM");
        }
        if (sunraysEnabled) {
            materialKeywords.push("SUNRAYS");
        }

        materialKeywords.forEach((keyword) => {
            hash += hashCode(keyword);
        });

        let program = this._programs[hash];
        if (!program) {
            const fragment = this.createFragment(displayShaderSource);
            program = createProgram(this.gl, this._vertex, fragment);
            this._programs[hash] = program;
        }

        if (this._current_hash !== hash) {
            this._current_hash = hash;
            this._uniforms = getUniforms(
                this.gl, this._programs[this._current_hash]
            );
        }
    }

    apply(fbo, dye, bloom, sunrays, ditheringTexture, width, height) {
        this.gl.useProgram(this._programs[this._current_hash]);

        if (this._shadingEnabled) {
            this.gl.uniform2f(this._uniforms["texelSize"], 1.0 / width, 1.0 / height);
        }

        this.gl.uniform1i(this._uniforms["uTexture"], dye.read.attach(0));

        if (this._bloomEnabled) {
            this.gl.uniform1i(this._uniforms["uBloom"], bloom.attach(1));
            this.gl.uniform1i(this._uniforms["uDithering"], ditheringTexture.attach(2));
            let scale = getTextureScale(ditheringTexture, width, height);
            this.gl.uniform2f(this._uniforms["ditherScale"], scale.x, scale.y);
        }

        if (this._sunraysEnabled) {
            this.gl.uniform1i(this._uniforms["uSunrays"], sunrays.attach(3));
        }

        blit(fbo);
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
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
        const uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }

    return uniforms;
};


const blit = (gl, destination) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
        gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array([0, 1, 2, 0, 2, 3]),
        gl.STATIC_DRAW
    );

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
};



const correctRadius = (canvas, radius) => {
    const aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) {
        return radius * aspectRatio;
    }
    return radius;
};


const getTextureScale = (texture, width, height) => {
    return {
        x: width / texture.width,
        y: height / texture.height
    };
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
