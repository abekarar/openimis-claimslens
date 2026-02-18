import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import {
  createCapabilityScore,
  updateCapabilityScore,
} from "../actions";

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
  formControl: { minWidth: "100%", marginBottom: theme.spacing(2) },
});

class CapabilityScoreForm extends Component {
  constructor(props) {
    super(props);
    this.state = this.initialState(props.score);
  }

  initialState = (score) => ({
    engineConfigId: score && score.engineConfig ? score.engineConfig.uuid : "",
    language: score ? score.language || "" : "",
    documentTypeId: score && score.documentType ? score.documentType.uuid : "",
    accuracyScore: score ? score.accuracyScore || "" : "",
    costPerPage: score ? score.costPerPage || "" : "",
    speedScore: score ? score.speedScore || "" : "",
    isActive: score ? !!score.isActive : true,
  });

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState(this.initialState(this.props.score));
    }
  }

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  handleCheckboxChange = (field) => (e) => {
    this.setState({ [field]: e.target.checked });
  };

  handleSave = () => {
    const { score, intl } = this.props;
    const {
      engineConfigId,
      language,
      documentTypeId,
      accuracyScore,
      costPerPage,
      speedScore,
      isActive,
    } = this.state;

    const data = {
      engineConfigId,
      language,
      accuracyScore: accuracyScore !== "" ? Number(accuracyScore) : undefined,
      costPerPage: costPerPage !== "" ? Number(costPerPage) : undefined,
      speedScore: speedScore !== "" ? Number(speedScore) : undefined,
      isActive,
    };

    if (documentTypeId) {
      data.documentTypeId = documentTypeId;
    }

    if (score && score.uuid) {
      data.id = score.uuid;
      this.props.updateCapabilityScore(
        data,
        formatMessage(intl, "claimlens", "capabilityScore.mutation.update")
      );
    } else {
      this.props.createCapabilityScore(
        data,
        formatMessage(intl, "claimlens", "capabilityScore.mutation.create")
      );
    }

    this.props.onClose(true);
  };

  render() {
    const { intl, classes, open, onClose, score, engineConfigs, documentTypes } = this.props;
    const {
      engineConfigId,
      language,
      documentTypeId,
      accuracyScore,
      costPerPage,
      speedScore,
      isActive,
    } = this.state;

    const isEdit = !!(score && score.uuid);
    const title = isEdit
      ? formatMessage(intl, "claimlens", "capabilityScore.form.editTitle")
      : formatMessage(intl, "claimlens", "capabilityScore.form.createTitle");

    return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <FormControl className={classes.formControl}>
            <InputLabel>
              {formatMessage(intl, "claimlens", "capabilityScore.engineConfig")}
            </InputLabel>
            <Select
              value={engineConfigId}
              onChange={this.handleChange("engineConfigId")}
            >
              {(engineConfigs || []).map((ec) => (
                <MenuItem key={ec.uuid} value={ec.uuid}>
                  {ec.name} ({ec.adapter})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "capabilityScore.language")}
            value={language}
            onChange={this.handleChange("language")}
          />

          <FormControl className={classes.formControl}>
            <InputLabel>
              {formatMessage(intl, "claimlens", "capabilityScore.documentType")}
            </InputLabel>
            <Select
              value={documentTypeId}
              onChange={this.handleChange("documentTypeId")}
            >
              <MenuItem value="">
                {formatMessage(intl, "claimlens", "capabilityScore.documentType.none")}
              </MenuItem>
              {(documentTypes || []).map((dt) => (
                <MenuItem key={dt.uuid} value={dt.uuid}>
                  {dt.code} - {dt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "capabilityScore.accuracy")}
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={accuracyScore}
            onChange={this.handleChange("accuracyScore")}
          />

          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "capabilityScore.costPerPage")}
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            value={costPerPage}
            onChange={this.handleChange("costPerPage")}
          />

          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "capabilityScore.speed")}
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={speedScore}
            onChange={this.handleChange("speedScore")}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={this.handleCheckboxChange("isActive")}
                color="primary"
              />
            }
            label={formatMessage(intl, "claimlens", "capabilityScore.active")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>
            {formatMessage(intl, "claimlens", "action.cancel")}
          </Button>
          <Button
            onClick={this.handleSave}
            color="primary"
            variant="contained"
            disabled={!engineConfigId || !language}
          >
            {formatMessage(intl, "claimlens", "action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  engineConfigs: state.claimlens.engineConfigs,
  documentTypes: state.claimlens.documentTypes,
  submittingMutation: state.claimlens.submittingMutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { createCapabilityScore, updateCapabilityScore },
    dispatch
  );

export default withModulesManager(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(injectIntl(withStyles(styles)(CapabilityScoreForm)))
);
