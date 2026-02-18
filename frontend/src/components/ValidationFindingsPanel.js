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
  Chip,
  Button,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import {
  SEVERITY_ERROR,
  SEVERITY_WARNING,
  SEVERITY_INFO,
  RESOLUTION_PENDING,
  RESOLUTION_ACCEPTED,
  RESOLUTION_REJECTED,
  RESOLUTION_DEFERRED,
} from "../constants";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  severityError: { backgroundColor: "#f44336", color: "#fff" },
  severityWarning: { backgroundColor: "#ff9800", color: "#fff" },
  severityInfo: { backgroundColor: "#2196f3", color: "#fff" },
  actionButton: { marginRight: theme.spacing(1) },
  noFindings: { padding: theme.spacing(2) },
});

const SEVERITY_ORDER = [SEVERITY_ERROR, SEVERITY_WARNING, SEVERITY_INFO];

class ValidationFindingsPanel extends Component {
  getSeverityClass(severity) {
    const { classes } = this.props;
    if (severity === SEVERITY_ERROR) return classes.severityError;
    if (severity === SEVERITY_WARNING) return classes.severityWarning;
    if (severity === SEVERITY_INFO) return classes.severityInfo;
    return classes.severityInfo;
  }

  sortFindings(findings) {
    if (!findings || !findings.length) return [];
    return [...findings].sort((a, b) => {
      const aIndex = SEVERITY_ORDER.indexOf(a.severity);
      const bIndex = SEVERITY_ORDER.indexOf(b.severity);
      return aIndex - bIndex;
    });
  }

  handleResolve = (findingId, resolutionStatus) => {
    const { onResolveFinding } = this.props;
    if (onResolveFinding) {
      onResolveFinding(findingId, resolutionStatus);
    }
  };

  render() {
    const { classes, intl, findings } = this.props;
    if (!findings || !findings.length) return null;

    const sortedFindings = this.sortFindings(findings);

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "findings.title")}
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  {formatMessage(intl, "claimlens", "findings.severity")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "findings.findingType")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "findings.field")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "findings.description")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "findings.rule")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "findings.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedFindings.map((finding) => (
                <TableRow key={finding.uuid}>
                  <TableCell>
                    <Chip
                      label={formatMessage(intl, "claimlens", `severity.${finding.severity}`)}
                      className={this.getSeverityClass(finding.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatMessage(intl, "claimlens", `findingType.${finding.findingType}`)}
                  </TableCell>
                  <TableCell>{finding.field || "-"}</TableCell>
                  <TableCell>{finding.description}</TableCell>
                  <TableCell>
                    {finding.validationRule
                      ? `${finding.validationRule.code} - ${finding.validationRule.name}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {finding.resolutionStatus === RESOLUTION_PENDING ? (
                      <>
                        <Tooltip title={formatMessage(intl, "claimlens", "findings.accept")}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            className={classes.actionButton}
                            onClick={() => this.handleResolve(finding.uuid, RESOLUTION_ACCEPTED)}
                          >
                            {formatMessage(intl, "claimlens", "findings.accept")}
                          </Button>
                        </Tooltip>
                        <Tooltip title={formatMessage(intl, "claimlens", "findings.reject")}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            className={classes.actionButton}
                            onClick={() => this.handleResolve(finding.uuid, RESOLUTION_REJECTED)}
                          >
                            {formatMessage(intl, "claimlens", "findings.reject")}
                          </Button>
                        </Tooltip>
                        <Tooltip title={formatMessage(intl, "claimlens", "findings.defer")}>
                          <Button
                            size="small"
                            variant="outlined"
                            className={classes.actionButton}
                            onClick={() => this.handleResolve(finding.uuid, RESOLUTION_DEFERRED)}
                          >
                            {formatMessage(intl, "claimlens", "findings.defer")}
                          </Button>
                        </Tooltip>
                      </>
                    ) : (
                      <Chip
                        label={formatMessage(intl, "claimlens", `resolution.${finding.resolutionStatus}`)}
                        size="small"
                        variant="outlined"
                      />
                    )}
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

export default injectIntl(withStyles(styles)(ValidationFindingsPanel));
