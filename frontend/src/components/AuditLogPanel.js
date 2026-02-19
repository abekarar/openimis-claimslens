import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Collapse, Box,
} from "@material-ui/core";
import { ExpandMore, ExpandLess } from "@material-ui/icons";
import { formatMessage, formatDateFromISO } from "@openimis/fe-core";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  detailsCell: { maxWidth: 400 },
  detailsTruncated: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  detailsFull: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "monospace",
    fontSize: "0.8rem",
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[50],
    borderRadius: 4,
  },
});

class AuditLogPanel extends Component {
  state = {
    expandedRows: {},
  };

  toggleRow = (uuid) => {
    this.setState((prev) => ({
      expandedRows: { ...prev.expandedRows, [uuid]: !prev.expandedRows[uuid] },
    }));
  };

  formatDetails(details) {
    if (!details) return "-";
    const str = typeof details === "string" ? details : JSON.stringify(details);
    return str.length > 120 ? str.substring(0, 120) + "..." : str;
  }

  formatDetailsFull(details) {
    if (!details) return "-";
    if (typeof details === "string") {
      try {
        return JSON.stringify(JSON.parse(details), null, 2);
      } catch (e) {
        return details;
      }
    }
    return JSON.stringify(details, null, 2);
  }

  isExpandable(details) {
    if (!details) return false;
    const str = typeof details === "string" ? details : JSON.stringify(details);
    return str.length > 120;
  }

  render() {
    const { classes, intl, auditLogs } = this.props;
    const { expandedRows } = this.state;
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
                {logs.map((log) => {
                  const expandable = this.isExpandable(log.details);
                  const expanded = !!expandedRows[log.uuid];
                  return (
                    <TableRow key={log.uuid}>
                      <TableCell>{formatDateFromISO(intl, log.dateCreated)}</TableCell>
                      <TableCell>{log.action || "-"}</TableCell>
                      <TableCell>{log.engineConfig ? log.engineConfig.name : "-"}</TableCell>
                      <TableCell className={classes.detailsCell}>
                        {expandable ? (
                          <>
                            <div
                              className={classes.detailsTruncated}
                              onClick={() => this.toggleRow(log.uuid)}
                            >
                              <Typography variant="body2" style={{ flex: 1 }}>
                                {expanded ? "" : this.formatDetails(log.details)}
                              </Typography>
                              <IconButton size="small">
                                {expanded ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </div>
                            <Collapse in={expanded}>
                              <Box className={classes.detailsFull}>
                                {this.formatDetailsFull(log.details)}
                              </Box>
                            </Collapse>
                          </>
                        ) : (
                          this.formatDetails(log.details)
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(AuditLogPanel));
