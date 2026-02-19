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
  Button,
  Chip,
  Tooltip,
} from "@material-ui/core";
import { formatMessage } from "@openimis/fe-core";
import {
  PROPOSAL_PROPOSED,
  PROPOSAL_APPROVED,
  PROPOSAL_APPLIED,
  PROPOSAL_REJECTED,
} from "../constants";

const styles = (theme) => ({
  paper: { padding: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { marginBottom: theme.spacing(2) },
  actionButton: { marginRight: theme.spacing(1) },
  statusProposed: { backgroundColor: "#2196f3", color: "#fff" },
  statusApproved: { backgroundColor: "#4caf50", color: "#fff" },
  statusApplied: { backgroundColor: "#9e9e9e", color: "#fff" },
  statusRejected: { backgroundColor: "#f44336", color: "#fff" },
});

class RegistryUpdatePanel extends Component {
  getStatusClass(status) {
    const { classes } = this.props;
    if (status === PROPOSAL_PROPOSED) return classes.statusProposed;
    if (status === PROPOSAL_APPROVED) return classes.statusApproved;
    if (status === PROPOSAL_APPLIED) return classes.statusApplied;
    if (status === PROPOSAL_REJECTED) return classes.statusRejected;
    return classes.statusProposed;
  }

  handleReview = (id, status) => {
    const { onReviewProposal } = this.props;
    if (onReviewProposal) {
      onReviewProposal(id, status);
    }
  };

  handleApply = (id) => {
    const { onApplyProposal } = this.props;
    if (onApplyProposal) {
      onApplyProposal(id);
    }
  };

  renderActions(proposal) {
    const { classes, intl } = this.props;

    if (proposal.status === PROPOSAL_PROPOSED) {
      return (
        <>
          <Tooltip title={formatMessage(intl, "claimlens", "proposals.approve")}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              className={classes.actionButton}
              onClick={() => this.handleReview(proposal.uuid, PROPOSAL_APPROVED)}
            >
              {formatMessage(intl, "claimlens", "proposals.approve")}
            </Button>
          </Tooltip>
          <Tooltip title={formatMessage(intl, "claimlens", "proposals.reject")}>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              className={classes.actionButton}
              onClick={() => this.handleReview(proposal.uuid, PROPOSAL_REJECTED)}
            >
              {formatMessage(intl, "claimlens", "proposals.reject")}
            </Button>
          </Tooltip>
        </>
      );
    }

    if (proposal.status === PROPOSAL_APPROVED) {
      return (
        <Tooltip title={formatMessage(intl, "claimlens", "proposals.apply")}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            className={classes.actionButton}
            onClick={() => this.handleApply(proposal.uuid)}
          >
            {formatMessage(intl, "claimlens", "proposals.apply")}
          </Button>
        </Tooltip>
      );
    }

    return null;
  }

  render() {
    const { classes, intl, proposals } = this.props;
    if (!proposals || !proposals.length) return null;

    return (
      <Paper className={classes.paper}>
        <Typography variant="subtitle1" className={classes.title}>
          {formatMessage(intl, "claimlens", "proposals.title")}
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  {formatMessage(intl, "claimlens", "proposals.targetModel")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "proposals.field")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "proposals.currentValue")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "proposals.proposedValue")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "proposals.status")}
                </TableCell>
                <TableCell>
                  {formatMessage(intl, "claimlens", "proposals.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.uuid}>
                  <TableCell>
                    {formatMessage(intl, "claimlens", `proposals.targetModel.${proposal.targetModel}`) || proposal.targetModel}
                  </TableCell>
                  <TableCell>{proposal.fieldName}</TableCell>
                  <TableCell>
                    {proposal.currentValue != null ? String(proposal.currentValue) : "-"}
                  </TableCell>
                  <TableCell>
                    {proposal.proposedValue != null ? String(proposal.proposedValue) : "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatMessage(intl, "claimlens", `proposals.status.${proposal.status}`)}
                      className={this.getStatusClass(proposal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{this.renderActions(proposal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
}

export default injectIntl(withStyles(styles)(RegistryUpdatePanel));
