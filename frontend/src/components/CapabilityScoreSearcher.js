import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { Button, IconButton, Tooltip } from "@material-ui/core";
import { Add, Edit } from "@material-ui/icons";
import {
  withModulesManager,
  formatMessage,
  Searcher,
  withHistory,
} from "@openimis/fe-core";
import {
  fetchCapabilityScores,
  fetchEngineConfigs,
  fetchDocumentTypes,
} from "../actions";
import CapabilityScoreForm from "./CapabilityScoreForm";
import { RIGHT_CLAIMLENS_MANAGE_CAPABILITY_SCORES } from "../constants";

const styles = (theme) => ({
  addButton: { marginBottom: theme.spacing(2) },
});

class CapabilityScoreSearcher extends Component {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-claimlens",
      "capabilityScoreSearcher.rowsPerPageOptions",
      [10, 20, 50]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-claimlens",
      "capabilityScoreSearcher.defaultPageSize",
      10
    );
    this.state = {
      formOpen: false,
      editScore: null,
    };
  }

  componentDidMount() {
    this.props.fetchEngineConfigs(this.props.modulesManager, []);
    this.props.fetchDocumentTypes(this.props.modulesManager, []);
  }

  fetch = (prms) => {
    this.props.fetchCapabilityScores(this.props.modulesManager, prms);
  };

  headers = () => [
    "claimlens.capabilityScore.engine",
    "claimlens.capabilityScore.language",
    "claimlens.capabilityScore.documentType",
    "claimlens.capabilityScore.accuracy",
    "claimlens.capabilityScore.costPerPage",
    "claimlens.capabilityScore.speed",
    "claimlens.capabilityScore.active",
    "",
  ];

  sorts = () => [
    null,
    ["language", true],
    null,
    ["accuracyScore", true],
    ["costPerPage", true],
    ["speedScore", true],
    ["isActive", true],
    null,
  ];

  itemFormatters = () => [
    (score) =>
      score.engineConfig
        ? `${score.engineConfig.name} (${score.engineConfig.adapter})`
        : "-",
    (score) => score.language || "-",
    (score) =>
      score.documentType ? `${score.documentType.code} - ${score.documentType.name}` : "-",
    (score) => (score.accuracyScore != null ? score.accuracyScore : "-"),
    (score) => (score.costPerPage != null ? score.costPerPage : "-"),
    (score) => (score.speedScore != null ? score.speedScore : "-"),
    (score) =>
      score.isActive
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (score) => (
      <Tooltip title={formatMessage(this.props.intl, "claimlens", "capabilityScore.action.edit")}>
        <IconButton
          size="small"
          onClick={() => this.setState({ formOpen: true, editScore: score })}
        >
          <Edit />
        </IconButton>
      </Tooltip>
    ),
  ];

  rowIdentifier = (score) => score.uuid;

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

  handleFormClose = (saved) => {
    this.setState({ formOpen: false, editScore: null });
    if (saved) {
      this.fetch([`first: ${this.defaultPageSize}`]);
    }
  };

  render() {
    const {
      intl,
      classes,
      rights,
      capabilityScores,
      capabilityScoresPageInfo,
      fetchingCapabilityScores,
      errorCapabilityScores,
    } = this.props;
    const { formOpen, editScore } = this.state;
    const canManage = rights.includes(RIGHT_CLAIMLENS_MANAGE_CAPABILITY_SCORES);

    return (
      <Fragment>
        {canManage && (
          <div className={classes.addButton}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => this.setState({ formOpen: true, editScore: null })}
            >
              {formatMessage(intl, "claimlens", "capabilityScore.action.add")}
            </Button>
          </div>
        )}
        <Searcher
          module="claimlens"
          fetch={this.fetch}
          items={capabilityScores}
          itemsPageInfo={capabilityScoresPageInfo}
          fetchingItems={fetchingCapabilityScores}
          errorItems={errorCapabilityScores}
          tableTitle={formatMessage(intl, "claimlens", "capabilityScore.searcher.title")}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={this.rowIdentifier}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="-dateCreated"
        />
        <CapabilityScoreForm
          open={formOpen}
          onClose={this.handleFormClose}
          score={editScore}
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
  capabilityScores: state.claimlens.capabilityScores,
  capabilityScoresPageInfo: state.claimlens.capabilityScoresPageInfo,
  fetchingCapabilityScores: state.claimlens.fetchingCapabilityScores,
  errorCapabilityScores: state.claimlens.errorCapabilityScores,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { fetchCapabilityScores, fetchEngineConfigs, fetchDocumentTypes },
    dispatch
  );

export default withModulesManager(
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withTheme(withStyles(styles)(CapabilityScoreSearcher))))
  )
);
