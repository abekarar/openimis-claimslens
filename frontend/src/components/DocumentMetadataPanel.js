import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Grid, Paper, Typography, Button } from "@material-ui/core";
import { GetApp } from "@material-ui/icons";
import { formatMessage, formatDateFromISO, withModulesManager, withHistory, historyPush } from "@openimis/fe-core";
import StatusBadge from "./StatusBadge";
import ConfidenceBar from "./ConfidenceBar";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  label: { fontWeight: "bold", color: theme.palette.text.secondary },
  value: { marginBottom: theme.spacing(1) },
  claimLink: {
    cursor: "pointer",
    color: theme.palette.primary.main,
    "&:hover": { textDecoration: "underline" },
  },
  downloadButton: { marginTop: theme.spacing(1) },
});

class DocumentMetadataPanel extends Component {
  formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  render() {
    const { classes, intl, modulesManager, document: doc } = this.props;
    if (!doc) return null;

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "document.metadata")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.filename")}
            </Typography>
            <Typography className={classes.value}>{doc.originalFilename}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.mimeType")}
            </Typography>
            <Typography className={classes.value}>{doc.mimeType}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.fileSize")}
            </Typography>
            <Typography className={classes.value}>
              {this.formatFileSize(doc.fileSize)}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.status")}
            </Typography>
            <StatusBadge status={doc.status} />
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.documentType")}
            </Typography>
            <Typography className={classes.value}>
              {doc.documentType ? `${doc.documentType.code} - ${doc.documentType.name}` : "-"}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.classificationConfidence")}
            </Typography>
            {doc.classificationConfidence ? (
              <ConfidenceBar value={doc.classificationConfidence} />
            ) : (
              <Typography className={classes.value}>-</Typography>
            )}
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.dateCreated")}
            </Typography>
            <Typography className={classes.value}>
              {formatDateFromISO(modulesManager, intl, doc.dateCreated)}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.dateUpdated")}
            </Typography>
            <Typography className={classes.value}>
              {doc.dateUpdated ? formatDateFromISO(modulesManager, intl, doc.dateUpdated) : "-"}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.language")}
            </Typography>
            <Typography className={classes.value}>
              {doc.language
                ? formatMessage(intl, "claimlens", `language.${doc.language}`) || doc.language
                : "-"}
            </Typography>
          </Grid>
          {doc.engineConfig && (
            <Grid item xs={6}>
              <Typography className={classes.label}>
                {formatMessage(intl, "claimlens", "document.engineConfig")}
              </Typography>
              <Typography className={classes.value}>
                {doc.engineConfig.name} ({doc.engineConfig.adapter})
              </Typography>
            </Grid>
          )}
          <Grid item xs={3}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "document.claimUuid")}
            </Typography>
            {doc.claimUuid ? (
              <Typography
                className={`${classes.value} ${classes.claimLink}`}
                onClick={() =>
                  historyPush(
                    modulesManager,
                    this.props.history,
                    "claim.route.claimEdit",
                    [doc.claimUuid]
                  )
                }
              >
                {doc.claimUuid}
              </Typography>
            ) : (
              <Typography className={classes.value}>-</Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GetApp />}
              className={classes.downloadButton}
              href={`/api/claimlens/documents/${doc.uuid}/download/`}
              target="_blank"
            >
              {formatMessage(intl, "claimlens", "document.download")}
            </Button>
          </Grid>
          {doc.errorMessage && (
            <Grid item xs={12}>
              <Typography className={classes.label}>
                {formatMessage(intl, "claimlens", "document.errorMessage")}
              </Typography>
              <Typography className={classes.value} color="error">
                {doc.errorMessage}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  }
}

export default withModulesManager(withHistory(injectIntl(withStyles(styles)(DocumentMetadataPanel))));
