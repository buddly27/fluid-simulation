import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import baseVertexShader from "./shader/base.vert";
import blurVertexShader from "./shader/blur.vert";
import blurShader from "./shader/blur.frag";
import copyShader from "./shader/copy.frag";
import clearShader from "./shader/clear.frag";
import colorShader from "./shader/color.frag";
import checkerboardShader from "./shader/checkerboard.frag";
import bloomPrefilterShader from "./shader/bloom_prefilter.frag";
import bloomBlurShader from "./shader/bloom_blur.frag";
import bloomFinalShader from "./shader/bloom_final.frag";
import sunraysMaskShader from "./shader/sunrays_mask.frag";
import sunraysShader from "./shader/sunrays.frag";
import splatShader from "./shader/splat.frag";
import advectionShader from "./shader/advection.frag";
import divergenceShader from "./shader/divergence.frag";
import curlShader from "./shader/curl.frag";
import vorticityShader from "./shader/vorticity.frag";
import pressureShader from "./shader/pressure.frag";
import gradientSubtractShader from "./shader/gradient_substract.frag";
import displayShaderSource from "./shader/display.frag";
import LDR_LLL1_0 from "./texture/LDR_LLL1_0.png";


const useStyles = makeStyles(() => ({
    canvas: {
        overflow: "hidden",
        backgroundColor: "#000",
        position: "fixed",
        width: "100%",
        height: "100%",
        objectFit: "contain",
        "&:focus": {
            outline: "none"
        }
    }
}));


export default function Canvas(props) {
    const classes = useStyles();

    const canvas = React.useRef(null);
    const [state, setState] = React.useState({});

    const {gl} = state;
    const {settings} = props;
    const {
        dyeResolution,
        simResolution,
        // densityDiffusion,
        // velocityDiffusion,
        // pressure,
        // vorticity,
        // splatRadius,
        // shadingEnabled,
        // colorEnabled,
        // animationPaused,
        // bloomEnabled,
        // bloomIntensity,
        // bloomThreshold,
        // sunraysEnabled,
        // sunraysWeight
    } = settings;

    // Initialize GL context.
    const onInitiate = React.useCallback(() => {
        const state = initialize(canvas, dyeResolution, simResolution);
        setState(prevState => ({...prevState, ...state}));

    }, [canvas, dyeResolution, simResolution]);

    // Render scene.
    const onRender = React.useCallback(() => {
        if (!gl)
            return;

        render(gl);

    }, [gl]);

    // Handle resizing event.
    React.useEffect(() => {
        window.addEventListener("resize", onRender);
        return () => window.removeEventListener("resize", onRender);
    }, [onRender]);

    // Handle state initialization.
    React.useEffect(() => onInitiate(), [canvas, onInitiate]);

    // Handle rendering.
    React.useEffect(() => onRender(), [gl, onRender]);

    return (
        <canvas
            ref={canvas}
            className={classes.canvas}
            tabIndex="0"
        />
    )
}


const initialize = (canvas, dyeResolution, simResolution) => {
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
    } else {
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
    } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    const ext = {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering
    };

    const shaders = initializeShaders(gl, supportLinearFiltering);
    const texture = createTextureAsync(gl);
    const buffers = initFrameBuffers(gl, dyeResolution, simResolution, ext);

    return {
        gl: gl,
        ext: ext,
        shaders: shaders,
        texture: texture,
        buffers: buffers
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


const initializeShaders = (gl, supportLinearFiltering) => {
    let program;
    const shaders = {};

    program = createProgram(gl, blurVertexShader, blurShader);
    shaders.blur = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, copyShader);
    shaders.copy = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, clearShader);
    shaders.clear = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, colorShader);
    shaders.color = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, checkerboardShader);
    shaders.checkerboard = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, bloomPrefilterShader);
    shaders.bloomPrefilter = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, bloomBlurShader);
    shaders.bloomBlur = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, bloomFinalShader);
    shaders.bloomFinal = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, sunraysMaskShader);
    shaders.sunraysMask = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, sunraysShader);
    shaders.sunrays = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, splatShader);
    shaders.splat = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(
        gl, baseVertexShader, advectionShader,
        supportLinearFiltering ? null : ["MANUAL_FILTERING"]
    );
    shaders.advection = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, divergenceShader);
    shaders.divergence = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, curlShader);
    shaders.curl = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, vorticityShader);
    shaders.vorticity = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, pressureShader);
    shaders.pressure = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(gl, baseVertexShader, gradientSubtractShader);
    shaders.gradientSubtract = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    program = createProgram(
        gl, baseVertexShader, displayShaderSource,
        ["SHADING", "BLOOM", "SUNRAYS"]
    );
    shaders.display = {
        program: program,
        uniforms: getUniforms(gl, program)
    };

    return shaders;
};


