import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { Chip } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { formatMessage } from "@openimis/fe-core";
import {
  STATUS_COMPLETED,
  STATUS_FAILED,
  STATUS_REVIEW_REQUIRED,
  STATUS_PENDING,
  PROCESSING_STATUSES,
} from "../constants";

const styles = (theme) => ({
  completed: { backgroundColor: "#4caf50", color: "#fff" },
  failed: { backgroundColor: "#f44336", color: "#fff" },
  review_required: { backgroundColor: "#ff9800", color: "#fff" },
  pending: { backgroundColor: "#9e9e9e", color: "#fff" },
  processing: { backgroundColor: "#2196f3", color: "#fff" },
});

class StatusBadge extends Component {
  render() {
    const { classes, intl, status: rawStatus } = this.props;
    const status = rawStatus ? rawStatus.toLowerCase() : rawStatus;
    let chipClass = classes.pending;
    if (status === STATUS_COMPLETED) chipClass = classes.completed;
    else if (status === STATUS_FAILED) chipClass = classes.failed;
    else if (status === STATUS_REVIEW_REQUIRED) chipClass = classes.review_required;
    else if (PROCESSING_STATUSES.includes(status)) chipClass = classes.processing;

    const label = formatMessage(intl, "claimlens", `status.${status}`);
    return <Chip label={label} className={chipClass} size="small" />;
  }
}

export default injectIntl(withStyles(styles)(StatusBadge));
