import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Button, CircularProgress } from "@material-ui/core";
import {
  withModulesManager,
  formatMessage,
  journalize,
  coreConfirm,
} from "@openimis/fe-core";
import { fetchDocument, fetchAuditLogs, processDocument } from "../actions";
import DocumentMetadataPanel from "./DocumentMetadataPanel";
import ExtractionResultPanel from "./ExtractionResultPanel";
import ProcessingTimeline from "./ProcessingTimeline";
import {
  STATUS_PENDING,
  PROCESSING_STATUSES,
  TERMINAL_STATUSES,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
} from "../constants";

const styles = (theme) => ({
  actions: { marginBottom: theme.spacing(2) },
});

class DocumentForm extends Component {
  state = {
    pollCount: 0,
  };

  componentDidMount() {
    const { document_uuid } = this.props;
    if (document_uuid) {
      this.props.fetchDocument(this.props.modulesManager, document_uuid);
      this.props.fetchAuditLogs(this.props.modulesManager, document_uuid);
    }
  }

  componentDidUpdate(prevProps) {
    const { document: doc } = this.props;

    if (doc && !prevProps.document) {
      this.startPollingIfNeeded();
    }

    if (
      doc &&
      prevProps.document &&
      doc.status !== prevProps.document.status
    ) {
      if (TERMINAL_STATUSES.includes(doc.status)) {
        this.stopPolling();
      }
    }
  }

  componentWillUnmount() {
    this.stopPolling();
  }

  startPollingIfNeeded() {
    const { document: doc } = this.props;
    if (doc && PROCESSING_STATUSES.includes(doc.status)) {
      this.pollInterval = setInterval(() => {
        if (this.state.pollCount >= POLL_MAX_ATTEMPTS) {
          this.stopPolling();
          return;
        }
        this.props.fetchDocument(
          this.props.modulesManager,
          this.props.document_uuid
        );
        this.setState((prev) => ({ pollCount: prev.pollCount + 1 }));
      }, POLL_INTERVAL_MS);
    }
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  handleProcess = () => {
    const { document: doc, intl } = this.props;
    if (doc) {
      this.props.processDocument(
        doc.uuid,
        formatMessage(intl, "claimlens", "action.process")
      );
      setTimeout(() => {
        this.props.fetchDocument(
          this.props.modulesManager,
          this.props.document_uuid
        );
        this.startPollingIfNeeded();
      }, 1000);
    }
  };

  render() {
    const { classes, intl, document: doc, fetchingDocument, submittingMutation } = this.props;
    if (fetchingDocument || !doc) {
      return <CircularProgress />;
    }

    const canProcess = doc.status === STATUS_PENDING;
    const isProcessing = PROCESSING_STATUSES.includes(doc.status);

    return (
      <div>
        {canProcess && (
          <div className={classes.actions}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleProcess}
              disabled={submittingMutation}
            >
              {formatMessage(intl, "claimlens", "action.process")}
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className={classes.actions}>
            <Button variant="outlined" disabled>
              <CircularProgress size={16} style={{ marginRight: 8 }} />
              {formatMessage(intl, "claimlens", "action.processing")}
            </Button>
          </div>
        )}

        <ProcessingTimeline status={doc.status} />
        <DocumentMetadataPanel document={doc} />
        {doc.extractionResult && (
          <ExtractionResultPanel extractionResult={doc.extractionResult} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  document: state.claimlens.document,
  fetchingDocument: state.claimlens.fetchingDocument,
  submittingMutation: state.claimlens.submittingMutation,
  auditLogs: state.claimlens.auditLogs,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    { fetchDocument, fetchAuditLogs, processDocument, journalize, coreConfirm },
    dispatch
  );

export default withModulesManager(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(injectIntl(withStyles(styles)(DocumentForm)))
);
