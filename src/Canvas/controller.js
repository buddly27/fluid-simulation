import * as utility from "./utility.js"
import * as buffer from "./buffer.js"
import * as program from "./program.js"


export class Pointer {

    constructor() {
        this._position = {x: 0, y: 0};
        this._delta = {x: 0, y: 0};
        this._isDown = false;
        this._color = {red: 0, green: 0, blue: 0};
    }

    get position() {
        return this._position;
    }

    get delta() {
        return this._delta;
    }

    get color() {
        return this._color;
    }

    isDown() {
        return this._isDown;
    }

    isMoving() {
        return Math.abs(this._delta.x) > 0 || Math.abs(this._delta.y) > 0;
    }

    resetDelta() {
        this._delta = {x: 0, y: 0};
    }

    setDown(point) {
        this._position = point;
        this._delta = {x: 0, y: 0};
        this._color = utility.generateColor();
        this._isDown = true;
    }

    move(point, ratio) {
        const previousPosition = this._position;
        this._position = point;
        this._delta = {
            x: this._position.x - previousPosition.x,
            y: this._position.y - previousPosition.y,
        };

        if (ratio < 1) { this._delta.x *= ratio; }
        if (ratio > 1) { this._delta.y /= ratio; }
    }

    setUp() {
        this._isDown = false;
    }
}


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
            pressure: new buffer.DoubleFrame(
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
            sunraysTemp: new buffer.Frame(
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

        return buffers;
    }

    update(config) {
        this._program.display.update(
            config.shadingEnabled,
            config.bloomEnabled,
            config.sunraysEnabled
        );

        this._config = config;
    }

    processInput(position, delta, color) {
        const {width, height} = this.gl.canvas;

        this.gl.viewport(0, 0, this._buffer.velocity.width, this._buffer.velocity.height);

        this._program.splat.bind();
        this._program.splat.target = this._buffer.velocity.buffer1.attach(0);
        this._program.splat.ratio = width / height;
        this._program.splat.point = [position.x, position.y];
        this._program.splat.color = [delta.x, delta.y, 0.0];
        this._program.splat.radius = utility.correctRadius(
            this.gl.canvas, this._config.splatRadius / 100.0
        );
        this.blit(this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this.gl.viewport(0, 0, this._buffer.dye.width, this._buffer.dye.height);
        this._program.splat.target = this._buffer.dye.buffer1.attach(0);
        this._program.splat.color = [color.red, color.green, color.blue];
        this.blit(this._buffer.dye.buffer2.object);
        this._buffer.dye.swap();
    }

    processDelta(deltaTime) {
        this.gl.disable(this.gl.BLEND);
        this.gl.viewport(0, 0, this._buffer.velocity.width, this._buffer.velocity.height);

        this._program.curl.bind();
        this._program.curl.texelSize = this._buffer.velocity.texelSize;
        this._program.curl.velocity = this._buffer.velocity.buffer1.attach(0);
        this.blit(this._buffer.curl.object);

        this._program.vorticity.bind();
        this._program.vorticity.texelSize = this._buffer.velocity.texelSize;
        this._program.vorticity.velocity = this._buffer.velocity.buffer1.attach(0);
        this._program.vorticity.curl = this._buffer.curl.attach(1);
        this._program.vorticity.vorticity = this._config.vorticity;
        this._program.vorticity.deltaTime = deltaTime;
        this.blit(this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this._program.divergence.bind();
        this._program.divergence.texelSize = this._buffer.velocity.texelSize;
        this._program.divergence.velocity = this._buffer.velocity.buffer1.attach(0);
        this.blit(this._buffer.divergence.object);

        this._program.clear.bind();
        this._program.clear.texture = this._buffer.pressure.buffer1.attach(0);
        this._program.clear.pressure = this._config.pressure;
        this.blit(this._buffer.pressure.buffer2.object);
        this._buffer.pressure.swap();

        this._program.pressure.bind();
        this._program.pressure.texelSize = this._buffer.velocity.texelSize;
        this._program.pressure.divergence = this._buffer.divergence.attach(0);

        for (let i = 0; i < this._config.pressureIterations; i++) {
            this._program.pressure.pressure = this._buffer.pressure.buffer1.attach(1);
            this.blit(this._buffer.pressure.buffer2.object);
            this._buffer.pressure.swap();
        }

        this._program.gradientSubtract.bind();
        this._program.gradientSubtract.texelSize = this._buffer.velocity.texelSize;
        this._program.gradientSubtract.pressure = this._buffer.pressure.buffer1.attach(0);
        this._program.gradientSubtract.velocity = this._buffer.velocity.buffer1.attach(1);
        this.blit(this._buffer.velocity.buffer2.object);
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
        this.blit(this._buffer.velocity.buffer2.object);
        this._buffer.velocity.swap();

        this.gl.viewport(0, 0, this._buffer.dye.width, this._buffer.dye.height);

        if (!this._ext.supportLinearFiltering) {
            this._program.advection.dyeTexelSize = this._buffer.dye.texelSize;
        }
        this._program.advection.velocity = this._buffer.velocity.buffer1.attach(0);
        this._program.advection.source = this._buffer.dye.buffer1.attach(1);
        this._program.advection.dissipation = this._config.densityDiffusion;
        this.blit(this._buffer.dye.buffer2.object);
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
        this.blit(null);

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
        this.blit(null);
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
        this.blit(this._buffer.bloom.object);

        this._program.bloomBlur.bind();

        let lastBuffer = this._buffer.bloom;

        for (let i = 0; i < this._buffer.bloomBuffers.length; i++) {
            const _buffer = this._buffer.bloomBuffers[i];
            this._program.bloomBlur.texelSize = lastBuffer.texelSize;
            this._program.bloomBlur.texture = lastBuffer.attach(0);
            this.gl.viewport(0, 0, _buffer.width, _buffer.height);
            this.blit(_buffer.object);
            lastBuffer = _buffer;
        }

        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        this.gl.enable(this.gl.BLEND);

        for (let i = this._buffer.bloomBuffers.length - 2; i >= 0; i--) {
            const _buffer = this._buffer.bloomBuffers[i];
            this._program.bloomBlur.texelSize = lastBuffer.texelSize;
            this._program.bloomBlur.texture = lastBuffer.attach(0);
            this.gl.viewport(0, 0, _buffer.width, _buffer.height);
            this.blit(_buffer.object);
            lastBuffer = _buffer;
        }

        this.gl.disable(this.gl.BLEND);

        this._program.bloomFinal.bind();
        this._program.bloomFinal.texelSize = lastBuffer.texelSize;
        this._program.bloomFinal.texture = lastBuffer.attach(0);
        this._program.bloomFinal.intensity = this._config.bloomIntensity;
        this.gl.viewport(0, 0, this._buffer.bloom.width, this._buffer.bloom.height);
        this.blit(this._buffer.bloom.object);
    }

    applySunrays() {
        if (!this._config.sunraysEnabled) {
            return;
        }

        this.gl.disable(this.gl.BLEND);

        this._program.sunraysMask.bind();
        this._program.sunraysMask.texture = this._buffer.dye.buffer1.attach(0);
        this.gl.viewport(0, 0, this._buffer.dye.buffer2.width, this._buffer.dye.buffer2.height);
        this.blit(this._buffer.dye.buffer2.object);

        this._program.sunrays.bind();
        this._program.sunrays.weight = this._config.sunraysWeight;
        this._program.sunrays.texture = this._buffer.dye.buffer2.attach(0);
        this.gl.viewport(0, 0, this._buffer.sunrays.width, this._buffer.sunrays.height);
        this.blit(this._buffer.sunrays.object);

        this._program.blur.bind();
        const iterations = 1;

        for (let i = 0; i < iterations; i++) {
            this._program.blur.texelSize = {
                width: this._buffer.sunrays.texelSize.width,
                height: 0.0
            };
            this._program.blur.texture = this._buffer.sunrays.attach(0);
            this.blit(this._buffer.sunraysTemp.object);

            this._program.blur.texelSize = {
                width: 0.0,
                height: this._buffer.sunrays.texelSize.height
            };
            this._program.blur.texture = this._buffer.sunraysTemp.attach(0);
            this.blit(this._buffer.sunrays.object);
        }
    }

    blit(destination) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
            this.gl.STATIC_DRAW
        );

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array([0, 1, 2, 0, 2, 3]),
            this.gl.STATIC_DRAW
        );

        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
}
