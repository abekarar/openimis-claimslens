import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button,
  CircularProgress,
  Paper,
  Slider,
  Typography,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { fetchRoutingPolicy, updateRoutingPolicy } from "../actions";

const styles = (theme) => ({
  paper: { padding: theme.spacing(3), marginBottom: theme.spacing(3) },
  sliderRow: { marginBottom: theme.spacing(3) },
  sliderLabel: { marginBottom: theme.spacing(1) },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  },
  actions: { display: "flex", justifyContent: "flex-end" },
});

class RoutingPolicyPanel extends Component {
  state = {
    accuracyWeight: 0.5,
    costWeight: 0.25,
    speedWeight: 0.25,
    dirty: false,
  };

  componentDidMount() {
    this.props.fetchRoutingPolicy(this.props.modulesManager);
  }

  componentDidUpdate(prevProps) {
    if (this.props.routingPolicy && !prevProps.routingPolicy) {
      const { routingPolicy } = this.props;
      this.setState({
        accuracyWeight: routingPolicy.accuracyWeight != null ? routingPolicy.accuracyWeight : 0.5,
        costWeight: routingPolicy.costWeight != null ? routingPolicy.costWeight : 0.25,
        speedWeight: routingPolicy.speedWeight != null ? routingPolicy.speedWeight : 0.25,
        dirty: false,
      });
    }
  }

  handleSliderChange = (field) => (e, value) => {
    this.setState({ [field]: value, dirty: true });
  };

  handleSave = () => {
    const { intl } = this.props;
    const { accuracyWeight, costWeight, speedWeight } = this.state;
    this.props.updateRoutingPolicy(
      { accuracyWeight, costWeight, speedWeight },
      formatMessage(intl, "claimlens", "routingPolicy.mutation.update")
    );
    this.setState({ dirty: false });
  };

  render() {
    const { intl, classes, fetchingRoutingPolicy, submittingMutation } = this.props;
    const { accuracyWeight, costWeight, speedWeight, dirty } = this.state;

    if (fetchingRoutingPolicy) {
      return <CircularProgress />;
    }

    const total = Math.round((accuracyWeight + costWeight + speedWeight) * 100) / 100;

    return (
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          {formatMessage(intl, "claimlens", "routingPolicy.title")}
        </Typography>

        <div className={classes.sliderRow}>
          <Typography className={classes.sliderLabel}>
            {formatMessage(intl, "claimlens", "routingPolicy.accuracyWeight")}: {accuracyWeight}
          </Typography>
          <Slider
            value={accuracyWeight}
            onChange={this.handleSliderChange("accuracyWeight")}
            min={0}
            max={1}
            step={0.05}
            valueLabelDisplay="auto"
          />
        </div>

        <div className={classes.sliderRow}>
          <Typography className={classes.sliderLabel}>
            {formatMessage(intl, "claimlens", "routingPolicy.costWeight")}: {costWeight}
          </Typography>
          <Slider
            value={costWeight}
            onChange={this.handleSliderChange("costWeight")}
            min={0}
            max={1}
            step={0.05}
            valueLabelDisplay="auto"
          />
        </div>

        <div className={classes.sliderRow}>
          <Typography className={classes.sliderLabel}>
            {formatMessage(intl, "claimlens", "routingPolicy.speedWeight")}: {speedWeight}
          </Typography>
          <Slider
            value={speedWeight}
            onChange={this.handleSliderChange("speedWeight")}
            min={0}
            max={1}
            step={0.05}
            valueLabelDisplay="auto"
          />
        </div>

        <div className={classes.totalRow}>
          <Typography variant="subtitle1">
            {formatMessage(intl, "claimlens", "routingPolicy.total")}
          </Typography>
          <Typography
            variant="subtitle1"
            color={Math.abs(total - 1.0) < 0.001 ? "primary" : "error"}
          >
            {total}
          </Typography>
        </div>

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
  routingPolicy: state.claimlens.routingPolicy,
  fetchingRoutingPolicy: state.claimlens.fetchingRoutingPolicy,
  submittingMutation: state.claimlens.submittingMutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { fetchRoutingPolicy, updateRoutingPolicy },
    dispatch
  );

export default withModulesManager(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(injectIntl(withStyles(styles)(RoutingPolicyPanel)))
);
