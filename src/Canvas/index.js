import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import * as controller from "./controller.js"
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
        graph: null,
        updateTime: Date.now(),
        colorTime: 0.0,
        pointers: []
    });

    const {gl, graph, updateTime, colorTime, pointers} = state;
    const {settings} = props;

    // Initialize GL context.
    const onInitiate = React.useCallback(() => {
        const {gl, ext} = utility.getContext(canvas);
        const config = {
            ...settings,
            bloomIterations: 8,
            pressureIterations: 20,
            bloomSoftKnee: 0.7
        };

        const graph = new controller.Graph(gl, ext, config);

        setState(prevState => ({...prevState, graph}));

    }, [canvas, settings]);

    // Render scene.
    const onRender = React.useCallback(() => {
        if (!gl || !graph)
            return;



        // setState(prevState => ({...prevState, ...state}));
        //
        // render(gl);

    }, [gl, graph, updateTime, colorTime, pointers]);

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


const render = (gl, updateTime, colorTime, colorEnabled, pointers) => {

    // const now = Date.now();
    // const deltaTime = Math.min((now - updateTime) / 1000, 0.016666);
    //
    // utility.resizeCanvas(gl.canvas);
    // const state = updateColors(deltaTime, colorTime, colorEnabled, pointers);

};


const computeDeltaTime = (updateTime) => {
    const now = Date.now();
    return Math.min((now - updateTime) / 1000, 0.016666);
};


const updateColors = (deltaTime, colorTime, colorEnabled, pointers) => {
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


const applyInputs = (
    splatStack,
    pointers,
    program,
    buffers,
    splatRadius,
    splatForce
) => {
    if (splatStack.length > 0) {
        const amount = splatStack.pop();
        for (let i = 0; i < amount; i++) {
            const color = utility.generateColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            const x = Math.random();
            const y = Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            program.splat.apply(
                buffers.dye, buffers.velocity, splatRadius,
                x, y, dx, dy, color
            );
        }
    }

    pointers.forEach(pointer => {
        if (pointer.moved) {
            pointer.moved = false;
            let dx = pointer.deltaX * splatForce;
            let dy = pointer.deltaY * splatForce;
            program.splat.apply(
                buffers.dye, buffers.velocity, splatRadius,
                pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color
            );
        }
    });
};
