import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import PlayIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import Canvas from "../Canvas/index.js";
import AppDrawer from "../AppDrawer/index.js";


const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
}));


export default function App() {
    const classes = useStyles();

    const [state, setState] = React.useState({
        drawerOpened: false,
        dyeResolution: 1024,
        simResolution: 128,
        densityDiffusion: 1.0,
        velocityDiffusion: 0.2,
        pressure: 0.8,
        pressureIterations: 20,
        vorticity: 30.0,
        splatRadius: 0.25,
        splatForce: 6000,
        shadingEnabled: true,
        animationPaused: false,
        bloomEnabled: true,
        bloomIterations: 8,
        bloomIntensity: 0.8,
        bloomThreshold: 0.6,
        bloomSoftKnee: 0.7,
        sunraysEnabled: true,
        sunraysWeight: 1
    });

    const {drawerOpened, animationPaused} = state;

    return (
        <div>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={
                            () =>
                                setState(prevState => ({
                                    ...prevState, drawerOpened: !drawerOpened
                                }))
                        }
                        edge="start"
                    >
                        <MenuIcon/>
                    </IconButton>

                    <Typography variant="h6" className={classes.title}>
                        Fluid Simulation
                    </Typography>

                    <IconButton
                        color="inherit"
                        onClick={
                            () =>
                                setState(prevState => ({
                                    ...prevState, animationPaused: !animationPaused
                                }))
                        }
                    >
                        {
                            (animationPaused) ? <PlayIcon /> : <PauseIcon />
                        }

                    </IconButton>
                </Toolbar>
            </AppBar>

            <AppDrawer
                open={drawerOpened}
                {...state}
                onSettingChange={
                    (key, value) =>
                        setState(prevState => ({...prevState, [key]: value}))
                }
            />

            <Canvas {...state} />
        </div>
    );
}

