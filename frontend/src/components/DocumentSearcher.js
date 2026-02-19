import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { Box, Button, IconButton, Tooltip, Typography } from "@material-ui/core";
import { Add, Visibility } from "@material-ui/icons";
import {
  withModulesManager,
  formatMessage,
  formatDateFromISO,
  Searcher,
  withHistory,
  historyPush,
} from "@openimis/fe-core";
import { fetchDocuments } from "../actions";
import DocumentFilter from "./DocumentFilter";
import StatusBadge from "./StatusBadge";
import ConfidenceBar from "./ConfidenceBar";
import {
  ROUTE_CLAIMLENS_DOCUMENT,
  RIGHT_CLAIMLENS_DOCUMENTS,
} from "../constants";

const styles = (theme) => ({
  root: {},
});

class DocumentSearcher extends Component {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-claimlens",
      "documentSearcher.rowsPerPageOptions",
      [10, 20, 50]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-claimlens",
      "documentSearcher.defaultPageSize",
      10
    );
  }

  fetch = (prms) => {
    this.props.fetchDocuments(this.props.modulesManager, prms);
  };

  headers = () => [
    "claimlens.searcher.filename",
    "claimlens.searcher.mimeType",
    "claimlens.searcher.fileSize",
    "claimlens.searcher.status",
    "claimlens.searcher.documentType",
    "claimlens.searcher.confidence",
    "claimlens.searcher.dateCreated",
    "",
  ];

  sorts = () => [
    ["originalFilename", true],
    ["mimeType", true],
    ["fileSize", true],
    ["status", true],
    null,
    null,
    ["dateCreated", true],
    null,
  ];

  formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  itemFormatters = () => [
    (doc) => doc.originalFilename,
    (doc) => doc.mimeType,
    (doc) => this.formatFileSize(doc.fileSize),
    (doc) => <StatusBadge status={doc.status} />,
    (doc) =>
      doc.documentType ? doc.documentType.name : "-",
    (doc) =>
      doc.classificationConfidence ? (
        <ConfidenceBar value={doc.classificationConfidence} />
      ) : (
        "-"
      ),
    (doc) =>
      formatDateFromISO(
        this.props.modulesManager,
        this.props.intl,
        doc.dateCreated
      ),
    (doc) => (
      <Tooltip title={formatMessage(this.props.intl, "claimlens", "action.viewDetail")}>
        <IconButton
          size="small"
          onClick={() =>
            historyPush(
              this.props.modulesManager,
              this.props.history,
              "claimlens.route.document",
              [doc.uuid]
            )
          }
        >
          <Visibility />
        </IconButton>
      </Tooltip>
    ),
  ];

  rowIdentifier = (doc) => doc.uuid;

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

  render() {
    const {
      intl,
      documents,
      documentsPageInfo,
      fetchingDocuments,
      errorDocuments,
    } = this.props;

    return (
      <>
        {!fetchingDocuments && documents && documents.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              {formatMessage(intl, "claimlens", "documents.empty")}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() =>
                historyPush(
                  this.props.modulesManager,
                  this.props.history,
                  "claimlens.route.upload"
                )
              }
            >
              {formatMessage(intl, "claimlens", "documents.uploadFirst")}
            </Button>
          </Box>
        )}
        <Searcher
          module="claimlens"
          FilterPane={DocumentFilter}
          fetch={this.fetch}
          items={documents}
          itemsPageInfo={documentsPageInfo}
          fetchingItems={fetchingDocuments}
          errorItems={errorDocuments}
          tableTitle={formatMessage(intl, "claimlens", "searcher.title")}
          headers={this.headers}
          itemFormatters={this.itemFormatters}
          sorts={this.sorts}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          rowIdentifier={this.rowIdentifier}
          filtersToQueryParams={this.filtersToQueryParams}
          defaultOrderBy="-dateCreated"
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  documents: state.claimlens.documents,
  documentsPageInfo: state.claimlens.documentsPageInfo,
  fetchingDocuments: state.claimlens.fetchingDocuments,
  errorDocuments: state.claimlens.errorDocuments,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchDocuments }, dispatch);

export default withModulesManager(
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withTheme(withStyles(styles)(DocumentSearcher))))
  )
);
