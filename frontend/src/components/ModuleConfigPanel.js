import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Button, Paper, TextField, Typography } from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { updateModuleConfig } from "../actions";

const styles = (theme) => ({
  paper: { padding: theme.spacing(3), marginBottom: theme.spacing(3) },
  field: { marginBottom: theme.spacing(2) },
  help: { marginBottom: theme.spacing(3), color: theme.palette.text.secondary },
  actions: { display: "flex", justifyContent: "flex-end" },
});

class ModuleConfigPanel extends Component {
  state = {
    autoApproveThreshold: 0.90,
    reviewThreshold: 0.60,
    dirty: false,
  };

  componentDidUpdate(prevState) {
    if (this.state.dirty) {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = null;
    }
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value, dirty: true });
  };

  handleSave = () => {
    const { intl } = this.props;
    const { autoApproveThreshold, reviewThreshold } = this.state;
    this.props.updateModuleConfig(
      {
        autoApproveThreshold: Number(autoApproveThreshold),
        reviewThreshold: Number(reviewThreshold),
      },
      formatMessage(intl, "claimlens", "moduleConfig.mutation.update")
    );
    this.setState({ dirty: false });
  };

  render() {
    const { intl, classes, submittingMutation } = this.props;
    const { autoApproveThreshold, reviewThreshold, dirty } = this.state;

    return (
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          {formatMessage(intl, "claimlens", "moduleConfig.title")}
        </Typography>
        <Typography variant="body2" className={classes.help}>
          {formatMessage(intl, "claimlens", "moduleConfig.thresholdHelp")}
        </Typography>
        <TextField
          className={classes.field}
          fullWidth
          label={formatMessage(intl, "claimlens", "moduleConfig.autoApproveThreshold")}
          type="number"
          inputProps={{ min: 0, max: 1, step: 0.01 }}
          value={autoApproveThreshold}
          onChange={this.handleChange("autoApproveThreshold")}
        />
        <TextField
          className={classes.field}
          fullWidth
          label={formatMessage(intl, "claimlens", "moduleConfig.reviewThreshold")}
          type="number"
          inputProps={{ min: 0, max: 1, step: 0.01 }}
          value={reviewThreshold}
          onChange={this.handleChange("reviewThreshold")}
        />
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleSave}
            disabled={!dirty || submittingMutation}
          >
            {formatMessage(intl, "claimlens", "action.save")}
          </Button>
        </div>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  submittingMutation: state.claimlens.submittingMutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ updateModuleConfig }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(ModuleConfigPanel)))
);
