import React from "react";
import {createMuiTheme} from "@material-ui/core/styles";
import {ThemeProvider} from "@material-ui/styles";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import Canvas from "../Canvas/index.js";
import AppDrawer from "../AppDrawer/index.js";


const theme = createMuiTheme({
    palette: {
        type: "dark",
        primary: {
            main: "#212121"
        },
        secondary: {
            main: "#4E342E"
        }
    },
    zIndex: {
        appBar: 2000
    }
});


export default function App() {

    const drawerWidth = 300;

    return (
        <ThemeProvider theme={theme}>
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        Fluid Simulation
                    </Typography>
                </Toolbar>
            </AppBar>
            <AppDrawer width={drawerWidth} />
            <Canvas paddingLeft={drawerWidth} />
        </ThemeProvider>
    );
}

