import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
} from "@material-ui/core";
import { withModulesManager, formatMessage, withHistory, historyPush } from "@openimis/fe-core";
import {
  fetchValidationRule,
  createValidationRule,
  updateValidationRule,
} from "../actions";
import {
  RULE_TYPES,
  SEVERITY_LEVELS,
} from "../constants";

const styles = (theme) => ({
  paper: { padding: theme.spacing(3) },
  formControl: { minWidth: "100%", marginBottom: theme.spacing(2) },
  field: { marginBottom: theme.spacing(2) },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(3),
    gap: theme.spacing(1),
  },
});

class ValidationRuleForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: "",
      name: "",
      ruleType: "",
      severity: "",
      ruleDefinition: "",
      isActive: true,
      dirty: false,
    };
  }

  componentDidMount() {
    const { rule_uuid } = this.props;
    if (rule_uuid) {
      this.props.fetchValidationRule(this.props.modulesManager, rule_uuid);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.validationRule && !prevProps.validationRule) {
      const rule = this.props.validationRule;
      this.setState({
        code: rule.code || "",
        name: rule.name || "",
        ruleType: rule.ruleType || "",
        severity: rule.severity || "",
        ruleDefinition: rule.ruleDefinition
          ? (typeof rule.ruleDefinition === "string"
              ? rule.ruleDefinition
              : JSON.stringify(rule.ruleDefinition, null, 2))
          : "",
        isActive: !!rule.isActive,
        dirty: false,
      });
    }
  }

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value, dirty: true });
  };

  handleCheckboxChange = (field) => (e) => {
    this.setState({ [field]: e.target.checked, dirty: true });
  };

  handleSave = () => {
    const { intl, validationRule } = this.props;
    const { code, name, ruleType, severity, ruleDefinition, isActive } = this.state;

    let parsedDefinition;
    if (ruleDefinition) {
      try {
        parsedDefinition = JSON.parse(ruleDefinition);
      } catch (e) {
        parsedDefinition = ruleDefinition;
      }
    }

    const data = {
      code,
      name,
      ruleType,
      severity,
      isActive,
    };
    if (parsedDefinition) {
      data.ruleDefinition = parsedDefinition;
    }

    if (validationRule && validationRule.uuid) {
      data.id = validationRule.uuid;
      this.props.updateValidationRule(
        data,
        formatMessage(intl, "claimlens", "validationRule.mutation.update")
      );
    } else {
      this.props.createValidationRule(
        data,
        formatMessage(intl, "claimlens", "validationRule.mutation.create")
      );
    }

    this.setState({ dirty: false });
  };

  handleBack = () => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "claimlens.route.validationRules"
    );
  };

  render() {
    const { intl, classes, fetchingValidationRule, submittingMutation, rule_uuid } = this.props;
    const { code, name, ruleType, severity, ruleDefinition, isActive, dirty } = this.state;

    if (rule_uuid && fetchingValidationRule) {
      return <CircularProgress />;
    }

    const isEdit = !!(rule_uuid && this.props.validationRule);
    const canSave = dirty && code && name && ruleType;

    return (
      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.field}
              fullWidth
              label={formatMessage(intl, "claimlens", "validationRule.code")}
              value={code}
              onChange={this.handleChange("code")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.field}
              fullWidth
              label={formatMessage(intl, "claimlens", "validationRule.name")}
              value={name}
              onChange={this.handleChange("name")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl className={classes.formControl}>
              <InputLabel>
                {formatMessage(intl, "claimlens", "validationRule.ruleType")}
              </InputLabel>
              <Select
                value={ruleType}
                onChange={this.handleChange("ruleType")}
              >
                {RULE_TYPES.map((rt) => (
                  <MenuItem key={rt} value={rt}>
                    {formatMessage(intl, "claimlens", `validationRule.ruleType.${rt}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl className={classes.formControl}>
              <InputLabel>
                {formatMessage(intl, "claimlens", "validationRule.severity")}
              </InputLabel>
              <Select
                value={severity}
                onChange={this.handleChange("severity")}
              >
                {SEVERITY_LEVELS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {formatMessage(intl, "claimlens", `validationRule.severity.${s}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              className={classes.field}
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              label={formatMessage(intl, "claimlens", "validationRule.ruleDefinition")}
              value={ruleDefinition}
              onChange={this.handleChange("ruleDefinition")}
              placeholder='{"conditions": [], "actions": []}'
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isActive}
                  onChange={this.handleCheckboxChange("isActive")}
                  color="primary"
                />
              }
              label={formatMessage(intl, "claimlens", "validationRule.active")}
            />
          </Grid>
        </Grid>

        <div className={classes.actions}>
          <Button onClick={this.handleBack}>
            {formatMessage(intl, "claimlens", "action.back")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleSave}
            disabled={!canSave || submittingMutation}
          >
            {isEdit
              ? formatMessage(intl, "claimlens", "action.save")
              : formatMessage(intl, "claimlens", "action.create")}
          </Button>
        </div>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  validationRule: state.claimlens.validationRule,
  fetchingValidationRule: state.claimlens.fetchingValidationRule,
  submittingMutation: state.claimlens.submittingMutation,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { fetchValidationRule, createValidationRule, updateValidationRule },
    dispatch
  );

export default withModulesManager(
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withStyles(styles)(ValidationRuleForm)))
  )
);
