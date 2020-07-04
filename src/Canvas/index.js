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
        objectFit: "contain",
        "&:focus": {
            outline: "none"
        }
    }
}));


export default function Canvas(props) {
    const classes = useStyles();

    const canvas = React.useRef(null);
    const request = React.useRef(null);
    const graph = React.useRef(null);
    const pointer = React.useRef(new controller.Pointer());
    const config = React.useRef({
        ...props,
        splatForce: 6000,
        bloomIterations: 8,
        pressureIterations: 20,
        bloomSoftKnee: 0.7
    });

    const onMouseDown = (event) => {
        const gl = graph.current.gl;
        const {offsetX, offsetY} = event.nativeEvent;
        const point = utility.getPointerPosition(gl, offsetX, offsetY);
        pointer.current.setDown(point);
    };

    const onMouseMove = (event) => {
        if (!pointer.current.isDown()) {
            return;
        }

        const gl = graph.current.gl;
        const {offsetX, offsetY} = event.nativeEvent;
        const point = utility.getPointerPosition(gl.canvas, offsetX, offsetY);
        const ratio = gl.canvas.width / gl.canvas.height;
        pointer.current.move(point, ratio);
    };

    const onMouseUp = () => {
        pointer.current.setUp();
    };

    const animate = (timestamp) => {
        if (graph.current === null) {
            const {gl, ext} = utility.getContext(canvas);
            graph.current = new controller.Graph(gl, ext, config.current);
        }

        const deltaTime = Math.min(timestamp / 1000, 0.016666);

        if (pointer.current.isDown() && pointer.current.isMoving()) {
            const delta = pointer.current.delta;
            delta.x *= config.splatForce;
            delta.y *= config.splatForce;

            graph.current.processInput(
                pointer.current.position, delta, pointer.current.color
            );
            pointer.resetDelta();
        }

        if (!props.animationPaused) {
            graph.current.processDelta(deltaTime);
        }

        graph.current.render();
        request.current = requestAnimationFrame(animate);
    };

    // Handle rendering.
    React.useEffect(() => {
        request.current = window.requestAnimationFrame(animate);
        return () => window.cancelAnimationFrame(request.current);
    }, []);

    return (
        <canvas
            ref={canvas}
            className={classes.canvas}
            tabIndex="0"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        />
    )
}
