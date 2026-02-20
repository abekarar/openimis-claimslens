import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Button, Chip, CircularProgress, Grid, Typography, Box } from "@material-ui/core";
import { NavigateNext } from "@material-ui/icons";
import {
  withModulesManager,
  formatMessage,
  journalize,
  coreConfirm,
  withHistory,
  historyPush,
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
import DocumentPreviewPanel from "./DocumentPreviewPanel";
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
  STATUS_FAILED,
  PROCESSING_STATUSES,
  TERMINAL_STATUSES,
  POLL_MAX_ATTEMPTS,
} from "../constants";

const POLL_FAST_MS = 3000;
const POLL_SLOW_MS = 5000;
const POLL_FAST_COUNT = 10;

const styles = (theme) => ({
  actions: { marginBottom: theme.spacing(2) },
  validateButton: { marginLeft: theme.spacing(1) },
  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  breadcrumbLink: {
    cursor: "pointer",
    color: theme.palette.primary.main,
    "&:hover": { textDecoration: "underline" },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  errorContainer: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
  sectionNav: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  sectionChip: {
    cursor: "pointer",
  },
});

class DocumentForm extends Component {
  state = {
    pollCount: 0,
    linkClaimOpen: false,
    confirmedAction: null,
  };

  componentDidMount() {
    const { document_uuid } = this.props;
    if (document_uuid) {
      this.props.fetchDocument(this.props.modulesManager, document_uuid);
      this.props.fetchAuditLogs(this.props.modulesManager, document_uuid);
    }
  }

  componentDidUpdate(prevProps) {
    const { document: doc, confirmed } = this.props;

    if (doc && !prevProps.document) {
      this.startPollingIfNeeded();
    }

    if (
      doc &&
      prevProps.document &&
      doc.status !== prevProps.document.status
    ) {
      if (TERMINAL_STATUSES.includes(doc.status ? doc.status.toLowerCase() : doc.status)) {
        this.stopPolling();
      }
    }

    if (confirmed !== prevProps.confirmed && !!confirmed) {
      this.onConfirmAction();
    }
  }

  componentWillUnmount() {
    this.stopPolling();
  }

  startPollingIfNeeded() {
    const { document: doc } = this.props;
    if (doc && PROCESSING_STATUSES.includes(doc.status ? doc.status.toLowerCase() : doc.status)) {
      this.schedulePoll();
    }
  }

  schedulePoll() {
    const interval = this.state.pollCount < POLL_FAST_COUNT ? POLL_FAST_MS : POLL_SLOW_MS;
    this.pollTimeout = setTimeout(() => {
      if (this.state.pollCount >= POLL_MAX_ATTEMPTS) {
        this.stopPolling();
        return;
      }
      this.props.fetchDocument(
        this.props.modulesManager,
        this.props.document_uuid
      );
      this.setState((prev) => ({ pollCount: prev.pollCount + 1 }), () => {
        this.schedulePoll();
      });
    }, interval);
  }

  stopPolling() {
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  handleProcess = () => {
    const { intl } = this.props;
    this.setState({ confirmedAction: "process" });
    this.props.coreConfirm(
      formatMessage(intl, "claimlens", "confirm.process.title"),
      formatMessage(intl, "claimlens", "confirm.process.message")
    );
  };

  handleRunValidation = () => {
    const { intl } = this.props;
    this.setState({ confirmedAction: "validate" });
    this.props.coreConfirm(
      formatMessage(intl, "claimlens", "confirm.validate.title"),
      formatMessage(intl, "claimlens", "confirm.validate.message")
    );
  };

  onConfirmAction = () => {
    const { confirmedAction } = this.state;
    const { document: doc, intl } = this.props;
    if (!doc) return;

    if (confirmedAction === "process") {
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
    } else if (confirmedAction === "validate") {
      this.props.runValidation(
        doc.uuid,
        formatMessage(intl, "claimlens", "action.runValidation")
      );
    }
    this.setState({ confirmedAction: null });
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

  scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
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
      return (
        <Box className={classes.loadingContainer}>
          <CircularProgress />
        </Box>
      );
    }

    const docStatus = doc.status ? doc.status.toLowerCase() : doc.status;
    const canProcess = docStatus === STATUS_PENDING;
    const isProcessing = PROCESSING_STATUSES.includes(docStatus);
    const canValidate = docStatus === STATUS_COMPLETED && !!doc.claimUuid;

    const findings = this.gatherFindings(doc.validationResults);
    const proposals = this.gatherProposals(doc.validationResults);

    return (
      <div>
        <div className={classes.breadcrumbs}>
          <Typography
            variant="body2"
            className={classes.breadcrumbLink}
            onClick={() => historyPush(this.props.modulesManager, this.props.history, "claimlens.route.documents")}
          >
            {formatMessage(intl, "claimlens", "menu.documents")}
          </Typography>
          <NavigateNext fontSize="small" />
          <Typography variant="body2">
            {formatMessage(intl, "claimlens", "document.detailTitle")}
          </Typography>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DocumentPreviewPanel
              documentUuid={doc.uuid}
              mimeType={doc.mimeType}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <div className={classes.sectionNav}>
              <Chip
                label={formatMessage(intl, "claimlens", "section.metadata")}
                className={classes.sectionChip}
                onClick={() => this.scrollToSection("section-metadata")}
                variant="outlined"
                size="small"
              />
              {doc.extractionResult && (
                <Chip
                  label={formatMessage(intl, "claimlens", "section.extraction")}
                  className={classes.sectionChip}
                  onClick={() => this.scrollToSection("section-extraction")}
                  variant="outlined"
                  size="small"
                />
              )}
              {doc.validationResults && doc.validationResults.length > 0 && (
                <Chip
                  label={formatMessage(intl, "claimlens", "section.validation")}
                  className={classes.sectionChip}
                  onClick={() => this.scrollToSection("section-validation")}
                  variant="outlined"
                  size="small"
                />
              )}
              {findings.length > 0 && (
                <Chip
                  label={formatMessage(intl, "claimlens", "section.findings")}
                  className={classes.sectionChip}
                  onClick={() => this.scrollToSection("section-findings")}
                  variant="outlined"
                  size="small"
                />
              )}
              {proposals.length > 0 && (
                <Chip
                  label={formatMessage(intl, "claimlens", "section.registry")}
                  className={classes.sectionChip}
                  onClick={() => this.scrollToSection("section-registry")}
                  variant="outlined"
                  size="small"
                />
              )}
              <Chip
                label={formatMessage(intl, "claimlens", "section.auditLog")}
                className={classes.sectionChip}
                onClick={() => this.scrollToSection("section-auditlog")}
                variant="outlined"
                size="small"
              />
            </div>

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

            {docStatus === STATUS_COMPLETED && !doc.claimUuid && (
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

            {docStatus === STATUS_FAILED && (
              <div className={classes.actions}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleProcess}
                  disabled={submittingMutation}
                >
                  {formatMessage(intl, "claimlens", "action.retryProcessing")}
                </Button>
              </div>
            )}

            <ProcessingTimeline status={doc.status} />
            <div id="section-metadata">
              <DocumentMetadataPanel document={doc} />
            </div>
            {doc.extractionResult && (
              <div id="section-extraction">
                <ExtractionResultPanel extractionResult={doc.extractionResult} />
              </div>
            )}
            {doc.validationResults && doc.validationResults.length > 0 && (
              <div id="section-validation">
                <ValidationResultPanel validationResults={doc.validationResults} />
              </div>
            )}
            {findings.length > 0 && (
              <div id="section-findings">
                <ValidationFindingsPanel
                  findings={findings}
                  onResolveFinding={this.handleResolveFinding}
                />
              </div>
            )}
            {proposals.length > 0 && (
              <div id="section-registry">
                <RegistryUpdatePanel
                  proposals={proposals}
                  onReviewProposal={this.handleReviewProposal}
                  onApplyProposal={this.handleApplyProposal}
                />
              </div>
            )}
            <div id="section-auditlog">
              <AuditLogPanel auditLogs={this.props.auditLogs} />
            </div>
          </Grid>
        </Grid>

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
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withStyles(styles)(DocumentForm)))
  )
);
