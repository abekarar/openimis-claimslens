import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import { withModulesManager, withHistory, formatMessage } from "@openimis/fe-core";
import ValidationRuleForm from "../components/ValidationRuleForm";
import { RIGHT_CLAIMLENS_VALIDATION_RULES } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  title: { marginBottom: theme.spacing(2) },
});

class ValidationRuleDetailPage extends Component {
  render() {
    const { classes, intl, rights, rule_uuid } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_VALIDATION_RULES)) return null;
    const title = rule_uuid
      ? formatMessage(intl, "claimlens", "validationRule.editTitle")
      : formatMessage(intl, "claimlens", "validationRule.createTitle");
    return (
      <div className={classes.page}>
        <Typography variant="h5" className={classes.title}>
          {title}
        </Typography>
        <ValidationRuleForm rule_uuid={rule_uuid} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  rule_uuid: props.match && props.match.params ? props.match.params.rule_uuid : null,
});

export default withModulesManager(
  withHistory(
    connect(mapStateToProps)(
      injectIntl(withTheme(withStyles(styles)(ValidationRuleDetailPage)))
    )
  )
);
