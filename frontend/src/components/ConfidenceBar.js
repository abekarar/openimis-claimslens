import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { CircularProgress, Typography, Box } from "@material-ui/core";
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from "../constants";

const styles = () => ({
  root: {
    position: "relative",
    display: "inline-flex",
    width: 48,
    height: 48,
  },
  circle: { position: "absolute", top: 0, left: 0 },
  bgCircle: { position: "absolute", top: 0, left: 0, color: "#e0e0e0" },
  labelContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: "0.7rem", fontWeight: "bold" },
  high: { color: "#4caf50" },
  medium: { color: "#ff9800" },
  low: { color: "#f44336" },
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
        <CircularProgress
          variant="determinate"
          value={100}
          size={48}
          thickness={4}
          className={classes.bgCircle}
        />
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={48}
          thickness={4}
          className={`${classes.circle} ${colorClass}`}
        />
        <Box className={classes.labelContainer}>
          <Typography className={`${classes.label} ${colorClass}`}>
            {percentage}%
          </Typography>
        </Box>
      </Box>
    );
  }
}

export default withStyles(styles)(ConfidenceBar);
