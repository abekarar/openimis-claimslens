import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, TextField,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { createDocumentType, updateDocumentType } from "../actions";

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
    extractionTemplate: dt && dt.extractionTemplate ? JSON.stringify(dt.extractionTemplate, null, 2) : "",
    fieldDefinitions: dt && dt.fieldDefinitions ? JSON.stringify(dt.fieldDefinitions, null, 2) : "",
    isActive: dt ? !!dt.isActive : true,
    jsonError: null,
  });

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState(this.initialState(this.props.documentType));
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
          <TextField
            className={classes.field}
            fullWidth
            multiline
            rows={4}
            label={formatMessage(intl, "claimlens", "documentType.extractionTemplate")}
            value={extractionTemplate}
            onChange={this.handleChange("extractionTemplate")}
            error={!!jsonError}
            helperText={jsonError}
          />
          <TextField
            className={classes.field}
            fullWidth
            multiline
            rows={4}
            label={formatMessage(intl, "claimlens", "documentType.fieldDefinitions")}
            value={fieldDefinitions}
            onChange={this.handleChange("fieldDefinitions")}
            error={!!jsonError}
            helperText={jsonError}
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
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ createDocumentType, updateDocumentType }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(DocumentTypeForm)))
);
