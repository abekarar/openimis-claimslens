import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from "@material-ui/core";
import { formatMessage, formatDateFromISO } from "@openimis/fe-core";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
});

class AuditLogPanel extends Component {
  formatDetails(details) {
    if (!details) return "-";
    const str = typeof details === "string" ? details : JSON.stringify(details);
    return str.length > 120 ? str.substring(0, 120) + "..." : str;
  }

  render() {
    const { classes, intl, auditLogs } = this.props;
    const logs = auditLogs || [];

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "auditLog.title")}
        </Typography>
        {logs.length === 0 ? (
          <Typography color="textSecondary">
            {formatMessage(intl, "claimlens", "auditLog.noLogs")}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{formatMessage(intl, "claimlens", "auditLog.dateCreated")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "auditLog.action")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "auditLog.engine")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "auditLog.details")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.uuid}>
                    <TableCell>{formatDateFromISO(intl, log.dateCreated)}</TableCell>
                    <TableCell>{log.action || "-"}</TableCell>
                    <TableCell>{log.engineConfig ? log.engineConfig.name : "-"}</TableCell>
                    <TableCell>{this.formatDetails(log.details)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(AuditLogPanel));
