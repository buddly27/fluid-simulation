import * as utility from "./utility.js"
import * as buffer from "./buffer.js"
import * as program from "./program.js"


export class Graph extends utility.ContextMixin {

    constructor(gl, ext, config) {
        super(gl);

        // Record config and GL extensions.
        this._config = config;
        this._ext = ext;

        // Initialize programs and buffers.
        this._program = this.initializePrograms();
        this._buffer = this.initializeBuffers();

        // Initialize dithering texture.
        this._ditheringTexture = new buffer.Texture(gl)
    }

    initializePrograms() {
        return {
            splat: new program.Splat(this.gl),
            copy: new program.Copy(this.gl),
            curl: new program.Curl(this.gl),
            vorticity: new program.Vorticity(this.gl),
            divergence: new program.Divergence(this.gl),
            clear: new program.Clear(this.gl),
            pressure: new program.Pressure(this.gl),
            gradientSubtract: new program.GradientSubtract(this.gl),
            advection: new program.Advection(this.gl, this._ext.supportLinearFiltering),
            bloomPrefilter: new program.BloomPrefilter(this.gl),
            bloomBlur: new program.BloomBlur(this.gl),
            bloomFinal: new program.BloomFinal(this.gl),
            sunraysMask: new program.SunraysMask(this.gl),
            sunrays: new program.Sunrays(this.gl),
            blur: new program.Blur(this.gl),
            color: new program.Color(this.gl),
            display: new program.Display(this.gl, this._config),

        }
    }

    initializeBuffers() {
        const dyeSize = utility.getBufferSize(this.gl, this._config.dyeResolution);
        const simSize = utility.getBufferSize(this.gl, this._config.simResolution);
        const sunraysSize = utility.getBufferSize(this.gl, 256);
        const bloomSize = utility.getBufferSize(this.gl, 256);

        const {halfFloatTexType, formatRGBA, formatRG, formatR} = this._ext;

        const buffers = {
            dye: new buffer.DoubleFrame(
                this.gl, dyeSize, formatRGBA, halfFloatTexType,
                this._ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
            ),
            velocity: new buffer.DoubleFrame(
                this.gl, simSize, formatRG, halfFloatTexType,
                this._ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
            ),
            divergence: new buffer.Frame(
                this.gl, simSize, formatR, halfFloatTexType, this.gl.NEAREST
            ),
            curl: new buffer.Frame(
                this.gl, simSize, formatR, halfFloatTexType, this.gl.NEAREST
            ),
            pressure: new buffer.Frame(
                this.gl, simSize, formatR, halfFloatTexType, this.gl.NEAREST
            ),
            bloom: new buffer.Frame(
                this.gl, bloomSize, formatRGBA, halfFloatTexType,
                this._ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
            ),
            bloomBuffers: [],
            sunrays: new buffer.Frame(
                this.gl, sunraysSize, formatR, halfFloatTexType,
                this._ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
            ),
            sunraysTemp:  new buffer.Frame(
                this.gl, sunraysSize, formatR, halfFloatTexType,
                this._ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
            ),
        };

        for (let i = 0; i < this._config.bloomIterations; i++) {
            const width = bloomSize.width >> (i + 1);
            const height = bloomSize.height >> (i + 1);
            if (width < 2 || height < 2)
                break;

            buffers.bloomBuffers.push(
                new buffer.Frame(
                    this.gl, bloomSize, formatRGBA, halfFloatTexType,
                    this._ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
                )
            );
        }

    }

    update(config) {
        this._program.display.update(
            config.shadingEnabled,
            config.bloomEnabled,
            config.sunraysEnabled
        );

        this._config = config;
    }

