import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { createEngineRoutingRule, updateEngineRoutingRule } from "../actions";

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
  formControl: { minWidth: "100%", marginBottom: theme.spacing(2) },
});

class EngineRoutingRuleForm extends Component {
  constructor(props) {
    super(props);
    this.state = this.initialState(props.rule);
  }

  initialState = (rule) => ({
    name: rule ? rule.name || "" : "",
    engineConfigId: rule && rule.engineConfig ? rule.engineConfig.uuid : "",
    language: rule ? rule.language || "" : "",
    documentTypeId: rule && rule.documentType ? rule.documentType.uuid : "",
    minConfidence: rule && rule.minConfidence != null ? rule.minConfidence : "",
    priority: rule && rule.priority != null ? rule.priority : 0,
    isActive: rule ? !!rule.isActive : true,
  });

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState(this.initialState(this.props.rule));
    }
  }

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  handleCheckboxChange = (field) => (e) => {
    this.setState({ [field]: e.target.checked });
  };

  handleSave = () => {
    const { rule, intl } = this.props;
    const { name, engineConfigId, language, documentTypeId, minConfidence, priority, isActive } = this.state;

    const data = { name, engineConfigId, isActive };
    if (language) data.language = language;
    if (documentTypeId) data.documentTypeId = documentTypeId;
    if (minConfidence !== "") data.minConfidence = Number(minConfidence);
    if (priority !== "") data.priority = Number(priority);

    if (rule && rule.uuid) {
      data.id = rule.uuid;
      this.props.updateEngineRoutingRule(
        data,
        formatMessage(intl, "claimlens", "engineRoutingRule.mutation.update")
      );
    } else {
      this.props.createEngineRoutingRule(
        data,
        formatMessage(intl, "claimlens", "engineRoutingRule.mutation.create")
      );
    }
    this.props.onClose(true);
  };

  render() {
    const { intl, classes, open, onClose, rule, engineConfigs, documentTypes } = this.props;
    const { name, engineConfigId, language, documentTypeId, minConfidence, priority, isActive } = this.state;

    const isEdit = !!(rule && rule.uuid);
    const title = isEdit
      ? formatMessage(intl, "claimlens", "engineRoutingRule.form.editTitle")
      : formatMessage(intl, "claimlens", "engineRoutingRule.form.createTitle");

    return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            className={classes.field}
            fullWidth
            required
            label={formatMessage(intl, "claimlens", "engineRoutingRule.name")}
            value={name}
            onChange={this.handleChange("name")}
          />
          <FormControl className={classes.formControl} required>
            <InputLabel>
              {formatMessage(intl, "claimlens", "engineRoutingRule.engineConfig")}
            </InputLabel>
            <Select value={engineConfigId} onChange={this.handleChange("engineConfigId")}>
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
            label={formatMessage(intl, "claimlens", "engineRoutingRule.language")}
            value={language}
            onChange={this.handleChange("language")}
          />
          <FormControl className={classes.formControl}>
            <InputLabel>
              {formatMessage(intl, "claimlens", "engineRoutingRule.documentType")}
            </InputLabel>
            <Select value={documentTypeId} onChange={this.handleChange("documentTypeId")}>
              <MenuItem value="">
                {formatMessage(intl, "claimlens", "engineRoutingRule.documentType.any")}
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
            label={formatMessage(intl, "claimlens", "engineRoutingRule.minConfidence")}
            type="number"
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            value={minConfidence}
            onChange={this.handleChange("minConfidence")}
          />
          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "engineRoutingRule.priority")}
            type="number"
            value={priority}
            onChange={this.handleChange("priority")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={this.handleCheckboxChange("isActive")}
                color="primary"
              />
            }
            label={formatMessage(intl, "claimlens", "engineRoutingRule.active")}
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
            disabled={!name || !engineConfigId}
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
  bindActionCreators({ createEngineRoutingRule, updateEngineRoutingRule }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(EngineRoutingRuleForm)))
);
