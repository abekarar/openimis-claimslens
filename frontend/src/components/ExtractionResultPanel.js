import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid,
} from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import ConfidenceBar from "./ConfidenceBar";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  summary: { marginBottom: theme.spacing(2) },
  label: { fontWeight: "bold", color: theme.palette.text.secondary },
});

class ExtractionResultPanel extends Component {
  render() {
    const { classes, intl, extractionResult } = this.props;
    if (!extractionResult) return null;

    const fields = extractionResult.structuredData || {};
    const confidences = extractionResult.fieldConfidences || {};

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
              {Object.entries(fields).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </TableCell>
                  <TableCell>
                    <ConfidenceBar value={confidences[key] || 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(ExtractionResultPanel));
