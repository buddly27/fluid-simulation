/* eslint-disable react-hooks/exhaustive-deps */

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
        "&:focus": {
            outline: "none"
        }
    }
}));


export default function Canvas(props) {
    const classes = useStyles();

    const canvasRef = React.useRef(null);
    const configRef = React.useRef(props);
    const requestRef = React.useRef(null);
    const graphRef = React.useRef(null);
    const pointerRef = React.useRef(null);

    // Fetch mutable elements from references.
    const fetchCanvas = () => canvasRef.current;
    const fetchConfig = () => configRef.current;
    const fetchPointer = () => {
        if (pointerRef.current === null) {
            pointerRef.current = new controller.Pointer();
        }
        return pointerRef.current;
    };
    const fetchGraph = () => {
        const canvas = fetchCanvas();
        const config = fetchConfig();

        if (graphRef.current === null) {
            const {gl, ext} = utility.getContext(canvas);
            graphRef.current = new controller.Graph(gl, ext, config);
        }

        return graphRef.current;
    };

    // Deal with mouse events.
    const onMouseDown = (event) => {
        const pointer = fetchPointer();
        const canvas = fetchCanvas();

        const {offsetX, offsetY} = event.nativeEvent;
        const point = utility.getPointerPosition(canvas, offsetX, offsetY);
        pointer.setDown(point);
    };

    const onMouseMove = (event) => {
        const pointer = fetchPointer();
        const canvas = fetchCanvas();

        if (!pointer.isDown()) {
            return;
        }

        const {offsetX, offsetY} = event.nativeEvent;
        const point = utility.getPointerPosition(canvas, offsetX, offsetY);
        const ratio = canvas.width / canvas.height;
        pointer.move(point, ratio);
    };

    const onMouseUp = () => {
        const pointer = fetchPointer();
        pointer.setUp();
    };

    // Deal with animated frames.
    const animate = (timestamp) => {
        const canvas = fetchCanvas();
        const config = fetchConfig();
        const pointer = fetchPointer();
        const graph = fetchGraph();

        if (utility.resizeCanvas(canvas)) {
            graph.resize();
        }

        if (pointer.isDown() && pointer.isMoving()) {
            const delta = pointer.delta;
            delta.x *= config.splatForce || 6000;
            delta.y *= config.splatForce || 6000;

            graph.processInput(pointer.position, delta, pointer.color);
            pointer.resetDelta();
        }

        if (!config.animationPaused) {
            const deltaTime = Math.min(timestamp / 1000, 0.016666);
            graph.processDelta(deltaTime);
        }

        graph.render();
        requestRef.current = requestAnimationFrame(animate);
    };

    // Handle rendering.
    React.useEffect(() => {
        requestRef.current = window.requestAnimationFrame(animate);
        return () => window.cancelAnimationFrame(requestRef.current);
    }, []);

     // Handle props update.
    React.useEffect(() => {
        configRef.current = props;
        const graph = fetchGraph();
        graph.update(configRef.current);

    }, [props]);

    return (
        <canvas
            ref={canvasRef}
            className={classes.canvas}
            tabIndex="0"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
        />
    )
}