    processInput(x, y, dx, dy, color) {
        const {width, height} = this.gl.canvas;

        this.gl.viewport(0, 0, this._buffer.velocity.width, this._buffer.velocity.height);

        this._program.splat.bind();
        this._program.splat.target = this._buffer.velocity.buffer1.attach(0);
        this._program.splat.ratio = width / height;
        this._program.splat.point = [x, y];
        this._program.splat.color = [dx, dy, 0.0];
        this._program.splat.radius = this._config.splatRadius;
        blit(this.gl, this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this.gl.viewport(0, 0, this._buffer.dye.width, this._buffer.dye.height);
        this._program.splat.target = this._buffer.dye.buffer1.attach(0);
        this._program.splat.color = [color.red, color.green, color.blue];
        blit(this.gl, this._buffer.dye.buffer2.object);
        this._buffer.dye.swap();
    }

    processDelta(deltaTime) {
        this.gl.disable(this.gl.BLEND);
        this.gl.viewport(0, 0, this._buffer.velocity.width, this._buffer.velocity.height);

        this._program.curl.bind();
        this._program.curl.texelSize = this._buffer.velocity.texelSize;
        this._program.curl.velocity = this._buffer.velocity.buffer1.attach(0);
        blit(this._buffer.curl.object);

        this._program.vorticity.bind();
        this._program.vorticity.texelSize = this._buffer.velocity.texelSize;
        this._program.vorticity.velocity = this._buffer.velocity.buffer1.attach(0);
        this._program.vorticity.curl = this._buffer.curl.attach(1);
        this._program.vorticity.vorticity = this._config.vorticity;
        this._program.vorticity.deltaTime = deltaTime;
        blit(this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this._program.divergence.bind();
        this._program.divergence.texelSize = this._buffer.velocity.texelSize;
        this._program.divergence.velocity = this._buffer.velocity.buffer1.attach(0);
        blit(this._buffer.divergence.object);

        this._clear.bind();
        this._clear.texture = this._buffer.pressure.buffer1.attach(0);
        this._clear.pressure = this._config.pressure;
        blit(this._buffer.pressure.buffer2.object);
        this._buffer.pressure.swap();

        this._program.pressure.bind();
        this._program.pressure.texelSize = this._buffer.velocity.texelSize;
        this._program.pressure.divergence = this._buffer.divergence.attach(0);

        for (let i = 0; i < this._config.pressureIterations; i++) {
            this._program.pressure.pressure = this._buffer.pressure.buffer1.attach(1);
            blit(this._buffer.pressure.buffer2.object);
            this._buffer.pressure.swap();
        }

        this._program.gradientSubtract.bind();
        this._program.gradientSubtract.texelSize = this._buffer.velocity.texelSize;
        this._program.gradientSubtract.pressure = this._buffer.pressure.buffer1.attach(0);
        this._program.gradientSubtract.velocity = this._buffer.velocity.buffer1.attach(1);
        blit(this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this._program.advection.bind();
        this._program.advection.texelSize = this._buffer.velocity.texelSize;
        if (!this._ext.supportLinearFiltering) {
            this._program.advection.dyeTexelSize = this._buffer.velocity.texelSize;
        }

        this._program.advection.velocity = this._buffer.velocity.buffer1.attach(0);
        this._program.advection.source = this._buffer.velocity.buffer1.attach(0);
        this._program.advection.deltaTime = deltaTime;
        this._program.advection.dissipation = this._config.velocityDiffusion;
        blit(this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this.gl.viewport(0, 0, this._buffer.dye.width, this._buffer.dye.height);

        if (!this._ext.supportLinearFiltering) {
            this._program.advection.dyeTexelSize = this._buffer.dye.texelSize;
        }
        this._program.advection.velocity = this._buffer.velocity.buffer1.attach(0);
        this._program.advection.source = this._buffer.dye.buffer1.attach(1);
        this._program.advection.dissipation = this._config.densityDiffusion;
        blit(this._buffer.dye.buffer2.object);
        this._buffer.dye.swap();
    }

    render() {
        this.applyBloom();
        this.applySunrays();

        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);

        const width = this.gl.drawingBufferWidth;
        const height = this.gl.drawingBufferHeight;
        this.gl.viewport(0, 0, width, height);

        this._program.color.bind();
        this._program.color.color = [0.0, 0.0, 0.0, 1.0];
        blit(null);

        this._program.display.bind();

        if (this._config.shadingEnabled) {
            this._program.display.texelSize = {width, height};
        }

        this._program.display.texture = this._buffer.dye.buffer1.attach(0);

        if (this._config.bloomEnabled) {
            this._program.display.bloom = this._buffer.bloom.attach(1);
            this._program.display.dithering = this._ditheringTexture.attach(2);
            this._program.display.ditherScale = utility.getTextureScale(
                this._ditheringTexture, width, height
            );
        }

        if (this._config.sunraysEnabled) {
            this._program.display.sunrays = this._buffer.sunrays.attach(3);
        }
        blit(null);
    }

    applyBloom() {
        if (!this._config.bloomEnabled || this._buffer.bloomBuffers.length < 2) {
            return;
        }

        const threshold = this._config.bloomThreshold;
        const softKnee = this._config.bloomSoftKnee;
        let knee = threshold * softKnee + 0.0001;

        this.gl.disable(this.gl.BLEND);

        this._program.bloomPrefilter.bind();
        this._program.bloomPrefilter.curves = [
            softKnee - knee, knee * 2, 0.25 / knee
        ];
        this._program.bloomPrefilter.threshold = threshold;
        this._program.bloomPrefilter.texture = this._buffer.dye.buffer1.attach(0);
        this.gl.viewport(0, 0, this._buffer.bloom.width, this._buffer.bloom.height);
        blit(this._buffer.bloom.object);

        this._program.bloomBlur.bind();

        let lastBuffer = this._buffer.bloom;

        for (let i = 0; i < this._buffer.bloomBuffers.length; i++) {
            const _buffer = this._buffer.bloomBuffers[i];
            this._program.bloomBlur.texelSize = lastBuffer.texelSize;
            this._program.bloomBlur.texture = lastBuffer.attach(0);
            this.gl.viewport(0, 0, _buffer.width, _buffer.height);
            blit(_buffer.object);
            lastBuffer = _buffer;
        }

        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        this.gl.enable(this.gl.BLEND);

        for (let i = this._buffer.bloomBuffers.length - 2; i >= 0; i--) {
            const _buffer = this._buffer.bloomBuffers[i];
            this._program.bloomBlur.texelSize = lastBuffer.texelSize;
            this._program.bloomBlur.texture = lastBuffer.attach(0);
            this.gl.viewport(0, 0, _buffer.width, _buffer.height);
            blit(_buffer.object);
            lastBuffer = _buffer;
        }

        this.gl.disable(this.gl.BLEND);

        this._program.bloomFinal.bind();
        this._program.bloomFinal.texelSize = lastBuffer.texelSize;
        this._program.bloomFinal.texture = lastBuffer.attach(0);
        this._program.bloomFinal.intensity = this._config.bloomIntensity;
        this.gl.viewport(0, 0, this._buffer.bloom.width, this._buffer.bloom.height);
        blit(this._buffer.bloom.object);
    }

    applySunrays() {
        if (!this._config.sunraysEnabled) {
            return;
        }

        this.gl.disable(this.gl.BLEND);

        this._program.sunraysMask.bind();
        this._program.sunraysMask.texture = this._buffer.dye.buffer1.attach(0);
        this.gl.viewport(0, 0, this._buffer.dye.buffer2.width, this._buffer.dye.buffer2.height);
        blit(this._buffer.dye.buffer2.object);

        this._program.sunrays.bind();
        this._program.sunrays.weight = this._config.sunraysWeight;
        this._program.sunrays.texture = this._buffer.dye.buffer2.attach(0);
        this.gl.viewport(0, 0, this._buffer.sunrays.width, this._buffer.sunrays.height);
        blit(this._buffer.sunrays.object);

        this._program.blur.bind();
        const iterations = 1;

        for (let i = 0; i < iterations; i++) {
            this._program.blur.texelSize = {
                width: this._buffer.sunrays.texelSize.width,
                height: 0.0
            };
            this._program.blur.texture = this._buffer.sunrays.attach(0);
            blit(this._buffer.sunraysTemp.object);

            this._program.blur.texelSize = {
                width: 0.0,
                height: this._buffer.sunrays.texelSize.height
            };
            this._program.blur.texture = this._buffer.sunraysTemp.attach(0);
            blit(this._buffer.sunrays.object);
        }
    }
}


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
