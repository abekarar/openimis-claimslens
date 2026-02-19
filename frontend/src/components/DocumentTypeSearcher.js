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
import { fetchDocumentTypes } from "../actions";
import DocumentTypeForm from "./DocumentTypeForm";
import { RIGHT_CLAIMLENS_MANAGE_DOCUMENT_TYPES } from "../constants";

const styles = (theme) => ({
  addButton: { marginBottom: theme.spacing(2) },
});

class DocumentTypeSearcher extends Component {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-claimlens",
      "documentTypeSearcher.rowsPerPageOptions",
      [10, 20, 50]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-claimlens",
      "documentTypeSearcher.defaultPageSize",
      10
    );
    this.state = { formOpen: false, editType: null };
  }

  fetch = (prms) => {
    this.props.fetchDocumentTypes(this.props.modulesManager, prms);
  };

  headers = () => [
    "claimlens.documentType.code",
    "claimlens.documentType.name",
    "claimlens.documentType.classificationHints",
    "claimlens.documentType.active",
    "",
  ];

  sorts = () => [
    ["code", true],
    ["name", true],
    null,
    ["isActive", true],
    null,
  ];

  itemFormatters = () => [
    (dt) => dt.code || "-",
    (dt) => dt.name || "-",
    (dt) => dt.classificationHints || "-",
    (dt) =>
      dt.isActive
        ? formatMessage(this.props.intl, "claimlens", "yes")
        : formatMessage(this.props.intl, "claimlens", "no"),
    (dt) => (
      <Tooltip title={formatMessage(this.props.intl, "claimlens", "documentType.action.edit")}>
        <IconButton
          size="small"
          onClick={() => this.setState({ formOpen: true, editType: dt })}
        >
          <Edit />
        </IconButton>
      </Tooltip>
    ),
  ];

  rowIdentifier = (dt) => dt.uuid;

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
    this.setState({ formOpen: false, editType: null });
    if (saved) this.fetch([`first: ${this.defaultPageSize}`]);
  };

  render() {
    const {
      intl, classes, rights,
      documentTypes, documentTypesPageInfo, fetchingDocumentTypes, errorDocumentTypes,
    } = this.props;
    const { formOpen, editType } = this.state;
    const canManage = rights.includes(RIGHT_CLAIMLENS_MANAGE_DOCUMENT_TYPES);

    return (
      <Fragment>
        {canManage && (
          <div className={classes.addButton}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => this.setState({ formOpen: true, editType: null })}
            >
              {formatMessage(intl, "claimlens", "documentType.action.add")}
            </Button>
          </div>
        )}
        <Searcher
          module="claimlens"
          fetch={this.fetch}
          items={documentTypes}
          itemsPageInfo={documentTypesPageInfo}
          fetchingItems={fetchingDocumentTypes}
          errorItems={errorDocumentTypes}
          tableTitle={formatMessage(intl, "claimlens", "documentType.searcher.title")}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={this.rowIdentifier}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="-dateCreated"
        />
        <DocumentTypeForm
          open={formOpen}
          onClose={this.handleFormClose}
          documentType={editType}
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
  documentTypes: state.claimlens.documentTypes,
  documentTypesPageInfo: state.claimlens.documentTypesPageInfo,
  fetchingDocumentTypes: state.claimlens.fetchingDocumentTypes,
  errorDocumentTypes: state.claimlens.errorDocumentTypes,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchDocumentTypes }, dispatch);

export default withModulesManager(
  withHistory(
    connect(mapStateToProps, mapDispatchToProps)(
      injectIntl(withTheme(withStyles(styles)(DocumentTypeSearcher)))
    )
  )
);
