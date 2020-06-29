import React from "react";
import ReactDOM from "react-dom";
import {createMuiTheme} from "@material-ui/core/styles";
import {ThemeProvider} from "@material-ui/styles";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";


const theme = createMuiTheme({
    typography: {
        fontSize: 12,
    },
    palette: {
        type: "dark",
        primary: {
            main: "#212121"
        },
        secondary: {
            main: "#b58800"
        }
    },
    zIndex: {
        appBar: 2000
    }
});


ReactDOM.render(
    <ThemeProvider theme={theme}>
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    </ThemeProvider>,
    document.getElementById("root")
);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
