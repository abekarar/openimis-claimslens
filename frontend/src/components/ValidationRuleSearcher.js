import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { IconButton, Tooltip } from "@material-ui/core";
import { Visibility } from "@material-ui/icons";
import {
  withModulesManager,
  formatMessage,
  Searcher,
  withHistory,
  historyPush,
} from "@openimis/fe-core";
import { fetchValidationRules } from "../actions";
import { RIGHT_CLAIMLENS_VALIDATION_RULES } from "../constants";

const styles = (theme) => ({
  root: {},
});

class ValidationRuleSearcher extends Component {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-claimlens",
      "validationRuleSearcher.rowsPerPageOptions",
      [10, 20, 50]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-claimlens",
      "validationRuleSearcher.defaultPageSize",
      10
    );
  }

  fetch = (prms) => {
    this.props.fetchValidationRules(this.props.modulesManager, prms);
  };

  headers = () => [
    "claimlens.validationRule.code",
    "claimlens.validationRule.name",
    "claimlens.validationRule.ruleType",
    "claimlens.validationRule.severity",
    "claimlens.validationRule.active",
    "",
  ];

  sorts = () => [
    ["code", true],
    ["name", true],
    ["ruleType", true],
    ["severity", true],
    ["isActive", true],
    null,
  ];

  itemFormatters = () => [
    (rule) => rule.code,
    (rule) => rule.name,
    (rule) =>
      rule.ruleType
        ? formatMessage(this.props.intl, "claimlens", `validationRule.ruleType.${rule.ruleType}`)
        : "-",
    (rule) =>
      rule.severity
        ? formatMessage(this.props.intl, "claimlens", `validationRule.severity.${rule.severity}`)
        : "-",
    (rule) =>
      rule.isActive
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (rule) => (
      <Tooltip title={formatMessage(this.props.intl, "claimlens", "action.viewDetail")}>
        <IconButton
          size="small"
          onClick={() =>
            historyPush(
              this.props.modulesManager,
              this.props.history,
              "claimlens.route.validationRule",
              [rule.uuid]
            )
          }
        >
          <Visibility />
        </IconButton>
      </Tooltip>
    ),
  ];

  rowIdentifier = (rule) => rule.uuid;

  filtersToQueryParams = (state) => {
    let prms = Object.keys(state.filters)
      .filter((f) => !!state.filters[f]["filter"])
      .map((f) => state.filters[f]["filter"]);
    prms.push(`first: ${state.pageSize}`);
    if (state.afterCursor) {
      prms.push(`after: "${state.afterCursor}"`);
    }
    if (state.beforeCursor) {
      prms.push(`before: "${state.beforeCursor}"`);
    }
    if (state.orderBy) {
      prms.push(`orderBy: ["${state.orderBy}"]`);
    }
    return prms;
  };

  onRowClick = (rule) => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "claimlens.route.validationRule",
      [rule.uuid]
    );
  };

  render() {
    const {
      intl,
      validationRules,
      validationRulesPageInfo,
      fetchingValidationRules,
      errorValidationRules,
    } = this.props;

    return (
      <Searcher
        module="claimlens"
        fetch={this.fetch}
        items={validationRules}
        itemsPageInfo={validationRulesPageInfo}
        fetchingItems={fetchingValidationRules}
        errorItems={errorValidationRules}
        tableTitle={formatMessage(intl, "claimlens", "validationRule.searcher.title")}
        headers={this.headers}
        itemFormatters={this.itemFormatters}
        sorts={this.sorts}
        rowsPerPageOptions={this.rowsPerPageOptions}
        defaultPageSize={this.defaultPageSize}
        rowIdentifier={this.rowIdentifier}
        filtersToQueryParams={this.filtersToQueryParams}
        defaultOrderBy="code"
        rowLocked={() => false}
        onDoubleClick={this.onRowClick}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  validationRules: state.claimlens.validationRules,
  validationRulesPageInfo: state.claimlens.validationRulesPageInfo,
  fetchingValidationRules: state.claimlens.fetchingValidationRules,
  errorValidationRules: state.claimlens.errorValidationRules,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchValidationRules }, dispatch);

export default withModulesManager(
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withTheme(withStyles(styles)(ValidationRuleSearcher))))
  )
);
