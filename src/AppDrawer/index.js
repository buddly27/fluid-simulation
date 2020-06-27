import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Toolbar from "@material-ui/core/Toolbar";
import FormControl from "@material-ui/core/FormControl";


const useStyles = makeStyles((theme) => ({
    drawer: {
        width: props => props.width,
        flexShrink: 0,
    },
    drawerPaper: {
        width: props => props.width,
    },
    formControl: {
        margin: theme.spacing(2),
    }
}));


export default function AppDrawer(props) {
    const classes = useStyles(props);

    return (
        <Drawer
            className={classes.drawer}
            classes={{paper: classes.drawerPaper}}
            variant="permanent"
            open
        >
            <Toolbar/>

            <FormControl
                component="fieldset"
                className={classes.formControl}
            >

            </FormControl>
        </Drawer>
    );
}
