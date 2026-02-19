import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { Button, IconButton, Tooltip } from "@material-ui/core";
import { Add, Edit } from "@material-ui/icons";
import {
  withModulesManager, formatMessage, Searcher, withHistory,
} from "@openimis/fe-core";
import {
  fetchEngineRoutingRules,
  fetchEngineConfigs,
  fetchDocumentTypes,
} from "../actions";
import EngineRoutingRuleForm from "./EngineRoutingRuleForm";
import { RIGHT_CLAIMLENS_MANAGE_ENGINE_ROUTING_RULES } from "../constants";

const styles = (theme) => ({
  addButton: { marginBottom: theme.spacing(2) },
});

class EngineRoutingRuleSearcher extends Component {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-claimlens",
      "engineRoutingRuleSearcher.rowsPerPageOptions",
      [10, 20, 50]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-claimlens",
      "engineRoutingRuleSearcher.defaultPageSize",
      10
    );
    this.state = { formOpen: false, editRule: null };
  }

  componentDidMount() {
    this.props.fetchEngineConfigs(this.props.modulesManager, []);
    this.props.fetchDocumentTypes(this.props.modulesManager, []);
  }

  fetch = (prms) => {
    this.props.fetchEngineRoutingRules(this.props.modulesManager, prms);
  };

  headers = () => [
    "claimlens.engineRoutingRule.name",
    "claimlens.engineRoutingRule.engineConfig",
    "claimlens.engineRoutingRule.language",
    "claimlens.engineRoutingRule.documentType",
    "claimlens.engineRoutingRule.minConfidence",
    "claimlens.engineRoutingRule.priority",
    "claimlens.engineRoutingRule.active",
    "",
  ];

  sorts = () => [
    ["name", true],
    null,
    ["language", true],
    null,
    null,
    ["priority", true],
    ["isActive", true],
    null,
  ];

  itemFormatters = () => [
    (rule) => rule.name || "-",
    (rule) =>
      rule.engineConfig
        ? `${rule.engineConfig.name} (${rule.engineConfig.adapter})`
        : "-",
    (rule) => rule.language || "-",
    (rule) =>
      rule.documentType
        ? `${rule.documentType.code} - ${rule.documentType.name}`
        : formatMessage(this.props.intl, "claimlens", "engineRoutingRule.documentType.any"),
    (rule) => (rule.minConfidence != null ? rule.minConfidence : "-"),
    (rule) => (rule.priority != null ? rule.priority : "-"),
    (rule) =>
      rule.isActive
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (rule) => (
      <Tooltip title={formatMessage(this.props.intl, "claimlens", "engineRoutingRule.action.edit")}>
        <IconButton
          size="small"
          onClick={() => this.setState({ formOpen: true, editRule: rule })}
        >
          <Edit />
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
    if (state.afterCursor) prms.push(`after: "${state.afterCursor}"`);
    if (state.beforeCursor) prms.push(`before: "${state.beforeCursor}"`);
    if (state.orderBy) prms.push(`orderBy: ["${state.orderBy}"]`);
    return prms;
  };

  handleFormClose = (saved) => {
    this.setState({ formOpen: false, editRule: null });
    if (saved) this.fetch([`first: ${this.defaultPageSize}`]);
  };

  render() {
    const {
      intl, classes, rights,
      engineRoutingRules, engineRoutingRulesPageInfo,
      fetchingEngineRoutingRules, errorEngineRoutingRules,
    } = this.props;
    const { formOpen, editRule } = this.state;
    const canManage = rights.includes(RIGHT_CLAIMLENS_MANAGE_ENGINE_ROUTING_RULES);

    return (
      <Fragment>
        {canManage && (
          <div className={classes.addButton}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => this.setState({ formOpen: true, editRule: null })}
            >
              {formatMessage(intl, "claimlens", "engineRoutingRule.action.add")}
            </Button>
          </div>
        )}
        <Searcher
          module="claimlens"
          fetch={this.fetch}
          items={engineRoutingRules}
          itemsPageInfo={engineRoutingRulesPageInfo}
          fetchingItems={fetchingEngineRoutingRules}
          errorItems={errorEngineRoutingRules}
          tableTitle={formatMessage(intl, "claimlens", "engineRoutingRule.searcher.title")}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={this.rowIdentifier}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="-dateCreated"
        />
        <EngineRoutingRuleForm
          open={formOpen}
          onClose={this.handleFormClose}
          rule={editRule}
        />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  engineRoutingRules: state.claimlens.engineRoutingRules,
  engineRoutingRulesPageInfo: state.claimlens.engineRoutingRulesPageInfo,
  fetchingEngineRoutingRules: state.claimlens.fetchingEngineRoutingRules,
  errorEngineRoutingRules: state.claimlens.errorEngineRoutingRules,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { fetchEngineRoutingRules, fetchEngineConfigs, fetchDocumentTypes },
    dispatch
  );

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(
      injectIntl(withTheme(withStyles(styles)(EngineRoutingRuleSearcher)))
    )
  )
);
