import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, withHistory } from "@openimis/fe-core";
import DocumentSearcher from "../components/DocumentSearcher";
import { RIGHT_CLAIMLENS_DOCUMENTS } from "../constants";

const styles = (theme) => ({
  page: theme.page,
});

class DocumentsPage extends Component {
  render() {
    const { classes, rights } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_DOCUMENTS)) return null;
    return (
      <div className={classes.page}>
        <DocumentSearcher />
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
      injectIntl(withTheme(withStyles(styles)(DocumentsPage)))
    )
  )
);
