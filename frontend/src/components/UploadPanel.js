import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Button, LinearProgress, Box, TextField, IconButton,
} from "@material-ui/core";
import { CloudUpload, CheckCircle, Error as ErrorIcon, Delete, Refresh } from "@material-ui/icons";
import {
  withModulesManager,
  formatMessage,
  withHistory,
  historyPush,
} from "@openimis/fe-core";
import { uploadDocument } from "../actions";
import DocumentPreviewPanel from "./DocumentPreviewPanel";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  ROUTE_CLAIMLENS_DOCUMENT,
} from "../constants";

const styles = (theme) => ({
  paper: { padding: theme.spacing(3) },
  dropzone: {
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(6),
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    "&:hover": { borderColor: theme.palette.primary.main },
  },
  dropzoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  icon: { fontSize: 48, color: theme.palette.text.secondary, marginBottom: theme.spacing(1) },
  fileInfo: { marginTop: theme.spacing(2), marginBottom: theme.spacing(1) },
  fileActions: { marginBottom: theme.spacing(2), display: "flex", gap: theme.spacing(1) },
  actions: { marginTop: theme.spacing(2) },
  progress: { marginTop: theme.spacing(2) },
  success: { color: theme.palette.success.main, marginTop: theme.spacing(2) },
  error: { color: theme.palette.error.main, marginTop: theme.spacing(2) },
});

class UploadPanel extends Component {
  state = {
    selectedFile: null,
    previewUrl: null,
    validationError: null,
    dragOver: false,
    language: "",
    claimUuid: "",
  };

  fileInputRef = React.createRef();

  componentDidUpdate(prevProps) {
    if (!prevProps.uploadResponse && this.props.uploadResponse) {
      const doc = this.props.uploadResponse.document;
      if (doc && doc.uuid) {
        historyPush(
          this.props.modulesManager,
          this.props.history,
          "claimlens.route.document",
          [doc.uuid]
        );
      }
    }
  }

  componentWillUnmount() {
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
  }

  handleDragOver = (e) => {
    e.preventDefault();
    this.setState({ dragOver: true });
  };

  handleDragLeave = (e) => {
    e.preventDefault();
    this.setState({ dragOver: false });
  };

  handleDrop = (e) => {
    e.preventDefault();
    this.setState({ dragOver: false });
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleFileSelect(files[0]);
    }
  };

  handleClick = () => {
    this.fileInputRef.current.click();
  };

  handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      this.handleFileSelect(e.target.files[0]);
    }
  };

  handleFileSelect = (file) => {
    const { intl } = this.props;

    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.setState({
        selectedFile: null,
        previewUrl: null,
        validationError: formatMessage(intl, "claimlens", "upload.invalidType"),
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.setState({
        selectedFile: null,
        previewUrl: null,
        validationError: formatMessage(intl, "claimlens", "upload.tooLarge")
          .replace("{maxSize}", MAX_FILE_SIZE_MB),
      });
      return;
    }

    this.setState({
      selectedFile: file,
      previewUrl: URL.createObjectURL(file),
      validationError: null,
    });
  };

  handleRemoveFile = () => {
    if (this.state.previewUrl) {
      URL.revokeObjectURL(this.state.previewUrl);
    }
    this.setState({ selectedFile: null, previewUrl: null, validationError: null });
    this.fileInputRef.current.value = "";
  };

  handleReplaceFile = () => {
    this.fileInputRef.current.click();
  };

  handleUpload = () => {
    const { selectedFile, language, claimUuid } = this.state;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (language) formData.append("language", language);
      if (claimUuid) formData.append("claim_uuid", claimUuid);
      this.props.uploadDocument(formData);
    }
  };

  formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB"];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  render() {
    const { classes, intl, uploading, uploadProgress, uploadResponse, uploadError } = this.props;
    const { selectedFile, previewUrl, validationError, dragOver, language, claimUuid } = this.state;

    return (
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          {formatMessage(intl, "claimlens", "upload.title")}
        </Typography>

        {!selectedFile && (
          <div
            className={`${classes.dropzone} ${dragOver ? classes.dropzoneActive : ""}`}
            onDragOver={this.handleDragOver}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}
            onClick={this.handleClick}
          >
            <CloudUpload className={classes.icon} />
            <Typography>
              {dragOver
                ? formatMessage(intl, "claimlens", "upload.dropzoneActive")
                : formatMessage(intl, "claimlens", "upload.dropzone")}
            </Typography>
          </div>
        )}

        <input
          ref={this.fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(",")}
          style={{ display: "none" }}
          onChange={this.handleInputChange}
        />

        {validationError && (
          <Typography className={classes.error}>
            <ErrorIcon fontSize="small" style={{ verticalAlign: "middle", marginRight: 4 }} />
            {validationError}
          </Typography>
        )}

        {selectedFile && previewUrl && !validationError && (
          <>
            <DocumentPreviewPanel
              objectUrl={previewUrl}
              mimeType={selectedFile.type}
            />
            <Typography className={classes.fileInfo}>
              {formatMessage(intl, "claimlens", "upload.fileSelected")
                .replace("{filename}", selectedFile.name)
                .replace("{size}", this.formatFileSize(selectedFile.size))}
            </Typography>
            <div className={classes.fileActions}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={this.handleReplaceFile}
              >
                {formatMessage(intl, "claimlens", "upload.replaceFile")}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<Delete />}
                onClick={this.handleRemoveFile}
              >
                {formatMessage(intl, "claimlens", "upload.removeFile")}
              </Button>
            </div>
          </>
        )}

        <TextField
          label={formatMessage(intl, "claimlens", "upload.language")}
          placeholder="e.g. en, fr, sw"
          value={language}
          onChange={(e) => this.setState({ language: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label={formatMessage(intl, "claimlens", "upload.claimUuid")}
          placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          value={claimUuid}
          onChange={(e) => this.setState({ claimUuid: e.target.value })}
          fullWidth
          margin="normal"
        />

        {uploading && (
          <Box className={classes.progress}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2">
              {formatMessage(intl, "claimlens", "upload.uploading").replace(
                "{progress}",
                uploadProgress
              )}
            </Typography>
          </Box>
        )}

        {uploadResponse && (
          <Typography className={classes.success}>
            <CheckCircle fontSize="small" style={{ verticalAlign: "middle", marginRight: 4 }} />
            {formatMessage(intl, "claimlens", "upload.success")}
          </Typography>
        )}

        {uploadError && (
          <Typography className={classes.error}>
            <ErrorIcon fontSize="small" style={{ verticalAlign: "middle", marginRight: 4 }} />
            {formatMessage(intl, "claimlens", "upload.error").replace("{error}", uploadError)}
          </Typography>
        )}

        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleUpload}
            disabled={!selectedFile || uploading || !!validationError}
          >
            {formatMessage(intl, "claimlens", "upload.uploadButton")}
          </Button>
        </div>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  uploading: state.claimlens.uploading,
  uploadProgress: state.claimlens.uploadProgress,
  uploadResponse: state.claimlens.uploadResponse,
  uploadError: state.claimlens.uploadError,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ uploadDocument }, dispatch);

export default withModulesManager(
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withStyles(styles)(UploadPanel)))
  )
);
