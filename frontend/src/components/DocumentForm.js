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
  approveExtractionReview,
  rejectExtractionReview,
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
  STATUS_REVIEW_REQUIRED,
  RIGHT_CLAIMLENS_REVIEW_EXTRACTION,
  PROCESSING_STATUSES,
  TERMINAL_STATUSES,
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
} from "../constants";

const styles = (theme) => ({
  actions: { marginBottom: theme.spacing(2) },
  validateButton: { marginLeft: theme.spacing(1) },
  reviewActions: {
    marginBottom: theme.spacing(2),
    display: "flex",
    gap: theme.spacing(1),
  },
});

class DocumentForm extends Component {
  state = {
    pollCount: 0,
    linkClaimOpen: false,
    editedExtractionData: null,
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

    if (this._pendingReject && prevProps.confirmed !== this.props.confirmed && this.props.confirmed) {
      this._pendingReject = false;
      const { intl } = this.props;
      this.props.rejectExtractionReview(
        doc.uuid,
        formatMessage(intl, "claimlens", "review.mutation.reject")
      );
      setTimeout(() => {
        this.props.fetchDocument(this.props.modulesManager, this.props.document_uuid);
        this.props.fetchAuditLogs(this.props.modulesManager, this.props.document_uuid);
      }, 1000);
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

  handleEditToggle = () => {
    this.setState((prev) => ({
      editedExtractionData: prev.editedExtractionData != null ? null : {},
    }));
  };

  handleFieldChange = (key, value) => {
    this.setState((prev) => ({
      editedExtractionData: {
        ...prev.editedExtractionData,
        [key]: value,
      },
    }));
  };

  handleApproveReview = () => {
    const { document: doc, intl } = this.props;
    const { editedExtractionData } = this.state;
    if (!doc) return;

    let correctedData = null;
    if (editedExtractionData != null && Object.keys(editedExtractionData).length > 0) {
      const original = doc.extractionResult?.structuredData || {};
      correctedData = { ...original };
      Object.entries(editedExtractionData).forEach(([key, val]) => {
        const originalValue = original[key];
        const isComplex = typeof originalValue === "object" && originalValue !== null;
        if (isComplex) {
          try {
            correctedData[key] = JSON.parse(val);
          } catch {
            correctedData[key] = val;
          }
        } else {
          correctedData[key] = val;
        }
      });
    }

    this.props.approveExtractionReview(
      doc.uuid,
      correctedData,
      formatMessage(intl, "claimlens", "review.mutation.approve")
    );

    setTimeout(() => {
      this.setState({ editedExtractionData: null });
      this.props.fetchDocument(this.props.modulesManager, this.props.document_uuid);
      this.props.fetchAuditLogs(this.props.modulesManager, this.props.document_uuid);
    }, 1000);
  };

  handleRejectReview = () => {
    const { document: doc, intl } = this.props;
    if (!doc) return;

    this.props.coreConfirm(
      formatMessage(intl, "claimlens", "review.reject"),
      formatMessage(intl, "claimlens", "review.confirmReject")
    );
    this._pendingReject = true;
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
    const { editedExtractionData } = this.state;
    if (fetchingDocument || !doc) {
      return <CircularProgress />;
    }

    const canProcess = doc.status === STATUS_PENDING;
    const isProcessing = PROCESSING_STATUSES.includes(doc.status);
    const canValidate = doc.status === STATUS_COMPLETED && !!doc.claimUuid;
    const canReview = doc.status === STATUS_REVIEW_REQUIRED
      && this.props.rights.includes(RIGHT_CLAIMLENS_REVIEW_EXTRACTION);

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

        {canReview && (
          <div className={classes.reviewActions}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleApproveReview}
              disabled={submittingMutation}
            >
              {formatMessage(intl, "claimlens", "review.approve")}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.handleRejectReview}
              disabled={submittingMutation}
            >
              {formatMessage(intl, "claimlens", "review.reject")}
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
          <ExtractionResultPanel
            extractionResult={doc.extractionResult}
            editable={canReview}
            editedData={editedExtractionData}
            onFieldChange={this.handleFieldChange}
            onEditToggle={this.handleEditToggle}
          />
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
  confirmed: state.core.confirmed,
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
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
      approveExtractionReview,
      rejectExtractionReview,
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
