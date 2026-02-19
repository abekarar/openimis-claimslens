import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Paper, TextField, Typography,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { fetchPromptTemplates, savePromptVersion } from "../actions";
import { RIGHT_CLAIMLENS_MANAGE_PROMPT_TEMPLATES } from "../constants";
import PromptVersionHistoryDialog from "./PromptVersionHistoryDialog";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2) },
  title: { marginBottom: theme.spacing(1) },
  chip: { marginRight: theme.spacing(1) },
  meta: { display: "flex", alignItems: "center", marginBottom: theme.spacing(1) },
  dateText: { color: theme.palette.text.secondary, fontSize: "0.85rem" },
  actions: { marginTop: theme.spacing(1), display: "flex", gap: theme.spacing(1) },
  sectionTitle: { marginTop: theme.spacing(3), marginBottom: theme.spacing(2) },
});

class PromptTemplatesPanel extends Component {
  state = {
    editClassification: "",
    editExtraction: "",
    saveSummaryOpen: null, // null or "classification" or "extraction"
    changeSummary: "",
    historyOpen: null, // null or "classification" or "extraction"
    initialized: false,
  };

  componentDidMount() {
    this.props.fetchPromptTemplates(this.props.modulesManager, ["isActive: true"]);
  }

  componentDidUpdate(prevProps) {
    const { promptTemplates } = this.props;
    if (promptTemplates !== prevProps.promptTemplates && !this.state.initialized) {
      const classification = promptTemplates.find((t) => t.promptType === "classification" && !t.documentType);
      const extraction = promptTemplates.find((t) => t.promptType === "extraction" && !t.documentType);
      this.setState({
        editClassification: classification ? classification.content : "",
        editExtraction: extraction ? extraction.content : "",
        initialized: true,
      });
    }
  }

  getTemplate = (promptType) => {
    return this.props.promptTemplates.find(
      (t) => t.promptType === promptType && !t.documentType
    );
  };

  handleSaveOpen = (promptType) => {
    this.setState({ saveSummaryOpen: promptType, changeSummary: "" });
  };

  handleSaveConfirm = () => {
    const { saveSummaryOpen, changeSummary, editClassification, editExtraction } = this.state;
    const { intl } = this.props;
    const content = saveSummaryOpen === "classification" ? editClassification : editExtraction;

    this.props.savePromptVersion(
      { promptType: saveSummaryOpen, content, changeSummary },
      formatMessage(intl, "claimlens", "settings.promptTemplates.mutation.save")
    );
    this.setState({ saveSummaryOpen: null, changeSummary: "", initialized: false });
    setTimeout(() => {
      this.props.fetchPromptTemplates(this.props.modulesManager, ["isActive: true"]);
    }, 1000);
  };

  handleHistoryClose = (reactivated) => {
    this.setState({ historyOpen: null });
    if (reactivated) {
      this.setState({ initialized: false });
      this.props.fetchPromptTemplates(this.props.modulesManager, ["isActive: true"]);
    }
  };

  renderPromptCard = (promptType) => {
    const { classes, intl, rights } = this.props;
    const template = this.getTemplate(promptType);
    const stateKey = promptType === "classification" ? "editClassification" : "editExtraction";
    const canEdit = rights.includes(RIGHT_CLAIMLENS_MANAGE_PROMPT_TEMPLATES);
    const titleKey = promptType === "classification"
      ? "settings.promptTemplates.classification"
      : "settings.promptTemplates.extraction";

    return (
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.title}>
          {formatMessage(intl, "claimlens", titleKey)}
        </Typography>
        {template && (
          <div className={classes.meta}>
            <Chip
              label={`${formatMessage(intl, "claimlens", "settings.promptTemplates.version")} ${template.version}`}
              size="small"
              className={classes.chip}
            />
            <Typography className={classes.dateText}>
              {template.dateCreated ? new Date(template.dateCreated).toLocaleString() : ""}
            </Typography>
          </div>
        )}
        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={this.state[stateKey]}
          onChange={(e) => this.setState({ [stateKey]: e.target.value })}
          disabled={!canEdit}
        />
        <div className={classes.actions}>
          {canEdit && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => this.handleSaveOpen(promptType)}
              disabled={!this.state[stateKey] || this.state[stateKey] === (template ? template.content : "")}
            >
              {formatMessage(intl, "claimlens", "settings.promptTemplates.save")}
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={() => this.setState({ historyOpen: promptType })}
          >
            {formatMessage(intl, "claimlens", "settings.promptTemplates.history")}
          </Button>
        </div>
      </Paper>
    );
  };

  render() {
    const { classes, intl } = this.props;
    const { saveSummaryOpen, changeSummary, historyOpen } = this.state;

    return (
      <div>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "claimlens", "settings.promptTemplates.title")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {this.renderPromptCard("classification")}
          </Grid>
          <Grid item xs={12} md={6}>
            {this.renderPromptCard("extraction")}
          </Grid>
        </Grid>

        {/* Save summary dialog */}
        <Dialog open={!!saveSummaryOpen} onClose={() => this.setState({ saveSummaryOpen: null })} maxWidth="sm" fullWidth>
          <DialogTitle>
            {formatMessage(intl, "claimlens", "settings.promptTemplates.changeSummary")}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              label={formatMessage(intl, "claimlens", "settings.promptTemplates.changeSummaryRequired")}
              value={changeSummary}
              onChange={(e) => this.setState({ changeSummary: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({ saveSummaryOpen: null })}>
              {formatMessage(intl, "claimlens", "action.cancel")}
            </Button>
            <Button
              onClick={this.handleSaveConfirm}
              color="primary"
              variant="contained"
              disabled={!changeSummary.trim()}
            >
              {formatMessage(intl, "claimlens", "settings.promptTemplates.save")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Version history dialog */}
        {historyOpen && (
          <PromptVersionHistoryDialog
            open={!!historyOpen}
            promptType={historyOpen}
            documentTypeId={null}
            onClose={this.handleHistoryClose}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  promptTemplates: state.claimlens.promptTemplates,
  fetchingPromptTemplates: state.claimlens.fetchingPromptTemplates,
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchPromptTemplates, savePromptVersion }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(PromptTemplatesPanel)))
);
