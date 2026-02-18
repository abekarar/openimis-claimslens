import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { Chip } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { formatMessage } from "@openimis/fe-core";
import {
  VALIDATION_STATUS_MATCHED,
  VALIDATION_STATUS_MISMATCHED,
  VALIDATION_STATUS_PARTIAL_MATCH,
  VALIDATION_STATUS_PENDING,
  VALIDATION_STATUS_ERROR,
} from "../constants";

const styles = () => ({
  matched: { backgroundColor: "#4caf50", color: "#fff" },
  mismatched: { backgroundColor: "#f44336", color: "#fff" },
  partial_match: { backgroundColor: "#ff9800", color: "#fff" },
  pending: { backgroundColor: "#9e9e9e", color: "#fff" },
  error: { backgroundColor: "#f44336", color: "#fff" },
});

class ValidationStatusBadge extends Component {
  render() {
    const { classes, intl, status } = this.props;
    let chipClass = classes.pending;
    if (status === VALIDATION_STATUS_MATCHED) chipClass = classes.matched;
    else if (status === VALIDATION_STATUS_MISMATCHED) chipClass = classes.mismatched;
    else if (status === VALIDATION_STATUS_PARTIAL_MATCH) chipClass = classes.partial_match;
    else if (status === VALIDATION_STATUS_PENDING) chipClass = classes.pending;
    else if (status === VALIDATION_STATUS_ERROR) chipClass = classes.error;

    const label = formatMessage(intl, "claimlens", `validation.status.${status}`);
    return <Chip label={label} className={chipClass} size="small" />;
  }
}

export default injectIntl(withStyles(styles)(ValidationStatusBadge));
