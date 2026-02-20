import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Stepper, Step, StepLabel, Paper, Typography } from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import {
  STATUS_PENDING,
  STATUS_PREPROCESSING,
  STATUS_CLASSIFYING,
  STATUS_EXTRACTING,
  STATUS_COMPLETED,
  STATUS_FAILED,
  STATUS_REVIEW_REQUIRED,
} from "../constants";

const STEPS = [
  STATUS_PENDING,
  STATUS_PREPROCESSING,
  STATUS_CLASSIFYING,
  STATUS_EXTRACTING,
  STATUS_COMPLETED,
];

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(1) },
});

class ProcessingTimeline extends Component {
  getActiveStep() {
    const status = this.props.status ? this.props.status.toLowerCase() : this.props.status;
    if (status === STATUS_FAILED || status === STATUS_REVIEW_REQUIRED) {
      const idx = STEPS.indexOf(STATUS_EXTRACTING);
      return idx >= 0 ? idx : STEPS.length;
    }
    const idx = STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  }

  isError() {
    const status = this.props.status ? this.props.status.toLowerCase() : this.props.status;
    return status === STATUS_FAILED;
  }

  render() {
    const { classes, intl } = this.props;
    const status = this.props.status ? this.props.status.toLowerCase() : this.props.status;
    const activeStep = this.getActiveStep();

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "timeline.title")}
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((step) => {
            const labelProps = {};
            if (step === STATUS_COMPLETED && status === STATUS_FAILED) {
              labelProps.error = true;
            }
            if (step === STATUS_COMPLETED && status === STATUS_REVIEW_REQUIRED) {
              labelProps.optional = (
                <Typography variant="caption" color="error">
                  {formatMessage(intl, "claimlens", "status.review_required")}
                </Typography>
              );
            }
            return (
              <Step key={step}>
                <StepLabel {...labelProps}>
                  {formatMessage(intl, "claimlens", `status.${step}`)}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(ProcessingTimeline));
