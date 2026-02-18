import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { withModulesManager, withHistory, formatMessage } from "@openimis/fe-core";
import { Typography } from "@material-ui/core";
import DocumentForm from "../components/DocumentForm";
import { RIGHT_CLAIMLENS_DOCUMENTS } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  title: { marginBottom: theme.spacing(2) },
});

class DocumentDetailPage extends Component {
  render() {
    const { classes, intl, rights, document_uuid } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_DOCUMENTS)) return null;
    return (
      <div className={classes.page}>
        <Typography variant="h5" className={classes.title}>
          {formatMessage(intl, "claimlens", "document.detailTitle")}
        </Typography>
        <DocumentForm document_uuid={document_uuid} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  document_uuid: props.match.params.document_uuid,
});

export default withModulesManager(
  withHistory(
    connect(mapStateToProps)(
      injectIntl(withTheme(withStyles(styles)(DocumentDetailPage)))
    )
  )
);
