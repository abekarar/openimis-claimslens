import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Paper, Typography, CircularProgress, Box } from "@material-ui/core";
import { injectIntl } from "react-intl";
import { formatMessage } from "@openimis/fe-core";

const styles = (theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    position: "sticky",
    top: theme.spacing(2),
  },
  previewContainer: {
    width: "100%",
    height: 500,
    overflow: "auto",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.grey[50],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  title: {
    marginBottom: theme.spacing(1),
  },
});

class DocumentPreviewPanel extends Component {
  state = {
    loading: true,
  };

  handleLoad = () => {
    this.setState({ loading: false });
  };

  render() {
    const { classes, intl, documentUuid, mimeType, objectUrl } = this.props;
    const { loading } = this.state;

    const isPdf = mimeType === "application/pdf";
    const isImage = mimeType && mimeType.startsWith("image/");
    const src = objectUrl || (documentUuid ? `/api/claimlens/documents/${documentUuid}/download/` : null);

    if (!src) return null;

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "preview.title")}
        </Typography>
        <div className={classes.previewContainer}>
          {loading && <CircularProgress />}
          {isPdf && (
            <iframe
              src={src}
              className={classes.iframe}
              title="Document preview"
              onLoad={this.handleLoad}
              style={loading ? { display: "none" } : {}}
            />
          )}
          {isImage && (
            <img
              src={src}
              className={classes.image}
              alt="Document preview"
              onLoad={this.handleLoad}
              style={loading ? { display: "none" } : {}}
            />
          )}
          {!isPdf && !isImage && (
            <Typography color="textSecondary">
              {formatMessage(intl, "claimlens", "preview.unsupported")}
            </Typography>
          )}
        </div>
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(DocumentPreviewPanel));
