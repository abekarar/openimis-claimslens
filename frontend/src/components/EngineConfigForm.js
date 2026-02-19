import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, TextField,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { createEngineConfig, updateEngineConfig } from "../actions";

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
  formControl: { minWidth: "100%", marginBottom: theme.spacing(2) },
});

class EngineConfigForm extends Component {
  constructor(props) {
    super(props);
    this.state = this.initialState(props.engineConfig);
  }

  initialState = (ec) => ({
    name: ec ? ec.name || "" : "",
    adapter: ec ? ec.adapter || "" : "",
    endpointUrl: ec ? ec.endpointUrl || "" : "",
    modelName: ec ? ec.modelName || "" : "",
    apiKey: "",
    deploymentMode: ec ? ec.deploymentMode || "" : "",
    isPrimary: ec ? !!ec.isPrimary : false,
    isFallback: ec ? !!ec.isFallback : false,
    isActive: ec ? !!ec.isActive : true,
    maxTokens: ec && ec.maxTokens != null ? ec.maxTokens : "",
    temperature: ec && ec.temperature != null ? ec.temperature : "",
    timeoutSeconds: ec && ec.timeoutSeconds != null ? ec.timeoutSeconds : "",
  });

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState(this.initialState(this.props.engineConfig));
    }
  }

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  handleCheckboxChange = (field) => (e) => {
    this.setState({ [field]: e.target.checked });
  };

  handleSave = () => {
    const { engineConfig, intl } = this.props;
    const {
      name, adapter, endpointUrl, modelName, apiKey, deploymentMode,
      isPrimary, isFallback, isActive, maxTokens, temperature, timeoutSeconds,
    } = this.state;

    const data = { name, adapter, endpointUrl, modelName, isPrimary, isFallback, isActive };
    if (apiKey) data.apiKey = apiKey;
    if (deploymentMode) data.deploymentMode = deploymentMode;
    if (maxTokens !== "") data.maxTokens = Number(maxTokens);
    if (temperature !== "") data.temperature = Number(temperature);
    if (timeoutSeconds !== "") data.timeoutSeconds = Number(timeoutSeconds);

    if (engineConfig && engineConfig.uuid) {
      data.id = engineConfig.uuid;
      this.props.updateEngineConfig(
        data,
        formatMessage(intl, "claimlens", "engineConfig.mutation.update")
      );
    } else {
      this.props.createEngineConfig(
        data,
        formatMessage(intl, "claimlens", "engineConfig.mutation.create")
      );
    }
    this.props.onClose(true);
  };

  render() {
    const { intl, classes, open, onClose, engineConfig } = this.props;
    const {
      name, adapter, endpointUrl, modelName, apiKey, deploymentMode,
      isPrimary, isFallback, isActive, maxTokens, temperature, timeoutSeconds,
    } = this.state;

    const isEdit = !!(engineConfig && engineConfig.uuid);
    const title = isEdit
      ? formatMessage(intl, "claimlens", "engineConfig.form.editTitle")
      : formatMessage(intl, "claimlens", "engineConfig.form.createTitle");

    return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="md">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                className={classes.field}
                fullWidth
                required
                label={formatMessage(intl, "claimlens", "engineConfig.name")}
                value={name}
                onChange={this.handleChange("name")}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl className={classes.formControl} required>
                <InputLabel>
                  {formatMessage(intl, "claimlens", "engineConfig.adapter")}
                </InputLabel>
                <Select value={adapter} onChange={this.handleChange("adapter")}>
                  <MenuItem value="openai_compatible">openai_compatible</MenuItem>
                  <MenuItem value="mistral">mistral</MenuItem>
                  <MenuItem value="deepseek">deepseek</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                className={classes.field}
                fullWidth
                required
                label={formatMessage(intl, "claimlens", "engineConfig.endpointUrl")}
                value={endpointUrl}
                onChange={this.handleChange("endpointUrl")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                className={classes.field}
                fullWidth
                required
                label={formatMessage(intl, "claimlens", "engineConfig.modelName")}
                value={modelName}
                onChange={this.handleChange("modelName")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                className={classes.field}
                fullWidth
                label={formatMessage(intl, "claimlens", "engineConfig.apiKey")}
                type="password"
                value={apiKey}
                onChange={this.handleChange("apiKey")}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl className={classes.formControl}>
                <InputLabel>
                  {formatMessage(intl, "claimlens", "engineConfig.deploymentMode")}
                </InputLabel>
                <Select value={deploymentMode} onChange={this.handleChange("deploymentMode")}>
                  <MenuItem value="">-</MenuItem>
                  <MenuItem value="cloud">cloud</MenuItem>
                  <MenuItem value="self_hosted">self_hosted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                className={classes.field}
                fullWidth
                label={formatMessage(intl, "claimlens", "engineConfig.maxTokens")}
                type="number"
                value={maxTokens}
                onChange={this.handleChange("maxTokens")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                className={classes.field}
                fullWidth
                label={formatMessage(intl, "claimlens", "engineConfig.temperature")}
                type="number"
                inputProps={{ min: 0, max: 2, step: 0.1 }}
                value={temperature}
                onChange={this.handleChange("temperature")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                className={classes.field}
                fullWidth
                label={formatMessage(intl, "claimlens", "engineConfig.timeoutSeconds")}
                type="number"
                value={timeoutSeconds}
                onChange={this.handleChange("timeoutSeconds")}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={<Checkbox checked={isPrimary} onChange={this.handleCheckboxChange("isPrimary")} color="primary" />}
                label={formatMessage(intl, "claimlens", "engineConfig.isPrimary")}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={<Checkbox checked={isFallback} onChange={this.handleCheckboxChange("isFallback")} color="primary" />}
                label={formatMessage(intl, "claimlens", "engineConfig.isFallback")}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={<Checkbox checked={isActive} onChange={this.handleCheckboxChange("isActive")} color="primary" />}
                label={formatMessage(intl, "claimlens", "engineConfig.active")}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>
            {formatMessage(intl, "claimlens", "action.cancel")}
          </Button>
          <Button
            onClick={this.handleSave}
            color="primary"
            variant="contained"
            disabled={!name || !adapter || !endpointUrl || !modelName}
          >
            {formatMessage(intl, "claimlens", "action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  submittingMutation: state.claimlens.submittingMutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ createEngineConfig, updateEngineConfig }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(EngineConfigForm)))
);
