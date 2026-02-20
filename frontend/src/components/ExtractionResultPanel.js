import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, Button, Collapse, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
} from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import ConfidenceBar from "./ConfidenceBar";
import JsonViewToggle from "./JsonViewToggle";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
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
    const { classes, intl, extractionResult, editable, editedData, onFieldChange, onEditToggle } = this.props;
    if (!extractionResult) return null;

    const fields = this.state.parsedFields;
    const confidences = this.state.parsedConfidences;
    const isEditing = editable && editedData != null;

    return (
      <Paper className={classes.paper}>
        <div className={classes.titleRow}>
          <Typography variant="subtitle1">
            {formatMessage(intl, "claimlens", "extraction.title")}
          </Typography>
          {editable && (
            <Button
              size="small"
              variant="outlined"
              onClick={onEditToggle}
            >
              {isEditing
                ? formatMessage(intl, "claimlens", "review.cancelEdit")
                : formatMessage(intl, "claimlens", "review.edit")}
            </Button>
          )}
        </div>

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

        {isEditing ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    {formatMessage(intl, "claimlens", "extraction.field")}
                  </TableCell>
                  <TableCell>
                    {formatMessage(intl, "claimlens", "extraction.value")}
                  </TableCell>
                  <TableCell style={{ width: 200 }}>
                    {formatMessage(intl, "claimlens", "extraction.confidence")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(fields).map(([key, value]) => {
                  const isComplex = typeof value === "object" && value !== null;
                  const displayValue = editedData[key] !== undefined
                    ? editedData[key]
                    : (isComplex ? JSON.stringify(value, null, 2) : String(value));

                  return (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          multiline={isComplex}
                          rows={isComplex ? 3 : 1}
                          value={displayValue}
                          onChange={(e) => onFieldChange(key, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <ConfidenceBar value={confidences[key] || 0} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <>
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
                  <Box mt={1}>
                    {(() => {
                      try {
                        const parsed = typeof extractionResult.rawLlmResponse === "string"
                          ? JSON.parse(extractionResult.rawLlmResponse)
                          : extractionResult.rawLlmResponse;
                        return <JsonViewToggle data={parsed} />;
                      } catch (e) {
                        return (
                          <pre className={classes.rawResponse}>
                            {extractionResult.rawLlmResponse}
                          </pre>
                        );
                      }
                    })()}
                  </Box>
                </Collapse>
              </div>
            )}
          </>
        )}
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(ExtractionResultPanel));
