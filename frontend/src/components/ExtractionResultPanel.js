import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, Button, TextField,
} from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import ConfidenceBar from "./ConfidenceBar";

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
});

class ExtractionResultPanel extends Component {
  render() {
    const { classes, intl, extractionResult, editable, editedData, onFieldChange, onEditToggle } = this.props;
    if (!extractionResult) return null;

    const fields = extractionResult.structuredData || {};
    const confidences = extractionResult.fieldConfidences || {};
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
                const displayValue = isEditing
                  ? (editedData[key] !== undefined ? editedData[key] : (isComplex ? JSON.stringify(value, null, 2) : String(value)))
                  : (isComplex ? JSON.stringify(value) : String(value));

                return (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          multiline={isComplex}
                          rows={isComplex ? 3 : 1}
                          value={displayValue}
                          onChange={(e) => onFieldChange(key, e.target.value)}
                        />
                      ) : (
                        displayValue
                      )}
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
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(ExtractionResultPanel));
