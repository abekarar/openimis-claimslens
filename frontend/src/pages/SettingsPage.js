import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import { withModulesManager, withHistory, formatMessage } from "@openimis/fe-core";
import ModuleConfigPanel from "../components/ModuleConfigPanel";
import { RIGHT_CLAIMLENS_MODULE_CONFIG } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  title: { marginBottom: theme.spacing(2) },
});

class SettingsPage extends Component {
  render() {
    const { classes, intl, rights } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_MODULE_CONFIG)) return null;
    return (
      <div className={classes.page}>
        <Typography variant="h5" className={classes.title}>
          {formatMessage(intl, "claimlens", "settings.pageTitle")}
        </Typography>
        <ModuleConfigPanel />
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
      injectIntl(withTheme(withStyles(styles)(SettingsPage)))
    )
  )
);
