import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Toolbar from "@material-ui/core/Toolbar";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Slider from "@material-ui/core/Slider";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import NativeSelect from "@material-ui/core/NativeSelect";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";


const useStyles = makeStyles((theme) => ({
    drawer: {
        width: props => props.width,
        flexShrink: 0,
    },
    drawerPaper: {
        width: props => props.width,
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular
    },
    formControl: {
        margin: theme.spacing(1),
    }
}));


export default function AppDrawer(props) {
    const classes = useStyles(props);
    const {
        quality,
        resolution,
        densityDiffusion,
        velocityDiffusion,
        pressure,
        vorticity,
        splatRadius,
        shading,
        colorful,
        paused,
        bloomEnabled,
        bloomIntensity,
        bloomThreshold,
        sunraysEnabled,
        sunraysWeight
    } = props;

    return (
        <Drawer
            className={classes.drawer}
            classes={{paper: classes.drawerPaper}}
            variant="permanent"
            open
        >
            <Toolbar/>

            <div>
                <ExpansionPanel defaultExpanded>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography className={classes.heading}>
                            General Settings
                        </Typography>
                    </ExpansionPanelSummary>

                    <ExpansionPanelDetails>
                        <FormControl fullWidth>
                            <FormControl className={classes.formControl}>
                                <InputLabel
                                    htmlFor="quality">Quality</InputLabel>
                                <NativeSelect
                                    name="quality"
                                    inputProps={{
                                        name: "quality",
                                        id: "quality",
                                    }}
                                    value={quality}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                    <option value="very-low">Very Low</option>
                                </NativeSelect>
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <InputLabel htmlFor="sim-resolution">
                                    Sim Resolution
                                </InputLabel>
                                <NativeSelect
                                    name="sim-resolution"
                                    inputProps={{
                                        name: "sim-resolution",
                                        id: "sim-resolution",
                                    }}
                                    value={resolution}
                                >
                                    <option value={32}>32</option>
                                    <option value={64}>64</option>
                                    <option value={128}>128</option>
                                    <option value={256}>256</option>
                                </NativeSelect>
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="density-diffusion" gutterBottom>
                                    Density Diffusion
                                </Typography>
                                <Slider
                                    value={densityDiffusion}
                                    min={0}
                                    step={0.1}
                                    max={4}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="density-diffusion"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography
                                    id="velocity-diffusion"
                                    gutterBottom
                                >
                                    Velocity Diffusion
                                </Typography>
                                <Slider
                                    value={velocityDiffusion}
                                    min={0}
                                    step={0.1}
                                    max={4}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="velocity-diffusion"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="pressure" gutterBottom>
                                    Pressure
                                </Typography>
                                <Slider
                                    value={pressure}
                                    min={0}
                                    step={0.1}
                                    max={1}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="pressure"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="vorticity" gutterBottom>
                                    Vorticity
                                </Typography>
                                <Slider
                                    value={vorticity}
                                    min={0}
                                    step={1}
                                    max={50}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="vorticity"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="splat-radius" gutterBottom>
                                    Splat Radius
                                </Typography>
                                <Slider
                                    value={splatRadius}
                                    min={0.01}
                                    step={0.1}
                                    max={1}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="splat-radius"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={shading}
                                            name="shading"
                                        />
                                    }
                                    label="Shading"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={colorful}
                                            name="colorful"
                                        />
                                    }
                                    label="Colorful"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={paused}
                                            name="paused"
                                        />
                                    }
                                    label="Paused"
                                />
                            </FormControl>
                        </FormControl>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography className={classes.heading}>
                            Bloom
                        </Typography>
                    </ExpansionPanelSummary>

                    <ExpansionPanelDetails>
                        <FormControl fullWidth>
                            <FormControl className={classes.formControl}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={bloomEnabled}
                                            name="bloom-enabled"
                                        />
                                    }
                                    label="Enabled"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="bloom-intensity" gutterBottom>
                                    Intensity
                                </Typography>
                                <Slider
                                    value={bloomIntensity}
                                    min={0.1}
                                    step={0.1}
                                    max={2.0}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="bloom-intensity"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="bloom-threshold" gutterBottom>
                                    Threshold
                                </Typography>
                                <Slider
                                    value={bloomThreshold}
                                    min={0}
                                    step={0.1}
                                    max={1.0}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="bloom-threshold"
                                />
                            </FormControl>
                        </FormControl>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                <ExpansionPanel>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography className={classes.heading}>
                            Sunrays
                        </Typography>
                    </ExpansionPanelSummary>

                    <ExpansionPanelDetails>
                        <FormControl fullWidth>
                            <FormControl className={classes.formControl}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={sunraysEnabled}
                                            name="sunrays-enabled"
                                        />
                                    }
                                    label="Enabled"
                                />
                            </FormControl>

                            <FormControl className={classes.formControl}>
                                <Typography id="sunrays-weight" gutterBottom>
                                    Weight
                                </Typography>
                                <Slider
                                    value={sunraysWeight}
                                    min={0.3}
                                    step={0.1}
                                    max={2.0}
                                    valueLabelDisplay="auto"
                                    aria-labelledby="sunrays-weight"
                                />
                            </FormControl>
                        </FormControl>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

            </div>
        </Drawer>
    );
}
