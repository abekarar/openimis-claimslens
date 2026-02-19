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
import {
  fetchDocument,
  fetchAuditLogs,
  processDocument,
  runValidation,
  resolveValidationFinding,
  reviewRegistryProposal,
  applyRegistryProposal,
} from "../actions";
import DocumentMetadataPanel from "./DocumentMetadataPanel";
import ExtractionResultPanel from "./ExtractionResultPanel";
import ProcessingTimeline from "./ProcessingTimeline";
import ValidationResultPanel from "./ValidationResultPanel";
import ValidationFindingsPanel from "./ValidationFindingsPanel";
import RegistryUpdatePanel from "./RegistryUpdatePanel";
import AuditLogPanel from "./AuditLogPanel";
import LinkClaimDialog from "./LinkClaimDialog";
import {
  STATUS_PENDING,
  STATUS_COMPLETED,
  PROCESSING_STATUSES,
  TERMINAL_STATUSES,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
} from "../constants";

const styles = (theme) => ({
  actions: { marginBottom: theme.spacing(2) },
  validateButton: { marginLeft: theme.spacing(1) },
});

class DocumentForm extends Component {
  state = {
    pollCount: 0,
    linkClaimOpen: false,
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

  handleRunValidation = () => {
    const { document: doc, intl } = this.props;
    if (doc) {
      this.props.runValidation(
        doc.uuid,
        formatMessage(intl, "claimlens", "action.runValidation")
      );
    }
  };

  handleResolveFinding = (findingId, resolutionStatus) => {
    const { intl } = this.props;
    this.props.resolveValidationFinding(
      findingId,
      resolutionStatus,
      formatMessage(intl, "claimlens", "action.resolveFinding")
    );
  };

  handleReviewProposal = (id, status) => {
    const { intl } = this.props;
    this.props.reviewRegistryProposal(
      id,
      status,
      formatMessage(intl, "claimlens", "action.reviewProposal")
    );
  };

  handleApplyProposal = (id) => {
    const { intl } = this.props;
    this.props.applyRegistryProposal(
      id,
      formatMessage(intl, "claimlens", "action.applyProposal")
    );
  };

  handleLinkClaimClose = (saved) => {
    this.setState({ linkClaimOpen: false });
    if (saved) {
      this.props.fetchDocument(this.props.modulesManager, this.props.document_uuid);
    }
  };

  gatherFindings(validationResults) {
    if (!validationResults || !validationResults.length) return [];
    const findings = [];
    validationResults.forEach((vr) => {
      if (vr.findings && vr.findings.length) {
        findings.push(...vr.findings);
      }
    });
    return findings;
  }

  gatherProposals(validationResults) {
    if (!validationResults || !validationResults.length) return [];
    const proposals = [];
    validationResults.forEach((vr) => {
      if (vr.registryProposals && vr.registryProposals.length) {
        proposals.push(...vr.registryProposals);
      }
    });
    return proposals;
  }

  render() {
    const { classes, intl, document: doc, fetchingDocument, submittingMutation } = this.props;
    if (fetchingDocument || !doc) {
      return <CircularProgress />;
    }

    const canProcess = doc.status === STATUS_PENDING;
    const isProcessing = PROCESSING_STATUSES.includes(doc.status);
    const canValidate = doc.status === STATUS_COMPLETED && !!doc.claimUuid;

    const findings = this.gatherFindings(doc.validationResults);
    const proposals = this.gatherProposals(doc.validationResults);

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

        {canValidate && (
          <div className={classes.actions}>
            <Button
              variant="contained"
              color="primary"
              className={classes.validateButton}
              onClick={this.handleRunValidation}
              disabled={submittingMutation}
            >
              {formatMessage(intl, "claimlens", "action.runValidation")}
            </Button>
          </div>
        )}

        {doc.status === STATUS_COMPLETED && !doc.claimUuid && (
          <div className={classes.actions}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => this.setState({ linkClaimOpen: true })}
              disabled={submittingMutation}
            >
              {formatMessage(intl, "claimlens", "action.linkClaim")}
            </Button>
          </div>
        )}

        <ProcessingTimeline status={doc.status} />
        <DocumentMetadataPanel document={doc} />
        {doc.extractionResult && (
          <ExtractionResultPanel extractionResult={doc.extractionResult} />
        )}
        {doc.validationResults && doc.validationResults.length > 0 && (
          <ValidationResultPanel validationResults={doc.validationResults} />
        )}
        {findings.length > 0 && (
          <ValidationFindingsPanel
            findings={findings}
            onResolveFinding={this.handleResolveFinding}
          />
        )}
        {proposals.length > 0 && (
          <RegistryUpdatePanel
            proposals={proposals}
            onReviewProposal={this.handleReviewProposal}
            onApplyProposal={this.handleApplyProposal}
          />
        )}
        <AuditLogPanel auditLogs={this.props.auditLogs} />
        <LinkClaimDialog
          open={this.state.linkClaimOpen}
          onClose={this.handleLinkClaimClose}
          documentUuid={doc.uuid}
        />
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
    {
      fetchDocument,
      fetchAuditLogs,
      processDocument,
      runValidation,
      resolveValidationFinding,
      reviewRegistryProposal,
      applyRegistryProposal,
      journalize,
      coreConfirm,
    },
    dispatch
  );

export default withModulesManager(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(injectIntl(withStyles(styles)(DocumentForm)))
);
