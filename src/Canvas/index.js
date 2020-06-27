import React from "react";
import {makeStyles} from "@material-ui/core/styles";


const useStyles = makeStyles(() => ({
    canvas: {
        overflow: "hidden",
        backgroundColor: "#000",
        position: "fixed",
        width: "100%",
        height: "100%",
        marginLeft: props => props.paddingLeft,
        objectFit: "contain",
        "&:focus": {
            outline: "none"
        }
    }
}));


export default function Canvas(props) {
    const classes = useStyles(props);
    const canvas = React.useRef(null);

    return (
        <canvas
            ref={canvas}
            className={classes.canvas}
            tabIndex="0"
        />
    )
}
