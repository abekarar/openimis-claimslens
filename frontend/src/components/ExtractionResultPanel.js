import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Paper, Typography, Grid, Button, Collapse, Box } from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import ConfidenceBar from "./ConfidenceBar";
import JsonViewToggle from "./JsonViewToggle";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  summary: { marginBottom: theme.spacing(2) },
  label: { fontWeight: "bold", color: theme.palette.text.secondary },
  rawResponseContainer: { marginTop: theme.spacing(2) },
  rawResponse: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "monospace",
    fontSize: "0.8rem",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: 4,
    maxHeight: 400,
    overflow: "auto",
  },
});

class ExtractionResultPanel extends Component {
  state = {
    parsedFields: null,
    parsedConfidences: null,
    lastExtractionResult: null,
    showRawResponse: false,
  };

  static getDerivedStateFromProps(props, state) {
    if (props.extractionResult !== state.lastExtractionResult) {
      const rawFields = props.extractionResult?.structuredData || {};
      const rawConfidences = props.extractionResult?.fieldConfidences || {};
      return {
        parsedFields: typeof rawFields === "string" ? JSON.parse(rawFields) : rawFields,
        parsedConfidences: typeof rawConfidences === "string" ? JSON.parse(rawConfidences) : rawConfidences,
        lastExtractionResult: props.extractionResult,
      };
    }
    return null;
  }

  render() {
    const { classes, intl, extractionResult } = this.props;
    if (!extractionResult) return null;

    const fields = this.state.parsedFields;
    const confidences = this.state.parsedConfidences;

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "extraction.title")}
        </Typography>

        <Grid container spacing={2} className={classes.summary}>
          <Grid item xs={4}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "extraction.aggregateConfidence")}
            </Typography>
            <ConfidenceBar value={extractionResult.aggregateConfidence} />
          </Grid>
          <Grid item xs={4}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "extraction.processingTime")}
            </Typography>
            <Typography>{extractionResult.processingTimeMs} ms</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography className={classes.label}>
              {formatMessage(intl, "claimlens", "extraction.tokensUsed")}
            </Typography>
            <Typography>{extractionResult.tokensUsed}</Typography>
          </Grid>
        </Grid>

        <JsonViewToggle data={fields} confidences={confidences} />

        {extractionResult.rawLlmResponse && (
          <div className={classes.rawResponseContainer}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => this.setState((prev) => ({ showRawResponse: !prev.showRawResponse }))}
            >
              {formatMessage(intl, "claimlens", this.state.showRawResponse ? "extraction.hideRawResponse" : "extraction.showRawResponse")}
            </Button>
            <Collapse in={this.state.showRawResponse}>
              <Box className={classes.rawResponse} mt={1}>
                {extractionResult.rawLlmResponse}
              </Box>
            </Collapse>
          </div>
        )}
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(ExtractionResultPanel));
