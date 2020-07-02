import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import LDR_LLL1_0 from "./texture/LDR_LLL1_0.png";
import * as program from "./program.js"
import * as buffer from "./buffer.js"
import * as utility from "./utility.js"


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
    const [state, setState] = React.useState({
        updateTime: Date.now(),
        colorTime: 0.0,
        pointers: []
    });

    const {gl, updateTime, colorTime, pointers} = state;
    const {settings} = props;
    const {
        dyeResolution,
        simResolution,
        // densityDiffusion,
        // velocityDiffusion,
        // pressure,
        // vorticity,
        // splatRadius,
        shadingEnabled,
        colorEnabled,
        // animationPaused,
        bloomEnabled,
        // bloomIntensity,
        // bloomThreshold,
        sunraysEnabled,
        // sunraysWeight
    } = settings;

    // Initialize GL context.
    const onInitiate = React.useCallback(() => {
        const state = initialize(
            canvas, dyeResolution, simResolution,
            shadingEnabled, bloomEnabled, sunraysEnabled,
        );

        setState(prevState => ({...prevState, ...state}));

    }, [
        canvas, dyeResolution, simResolution, shadingEnabled, bloomEnabled,
        sunraysEnabled
    ]);

    // Render scene.
    const onRender = React.useCallback(() => {
        if (!gl)
            return;

        let state = {};
        const now = Date.now();
        const deltaTime = Math.min((now - updateTime) / 1000, 0.016666);

        utility.resizeCanvas(gl.canvas);
        state = updateColors(deltaTime, colorTime, colorEnabled, pointers);

        // setState(prevState => ({...prevState, ...state}));
        //
        // render(gl);

    }, [gl, updateTime, colorTime, pointers, colorEnabled]);

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


const initialize = (
    canvas,
    dyeResolution,
    simResolution,
    shadingEnabled,
    bloomEnabled,
    sunraysEnabled,
) => {
    const {gl, ext} = getContext(canvas);

    const dyeSize = utility.getBufferSize(gl, dyeResolution);
    const simSize = utility.getBufferSize(gl, simResolution);
    const sunraysSize = utility.getBufferSize(gl, 256);
    const bloomSize = utility.getBufferSize(gl, 256);
    const bloomIterations = 8;

    const state = {
        gl: gl,
        ext: ext,
        texture: new buffer.Texture(gl),
        buffers: {
            dye: new buffer.Dye(gl, dyeSize, ext),
            velocity: new buffer.Velocity(gl, simSize, ext),
            divergence: new buffer.Divergence(gl, simSize, ext),
            curl: new buffer.Curl(gl, simSize, ext),
            pressure: new buffer.Pressure(gl, simSize, ext),
            bloom: new buffer.Bloom(gl, bloomSize, ext),
            bloomBuffers: [],
            sunrays: new buffer.Sunrays(gl, sunraysSize, ext),
            sunraysTemp: new buffer.Sunrays(gl, sunraysSize, ext)
        },
        program: {
            splat: new program.Splat(gl),
            copy: new program.Copy(gl),
            curl: new program.Curl(gl),
            vorticity: new program.Vorticity(gl),
            divergence: new program.Divergence(gl),
            clear: new program.Clear(gl),
            pressure: new program.Pressure(gl),
            gradientSubtract: new program.GradientSubtract(gl),
            advection: new program.Advection(gl, ext.supportLinearFiltering),
            bloomPrefilter: new program.BloomPrefilter(gl),
            bloomBlur: new program.BloomBlur(gl),
            bloomFinal: new program.BloomFinal(gl),
            sunraysMask: new program.SunraysMask(gl),
            sunrays: new program.Sunrays(gl),
            blur: new program.Blur(gl),
            color: new program.Color(gl),
            checkerboard: new program.CheckerBoard(gl),
            display: new program.Display(
                gl, shadingEnabled, bloomEnabled, sunraysEnabled
            ),
        },
    };

    for (let i = 0; i < bloomIterations; i++) {
        const width = bloomSize.width >> (i + 1);
        const height = bloomSize.height >> (i + 1);
        if (width < 2 || height < 2)
            break;

        state.buffers.bloomBuffers.push(
            new buffer.Bloom(gl, {width, height}, ext)
        );
    }

    return state;
};


const getContext = (canvas) => {
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


const updateColors = (deltaTime, colorTime, colorEnabled, pointers) => {
    if (!colorEnabled)
        return;

    let _colorTime = colorTime + deltaTime * 10.0;
    if (_colorTime >= 1) {
        _colorTime = utility.wrap(_colorTime, 0, 1);
        pointers.forEach(pointer => {
            pointer.color = utility.generateColor();
        });
    }

    return {
        colorTime: _colorTime,
        pointers,
    }
};


const render = (gl) => {

};
