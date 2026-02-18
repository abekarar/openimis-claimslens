import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { FindInPage } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import { RIGHT_CLAIMLENS_DOCUMENTS, RIGHT_CLAIMLENS_UPLOAD } from "../constants";

class ClaimLensMainMenu extends Component {
  render() {
    const { rights } = this.props;
    const entries = this.props.modulesManager.getContribs("claimlens.MainMenu").filter(
      (c) => !c.filter || c.filter(rights)
    );
    if (!entries.length) return null;
    return (
      <MainMenuContribution
        {...this.props}
        header={formatMessage(this.props.intl, "claimlens", "menu.claimlens")}
        icon={<FindInPage />}
        entries={entries}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user
    ? state.core.user.i_user.rights
    : [],
});

export default withModulesManager(
  injectIntl(connect(mapStateToProps)(ClaimLensMainMenu))
);
