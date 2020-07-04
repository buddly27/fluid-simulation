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
        width: 300,
        flexShrink: 0,
    },
    drawerPaper: {
        width: 300,
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
    const {open, settings, onSettingChange} = props;
    const {
        dyeResolution,
        simResolution,
        densityDiffusion,
        velocityDiffusion,
        pressure,
        vorticity,
        splatRadius,
        shadingEnabled,
        bloomEnabled,
        bloomIntensity,
        bloomThreshold,
        sunraysEnabled,
        sunraysWeight
    } = settings;

    return (
        <Drawer
            className={classes.drawer}
            classes={{paper: classes.drawerPaper}}
            variant="persistent"
            open={open}
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
                                    value={dyeResolution}
                                    onChange={
                                        (event) => onSettingChange(
                                            "dyeResolution", event.target.value
                                        )
                                    }
                                >
                                    <option value={1024}>High</option>
                                    <option value={512}>Medium</option>
                                    <option value={256}>Low</option>
                                    <option value={128}>Very Low</option>
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
                                    value={simResolution}
                                    onChange={
                                        (event) => onSettingChange(
                                            "simResolution", event.target.value
                                        )
                                    }

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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "densityDiffusion", value
                                        )
                                    }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "velocityDiffusion", value
                                        )
                                    }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "pressure", value
                                        )
                                    }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "vorticity", value
                                        )
                                    }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "splatRadius", value
                                        )
                                    }
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
                                            checked={shadingEnabled}
                                            onChange={
                                                (event) => onSettingChange(
                                                    "shadingEnabled",
                                                    event.target.checked
                                                )
                                            }
                                            name="shading"
                                        />
                                    }
                                    label="Shading"
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
                                            onChange={
                                                (event) => onSettingChange(
                                                    "bloomEnabled",
                                                    event.target.checked
                                                )
                                            }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "bloomIntensity", value
                                        )
                                    }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "bloomThreshold", value
                                        )
                                    }
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
                                            onChange={
                                                (event) => onSettingChange(
                                                    "sunraysEnabled",
                                                    event.target.checked
                                                )
                                            }
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
                                    onChange={
                                        (_, value) => onSettingChange(
                                            "sunraysWeight", value
                                        )
                                    }
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
