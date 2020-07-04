import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Canvas from "../Canvas/index.js";
import AppDrawer from "../AppDrawer/index.js";


export default function App() {
    const [state, setState] = React.useState({
        drawerOpened: false,
        dyeResolution: 1024,
        simResolution: 128,
        densityDiffusion: 1.0,
        velocityDiffusion: 0.2,
        pressure: 0.8,
        vorticity: 30.0,
        splatRadius: 0.25,
        shadingEnabled: true,
        colorEnabled: true,
        animationPaused: false,
        bloomEnabled: true,
        bloomIntensity: 0.8,
        bloomThreshold: 0.6,
        sunraysEnabled: true,
        sunraysWeight: 1
    });

    const {
        drawerOpened,
        dyeResolution,
        simResolution,
        densityDiffusion,
        velocityDiffusion,
        pressure,
        vorticity,
        splatRadius,
        shadingEnabled,
        colorEnabled,
        animationPaused,
        bloomEnabled,
        bloomIntensity,
        bloomThreshold,
        sunraysEnabled,
        sunraysWeight,

    } = state;

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

                    <Typography variant="h6" noWrap>
                        Fluid Simulation
                    </Typography>
                </Toolbar>
            </AppBar>

            <AppDrawer
                open={drawerOpened}
                settings={state}
                onSettingChange={
                    (key, value) =>
                        setState(prevState => ({...prevState, [key]: value}))
                }
            />

            <Canvas
                dyeResolution={dyeResolution}
                simResolution={simResolution}
                densityDiffusion={densityDiffusion}
                velocityDiffusion={velocityDiffusion}
                pressure={pressure}
                vorticity={vorticity}
                splatRadius={splatRadius}
                shadingEnabled={shadingEnabled}
                colorEnabled={colorEnabled}
                animationPaused={animationPaused}
                bloomEnabled={bloomEnabled}
                bloomIntensity={bloomIntensity}
                bloomThreshold={bloomThreshold}
                sunraysEnabled={sunraysEnabled}
                sunraysWeight={sunraysWeight}
            />
        </div>
    );
}

