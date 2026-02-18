import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, withHistory, formatMessage } from "@openimis/fe-core";
import { Typography } from "@material-ui/core";
import UploadPanel from "../components/UploadPanel";
import { RIGHT_CLAIMLENS_UPLOAD } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  title: { marginBottom: theme.spacing(2) },
});

class UploadPage extends Component {
  render() {
    const { classes, intl, rights } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_UPLOAD)) return null;
    return (
      <div className={classes.page}>
        <Typography variant="h5" className={classes.title}>
          {formatMessage(intl, "claimlens", "upload.pageTitle")}
        </Typography>
        <UploadPanel />
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
      injectIntl(withTheme(withStyles(styles)(UploadPage)))
    )
  )
);
