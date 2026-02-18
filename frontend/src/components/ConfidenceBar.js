import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { LinearProgress, Typography, Box } from "@material-ui/core";
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from "../constants";

const styles = (theme) => ({
  root: { display: "flex", alignItems: "center", width: "100%" },
  bar: { flexGrow: 1, marginRight: theme.spacing(1) },
  label: { minWidth: 45, textAlign: "right" },
  high: { "& .MuiLinearProgress-bar": { backgroundColor: "#4caf50" } },
  medium: { "& .MuiLinearProgress-bar": { backgroundColor: "#ff9800" } },
  low: { "& .MuiLinearProgress-bar": { backgroundColor: "#f44336" } },
});

class ConfidenceBar extends Component {
  render() {
    const { classes, value } = this.props;
    const percentage = Math.round((value || 0) * 100);
    let colorClass = classes.low;
    if (value >= CONFIDENCE_HIGH) colorClass = classes.high;
    else if (value >= CONFIDENCE_MEDIUM) colorClass = classes.medium;

    return (
      <Box className={classes.root}>
        <Box className={classes.bar}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            className={colorClass}
          />
        </Box>
        <Box className={classes.label}>
          <Typography variant="body2" color="textSecondary">
            {percentage}%
          </Typography>
        </Box>
      </Box>
    );
  }
}

export default withStyles(styles)(ConfidenceBar);
