import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import Canvas from "../Canvas/index.js";
import AppDrawer from "../AppDrawer/index.js";


export default function App() {

    const drawerWidth = 300;

    return (
        <div>
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        Fluid Simulation
                    </Typography>
                </Toolbar>
            </AppBar>
            <AppDrawer width={drawerWidth} />
            <Canvas paddingLeft={drawerWidth} />
        </div>
    );
}

