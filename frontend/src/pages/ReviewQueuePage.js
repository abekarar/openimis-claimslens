import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, withHistory, formatMessage } from "@openimis/fe-core";
import DocumentSearcher from "../components/DocumentSearcher";
import { RIGHT_CLAIMLENS_REVIEW_EXTRACTION, STATUS_REVIEW_REQUIRED } from "../constants";

const styles = (theme) => ({
  page: theme.page,
});

const REVIEW_QUEUE_DEFAULT_FILTERS = {
  status: {
    value: STATUS_REVIEW_REQUIRED,
    filter: `status: "${STATUS_REVIEW_REQUIRED}"`,
  },
};

class ReviewQueuePage extends Component {
  render() {
    const { classes, rights, intl } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_REVIEW_EXTRACTION)) return null;
    return (
      <div className={classes.page}>
        <DocumentSearcher
          defaultFilters={REVIEW_QUEUE_DEFAULT_FILTERS}
          tableTitle={formatMessage(intl, "claimlens", "reviewQueue.title")}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
});

export default withModulesManager(
  withHistory(
    connect(mapStateToProps)(
      injectIntl(withTheme(withStyles(styles)(ReviewQueuePage)))
    )
  )
);
