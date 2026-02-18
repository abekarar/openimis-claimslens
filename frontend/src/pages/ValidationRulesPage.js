import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import { Add } from "@material-ui/icons";
import {
  withModulesManager,
  withHistory,
  formatMessage,
  historyPush,
} from "@openimis/fe-core";
import ValidationRuleSearcher from "../components/ValidationRuleSearcher";
import {
  RIGHT_CLAIMLENS_VALIDATION_RULES,
  RIGHT_CLAIMLENS_MANAGE_VALIDATION_RULES,
} from "../constants";

const styles = (theme) => ({
  page: theme.page,
  addButton: { marginBottom: theme.spacing(2) },
});

class ValidationRulesPage extends Component {
  handleAddRule = () => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "claimlens.route.validationRule"
    );
  };

  render() {
    const { classes, intl, rights } = this.props;
    if (!rights.includes(RIGHT_CLAIMLENS_VALIDATION_RULES)) return null;
    const canManage = rights.includes(RIGHT_CLAIMLENS_MANAGE_VALIDATION_RULES);
    return (
      <div className={classes.page}>
        {canManage && (
          <div className={classes.addButton}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={this.handleAddRule}
            >
              {formatMessage(intl, "claimlens", "validationRule.action.add")}
            </Button>
          </div>
        )}
        <ValidationRuleSearcher />
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
      injectIntl(withTheme(withStyles(styles)(ValidationRulesPage)))
    )
  )
);
