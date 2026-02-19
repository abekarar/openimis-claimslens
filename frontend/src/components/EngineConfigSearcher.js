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
import { fetchEngineConfigs } from "../actions";
import EngineConfigForm from "./EngineConfigForm";
import { RIGHT_CLAIMLENS_MANAGE_ENGINE_CONFIGS } from "../constants";

const styles = (theme) => ({
  addButton: { marginBottom: theme.spacing(2) },
});

class EngineConfigSearcher extends Component {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-claimlens",
      "engineConfigSearcher.rowsPerPageOptions",
      [10, 20, 50]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-claimlens",
      "engineConfigSearcher.defaultPageSize",
      10
    );
    this.state = { formOpen: false, editConfig: null };
  }

  fetch = (prms) => {
    this.props.fetchEngineConfigs(this.props.modulesManager, prms);
  };

  headers = () => [
    "claimlens.engineConfig.name",
    "claimlens.engineConfig.adapter",
    "claimlens.engineConfig.modelName",
    "claimlens.engineConfig.isPrimary",
    "claimlens.engineConfig.isFallback",
    "claimlens.engineConfig.active",
    "",
  ];

  sorts = () => [
    ["name", true],
    ["adapter", true],
    null,
    null,
    null,
    ["isActive", true],
    null,
  ];

  itemFormatters = () => [
    (ec) => ec.name || "-",
    (ec) => ec.adapter || "-",
    (ec) => ec.modelName || "-",
    (ec) =>
      ec.isPrimary
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (ec) =>
      ec.isFallback
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (ec) =>
      ec.isActive
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (ec) => (
      <Tooltip title={formatMessage(this.props.intl, "claimlens", "engineConfig.action.edit")}>
        <IconButton
          size="small"
          onClick={() => this.setState({ formOpen: true, editConfig: ec })}
        >
          <Edit />
        </IconButton>
      </Tooltip>
    ),
  ];

  rowIdentifier = (ec) => ec.uuid;

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
    this.setState({ formOpen: false, editConfig: null });
    if (saved) this.fetch([`first: ${this.defaultPageSize}`]);
  };

  render() {
    const {
      intl, classes, rights,
      engineConfigs, engineConfigsPageInfo, fetchingEngineConfigs, errorEngineConfigs,
    } = this.props;
    const { formOpen, editConfig } = this.state;
    const canManage = rights.includes(RIGHT_CLAIMLENS_MANAGE_ENGINE_CONFIGS);

    return (
      <Fragment>
        {canManage && (
          <div className={classes.addButton}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => this.setState({ formOpen: true, editConfig: null })}
            >
              {formatMessage(intl, "claimlens", "engineConfig.action.add")}
            </Button>
          </div>
        )}
        <Searcher
          module="claimlens"
          fetch={this.fetch}
          items={engineConfigs}
          itemsPageInfo={engineConfigsPageInfo}
          fetchingItems={fetchingEngineConfigs}
          errorItems={errorEngineConfigs}
          tableTitle={formatMessage(intl, "claimlens", "engineConfig.searcher.title")}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={this.rowIdentifier}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="-dateCreated"
        />
        <EngineConfigForm
          open={formOpen}
          onClose={this.handleFormClose}
          engineConfig={editConfig}
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
  engineConfigs: state.claimlens.engineConfigs,
  engineConfigsPageInfo: state.claimlens.engineConfigsPageInfo,
  fetchingEngineConfigs: state.claimlens.fetchingEngineConfigs,
  errorEngineConfigs: state.claimlens.errorEngineConfigs,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchEngineConfigs }, dispatch);

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(
      injectIntl(withTheme(withStyles(styles)(EngineConfigSearcher)))
    )
  )
);
