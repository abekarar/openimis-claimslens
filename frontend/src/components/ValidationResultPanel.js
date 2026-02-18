import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Grid,
} from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CancelIcon from "@material-ui/icons/Cancel";
import { formatMessage } from "@openimis/fe-core";
import ValidationStatusBadge from "./ValidationStatusBadge";
import {
  VALIDATION_TYPE_UPSTREAM,
  VALIDATION_TYPE_DOWNSTREAM,
} from "../constants";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  summary: { marginBottom: theme.spacing(2) },
  label: { fontWeight: "bold", color: theme.palette.text.secondary },
  matchIcon: { color: "#4caf50", verticalAlign: "middle" },
  mismatchIcon: { color: "#f44336", verticalAlign: "middle" },
  tabContent: { paddingTop: theme.spacing(2) },
  discrepancyChip: { marginLeft: theme.spacing(1) },
});

class ValidationResultPanel extends Component {
  state = {
    activeTab: 0,
  };

  handleTabChange = (_event, newValue) => {
    this.setState({ activeTab: newValue });
  };

  getResultsByType() {
    const { validationResults } = this.props;
    if (!validationResults || !validationResults.length) return { upstream: [], downstream: [] };
    const upstream = validationResults.filter(
      (vr) => vr.validationType === VALIDATION_TYPE_UPSTREAM
    );
    const downstream = validationResults.filter(
      (vr) => vr.validationType === VALIDATION_TYPE_DOWNSTREAM
    );
    return { upstream, downstream };
  }

  renderSummary(results) {
    const { classes, intl } = this.props;
    if (!results || !results.length) {
      return (
        <Typography color="textSecondary">
          {formatMessage(intl, "claimlens", "validation.noResults")}
        </Typography>
      );
    }

    return results.map((result) => (
      <Grid container spacing={2} key={result.uuid} className={classes.summary}>
        <Grid item xs={3}>
          <Typography className={classes.label}>
            {formatMessage(intl, "claimlens", "validation.overallStatus")}
          </Typography>
          <ValidationStatusBadge status={result.overallStatus} />
        </Grid>
        <Grid item xs={3}>
          <Typography className={classes.label}>
            {formatMessage(intl, "claimlens", "validation.matchScore")}
          </Typography>
          <Typography>
            {result.matchScore != null
              ? `${(result.matchScore * 100).toFixed(1)}%`
              : "-"}
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography className={classes.label}>
            {formatMessage(intl, "claimlens", "validation.discrepancyCount")}
          </Typography>
          <Chip
            label={result.discrepancyCount || 0}
            size="small"
            color={result.discrepancyCount > 0 ? "secondary" : "default"}
            className={classes.discrepancyChip}
          />
        </Grid>
        <Grid item xs={3}>
          <Typography className={classes.label}>
            {formatMessage(intl, "claimlens", "validation.summary")}
          </Typography>
          <Typography variant="body2">{result.summary || "-"}</Typography>
        </Grid>
        {this.renderFieldComparisons(result)}
      </Grid>
    ));
  }

  renderFieldComparisons(result) {
    const { classes, intl } = this.props;
    const comparisons = result.fieldComparisons;
    if (!comparisons || !Object.keys(comparisons).length) return null;

    const rows = typeof comparisons === "object" && !Array.isArray(comparisons)
      ? Object.entries(comparisons).map(([field, comp]) => ({
          field,
          ocrValue: comp.ocrValue != null ? String(comp.ocrValue) : "-",
          claimValue: comp.claimValue != null ? String(comp.claimValue) : "-",
          match: comp.match,
        }))
      : Array.isArray(comparisons)
        ? comparisons
        : [];

    return (
      <Grid item xs={12}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  {formatMessage(intl, "claimlens", "validation.field")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "validation.ocrValue")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "validation.claimValue")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "validation.match")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.field}>
                  <TableCell>{row.field}</TableCell>
                  <TableCell>{row.ocrValue}</TableCell>
                  <TableCell>{row.claimValue}</TableCell>
                  <TableCell>
                    {row.match ? (
                      <CheckCircleIcon className={classes.matchIcon} fontSize="small" />
                    ) : (
                      <CancelIcon className={classes.mismatchIcon} fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    );
  }

  render() {
    const { classes, intl, validationResults } = this.props;
    if (!validationResults || !validationResults.length) return null;

    const { activeTab } = this.state;
    const { upstream, downstream } = this.getResultsByType();

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "validation.title")}
        </Typography>

        <Tabs
          value={activeTab}
          onChange={this.handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={formatMessage(intl, "claimlens", "validation.upstream")} />
          <Tab label={formatMessage(intl, "claimlens", "validation.downstream")} />
        </Tabs>

        <div className={classes.tabContent}>
          {activeTab === 0 && this.renderSummary(upstream)}
          {activeTab === 1 && this.renderSummary(downstream)}
        </div>
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(ValidationResultPanel));
