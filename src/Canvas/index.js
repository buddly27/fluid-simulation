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
    const requestRef = React.useRef(null);
    const graphRef = React.useRef(null);
    const pointerRef = React.useRef(null);

    // Fetch mutable elements from references.
    const fetchCanvas = () => canvasRef.current;
    const fetchPointer = () => {
        if (pointerRef.current === null) {
            pointerRef.current = new controller.Pointer();
        }
        return pointerRef.current;
    };
    const fetchGraph = () => {
        const canvas = fetchCanvas();

        if (graphRef.current === null) {
            const {gl, ext} = utility.getContext(canvas);
            graphRef.current = new controller.Graph(gl, ext, props);
            utility.resizeCanvas(canvas);
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
        const pointer = fetchPointer();
        const graph = fetchGraph();

        const deltaTime = Math.min(timestamp / 1000, 0.016666);

        if (pointer.isDown() && pointer.isMoving()) {
            const delta = pointer.delta;
            delta.x *= props.splatForce || 6000;
            delta.y *= props.splatForce || 6000;

            graph.processInput(pointer.position, delta, pointer.color);
            pointer.resetDelta();
        }

        if (!props.animationPaused) {
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
