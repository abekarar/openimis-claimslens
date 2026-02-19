import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, TextField,
} from "@material-ui/core";
import {
  Accordion, AccordionDetails, AccordionSummary,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import {
  createDocumentType, updateDocumentType,
  fetchPromptTemplates, savePromptVersion, deletePromptOverride,
} from "../actions";
import JsonEditor from "./JsonEditor";

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
});

class DocumentTypeForm extends Component {
  constructor(props) {
    super(props);
    this.state = this.initialState(props.documentType);
  }

  initialState = (dt) => ({
    code: dt ? dt.code || "" : "",
    name: dt ? dt.name || "" : "",
    classificationHints: dt ? dt.classificationHints || "" : "",
    extractionTemplate: dt && dt.extractionTemplate
      ? (typeof dt.extractionTemplate === "string" ? dt.extractionTemplate : JSON.stringify(dt.extractionTemplate, null, 2))
      : "",
    fieldDefinitions: dt && dt.fieldDefinitions
      ? (typeof dt.fieldDefinitions === "string" ? dt.fieldDefinitions : JSON.stringify(dt.fieldDefinitions, null, 2))
      : "",
    isActive: dt ? !!dt.isActive : true,
    jsonError: null,
    useClassificationOverride: false,
    classificationOverride: "",
    useExtractionOverride: false,
    extractionOverride: "",
  });

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState(this.initialState(this.props.documentType));
      // Fetch existing prompt overrides for this doc type
      if (this.props.documentType && this.props.documentType.uuid) {
        this.props.fetchPromptTemplates(
          this.props.modulesManager,
          [`isActive: true`, `documentTypeId: "${this.props.documentType.uuid}"`]
        );
      }
    }
    // Populate override state from fetched templates
    if (this.props.promptTemplates !== prevProps.promptTemplates && this.props.documentType) {
      const dtId = this.props.documentType.uuid;
      const classification = this.props.promptTemplates.find(
        (t) => t.promptType === "classification" && t.documentType && t.documentType.uuid === dtId
      );
      const extraction = this.props.promptTemplates.find(
        (t) => t.promptType === "extraction" && t.documentType && t.documentType.uuid === dtId
      );
      if (classification) {
        this.setState({ useClassificationOverride: true, classificationOverride: classification.content });
      }
      if (extraction) {
        this.setState({ useExtractionOverride: true, extractionOverride: extraction.content });
      }
    }
  }

  handleChange = (field) => (e) => {
    this.setState({ [field]: e.target.value, jsonError: null });
  };

  handleCheckboxChange = (field) => (e) => {
    this.setState({ [field]: e.target.checked });
  };

  handleSave = () => {
    const { documentType, intl } = this.props;
    const { code, name, classificationHints, extractionTemplate, fieldDefinitions, isActive } = this.state;

    const data = { code, name, isActive };
    if (classificationHints) data.classificationHints = classificationHints;

    try {
      if (extractionTemplate) data.extractionTemplate = JSON.parse(extractionTemplate);
      if (fieldDefinitions) data.fieldDefinitions = JSON.parse(fieldDefinitions);
    } catch (e) {
      this.setState({ jsonError: e.message });
      return;
    }

    if (documentType && documentType.uuid) {
      data.id = documentType.uuid;
      this.props.updateDocumentType(
        data,
        formatMessage(intl, "claimlens", "documentType.mutation.update")
      );

      // Handle prompt overrides
      const { useClassificationOverride, classificationOverride, useExtractionOverride, extractionOverride } = this.state;
      if (useClassificationOverride && classificationOverride.trim()) {
        this.props.savePromptVersion(
          { promptType: "classification", content: classificationOverride, changeSummary: "Override update", documentTypeId: documentType.uuid },
          formatMessage(intl, "claimlens", "documentType.promptOverrides.mutation.save")
        );
      } else if (!useClassificationOverride) {
        this.props.deletePromptOverride(
          "classification", documentType.uuid,
          formatMessage(intl, "claimlens", "documentType.promptOverrides.mutation.delete")
        );
      }
      if (useExtractionOverride && extractionOverride.trim()) {
        this.props.savePromptVersion(
          { promptType: "extraction", content: extractionOverride, changeSummary: "Override update", documentTypeId: documentType.uuid },
          formatMessage(intl, "claimlens", "documentType.promptOverrides.mutation.save")
        );
      } else if (!useExtractionOverride) {
        this.props.deletePromptOverride(
          "extraction", documentType.uuid,
          formatMessage(intl, "claimlens", "documentType.promptOverrides.mutation.delete")
        );
      }
    } else {
      this.props.createDocumentType(
        data,
        formatMessage(intl, "claimlens", "documentType.mutation.create")
      );
    }
    this.props.onClose(true);
  };

  render() {
    const { intl, classes, open, onClose, documentType } = this.props;
    const { code, name, classificationHints, extractionTemplate, fieldDefinitions, isActive, jsonError } = this.state;

    const isEdit = !!(documentType && documentType.uuid);
    const title = isEdit
      ? formatMessage(intl, "claimlens", "documentType.form.editTitle")
      : formatMessage(intl, "claimlens", "documentType.form.createTitle");

    return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="md">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            className={classes.field}
            fullWidth
            required
            label={formatMessage(intl, "claimlens", "documentType.code")}
            value={code}
            onChange={this.handleChange("code")}
          />
          <TextField
            className={classes.field}
            fullWidth
            required
            label={formatMessage(intl, "claimlens", "documentType.name")}
            value={name}
            onChange={this.handleChange("name")}
          />
          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "documentType.classificationHints")}
            value={classificationHints}
            onChange={this.handleChange("classificationHints")}
          />
          <JsonEditor
            label={formatMessage(intl, "claimlens", "documentType.extractionTemplate")}
            value={extractionTemplate}
            onChange={(val) => this.setState({ extractionTemplate: val, jsonError: null })}
            error={jsonError}
            height="150px"
          />
          <JsonEditor
            label={formatMessage(intl, "claimlens", "documentType.fieldDefinitions")}
            value={fieldDefinitions}
            onChange={(val) => this.setState({ fieldDefinitions: val, jsonError: null })}
            error={jsonError}
            height="150px"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={this.handleCheckboxChange("isActive")}
                color="primary"
              />
            }
            label={formatMessage(intl, "claimlens", "documentType.active")}
          />

          {isEdit && (
            <Accordion style={{ marginTop: 16 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>
                  {formatMessage(intl, "claimlens", "documentType.promptOverrides.title")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails style={{ display: "block" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={this.state.useClassificationOverride}
                      onChange={(e) => this.setState({ useClassificationOverride: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={formatMessage(intl, "claimlens", "documentType.promptOverrides.useCustomClassification")}
                />
                {this.state.useClassificationOverride && (
                  <TextField
                    className={classes.field}
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder={formatMessage(intl, "claimlens", "documentType.promptOverrides.usingGlobal")}
                    value={this.state.classificationOverride}
                    onChange={this.handleChange("classificationOverride")}
                  />
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={this.state.useExtractionOverride}
                      onChange={(e) => this.setState({ useExtractionOverride: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={formatMessage(intl, "claimlens", "documentType.promptOverrides.useCustomExtraction")}
                />
                {this.state.useExtractionOverride && (
                  <TextField
                    className={classes.field}
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder={formatMessage(intl, "claimlens", "documentType.promptOverrides.usingGlobal")}
                    value={this.state.extractionOverride}
                    onChange={this.handleChange("extractionOverride")}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>
            {formatMessage(intl, "claimlens", "action.cancel")}
          </Button>
          <Button
            onClick={this.handleSave}
            color="primary"
            variant="contained"
            disabled={!code || !name}
          >
            {formatMessage(intl, "claimlens", "action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  submittingMutation: state.claimlens.submittingMutation,
  promptTemplates: state.claimlens.promptTemplates,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({
    createDocumentType, updateDocumentType,
    fetchPromptTemplates, savePromptVersion, deletePromptOverride,
  }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(DocumentTypeForm)))
);