const createProgram = (gl, vsSource, fsSource, keywords = null) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource, keywords);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource, keywords);

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


const createTextureAsync = (gl) => {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255])
    );

    const obj = {
        texture,
        width: 1,
        height: 1,
        attach(id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };

    let image = new Image();
    image.onload = () => {
        obj.width = image.width;
        obj.height = image.height;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    };
    image.src = LDR_LLL1_0;

    return obj;
};


const initFrameBuffers = (gl, dyeResolution, simResolution, ext) => {
    const _dyeResolution = getResolution(gl, dyeResolution);
    const _simResolution = getResolution(gl, simResolution);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    const buffers = {};

    buffers.dye = createDoubleFBO(
        gl,
        _dyeResolution.width,
        _dyeResolution.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
    );

    buffers.velocity = createDoubleFBO(
        gl,
        _simResolution.width,
        _simResolution.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
    );

    buffers.divergence = createFBO(
        gl,
        _simResolution.width,
        _simResolution.height,
        r.internalFormat,
        r.format,
        texType,
        gl.NEAREST
    );

    buffers.curl = createFBO(
        gl,
        _simResolution.width,
        _simResolution.height,
        r.internalFormat,
        r.format,
        texType,
        gl.NEAREST
    );

    buffers.pressure = createDoubleFBO(
        gl,
        _simResolution.width,
        _simResolution.height,
        r.internalFormat,
        r.format,
        texType,
        gl.NEAREST
    );

    const bloomBuffers = initBloomFrameBuffers(gl, ext);
    const sunraysBuffers = initSunraysFrameBuffers(gl, ext);
    return {...buffers, ...bloomBuffers, ...sunraysBuffers};
};


const initBloomFrameBuffers = (gl, ext) => {
    const resolution = getResolution(256);
    const iterations = 8;

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    const buffers = {};

    buffers.bloom = createFBO(
        gl,
        resolution.width,
        resolution.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
    );

    buffers.bloomFramebuffers = [];
    buffers.bloomFramebuffers.length = 0;

    for (let i = 0; i < iterations; i++) {
        const width = resolution.width >> (i + 1);
        const height = resolution.height >> (i + 1);

        if (width < 2 || height < 2)
            break;

        const fbo = createFBO(
            gl,
            width,
            height,
            rgba.internalFormat,
            rgba.format,
            texType,
            filtering
        );

        buffers.bloomFramebuffers.push(fbo);
    }

    return buffers
};


const initSunraysFrameBuffers = (gl, ext) => {
    const resolution = getResolution(196);

    const texType = ext.halfFloatTexType;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    const buffers = {};

    buffers.sunrays = createFBO(
        gl,
        resolution.width,
        resolution.height,
        r.internalFormat,
        r.format,
        texType,
        filtering
    );

    buffers.sunraysTemp = createFBO(
        gl,
        resolution.width,
        resolution.height,
        r.internalFormat,
        r.format,
        texType,
        filtering
    );

    return buffers
};


const render = (gl) => {
    resize(gl.canvas);
};


const resize = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
};


function getResolution(gl, resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1)
        aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
        return {width: max, height: min};
    }

    return {width: min, height: max};
}


const createFBO = (gl, width, height, internalFormat, format, type, param) => {
    gl.activeTexture(gl.TEXTURE0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null
    );

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
    );

    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const texelSizeX = 1.0 / width;
    const texelSizeY = 1.0 / height;

    return {
        texture,
        fbo,
        width: width,
        height: height,
        texelSizeX,
        texelSizeY,
        attach(id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
};


const createDoubleFBO = (gl, width, height, internalFormat, format, type, param) => {
    let fbo1 = createFBO(gl, width, height, internalFormat, format, type, param);
    let fbo2 = createFBO(gl, width, height, internalFormat, format, type, param);

    return {
        width: width,
        height: height,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
            return fbo1;
        },
        set read(value) {
            fbo1 = value;
        },
        get write() {
            return fbo2;
        },
        set write(value) {
            fbo2 = value;
        },
        swap() {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
};
