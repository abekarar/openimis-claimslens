import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Button, Paper, Tab, Tabs, Typography } from "@material-ui/core";
import { Add } from "@material-ui/icons";
import {
  withModulesManager,
  withHistory,
  formatMessage,
  historyPush,
} from "@openimis/fe-core";
import ModuleConfigPanel from "../components/ModuleConfigPanel";
import DocumentTypeSearcher from "../components/DocumentTypeSearcher";
import EngineConfigSearcher from "../components/EngineConfigSearcher";
import RoutingPolicyPanel from "../components/RoutingPolicyPanel";
import CapabilityScoreSearcher from "../components/CapabilityScoreSearcher";
import EngineRoutingRuleSearcher from "../components/EngineRoutingRuleSearcher";
import ValidationRuleSearcher from "../components/ValidationRuleSearcher";
import {
  RIGHT_CLAIMLENS_MODULE_CONFIG,
  RIGHT_CLAIMLENS_DOCUMENT_TYPES,
  RIGHT_CLAIMLENS_ENGINE_CONFIGS,
  RIGHT_CLAIMLENS_ROUTING_POLICY,
  RIGHT_CLAIMLENS_VALIDATION_RULES,
  RIGHT_CLAIMLENS_MANAGE_VALIDATION_RULES,
} from "../constants";

const styles = (theme) => ({
  page: theme.page,
  title: { marginBottom: theme.spacing(2) },
  tabsContainer: { marginBottom: theme.spacing(2) },
  tabContent: { marginTop: theme.spacing(2) },
  addButton: { marginBottom: theme.spacing(2) },
});

const TAB_DEFS = [
  { key: "general", hash: "#general", right: RIGHT_CLAIMLENS_MODULE_CONFIG, labelKey: "settings.tab.general" },
  { key: "document-types", hash: "#document-types", right: RIGHT_CLAIMLENS_DOCUMENT_TYPES, labelKey: "settings.tab.documentTypes" },
  { key: "engine-configs", hash: "#engine-configs", right: RIGHT_CLAIMLENS_ENGINE_CONFIGS, labelKey: "settings.tab.engineConfigs" },
  { key: "routing", hash: "#routing", right: RIGHT_CLAIMLENS_ROUTING_POLICY, labelKey: "settings.tab.routing" },
  { key: "validation-rules", hash: "#validation-rules", right: RIGHT_CLAIMLENS_VALIDATION_RULES, labelKey: "settings.tab.validationRules" },
];

const ALL_SETTINGS_RIGHTS = [
  RIGHT_CLAIMLENS_MODULE_CONFIG,
  RIGHT_CLAIMLENS_DOCUMENT_TYPES,
  RIGHT_CLAIMLENS_ENGINE_CONFIGS,
  RIGHT_CLAIMLENS_ROUTING_POLICY,
  RIGHT_CLAIMLENS_VALIDATION_RULES,
];

class SettingsPage extends Component {
  constructor(props) {
    super(props);
    const visibleTabs = TAB_DEFS.filter((t) => props.rights.includes(t.right));
    const hash = window.location.hash;
    const matchedTab = visibleTabs.find((t) => t.hash === hash);
    this.state = {
      activeTab: matchedTab ? matchedTab.key : visibleTabs.length > 0 ? visibleTabs[0].key : null,
    };
  }

  handleTabChange = (_event, newValue) => {
    this.setState({ activeTab: newValue });
    window.location.hash = newValue;
  };

  handleAddRule = () => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "claimlens.route.validationRule"
    );
  };

  renderTabContent() {
    const { classes, rights } = this.props;
    const { activeTab } = this.state;

    switch (activeTab) {
      case "general":
        return <ModuleConfigPanel />;
      case "document-types":
        return <DocumentTypeSearcher />;
      case "engine-configs":
        return <EngineConfigSearcher />;
      case "routing":
        return (
          <Fragment>
            <RoutingPolicyPanel />
            <CapabilityScoreSearcher />
            <EngineRoutingRuleSearcher />
          </Fragment>
        );
      case "validation-rules":
        return (
          <Fragment>
            {rights.includes(RIGHT_CLAIMLENS_MANAGE_VALIDATION_RULES) && (
              <div className={classes.addButton}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={this.handleAddRule}
                >
                  {formatMessage(this.props.intl, "claimlens", "validationRule.action.add")}
                </Button>
              </div>
            )}
            <ValidationRuleSearcher />
          </Fragment>
        );
      default:
        return null;
    }
  }

  render() {
    const { classes, intl, rights } = this.props;
    const { activeTab } = this.state;

    if (!ALL_SETTINGS_RIGHTS.some((r) => rights.includes(r))) return null;

    const visibleTabs = TAB_DEFS.filter((t) => rights.includes(t.right));

    return (
      <div className={classes.page}>
        <Typography variant="h5" className={classes.title}>
          {formatMessage(intl, "claimlens", "settings.pageTitle")}
        </Typography>
        <Paper className={classes.tabsContainer}>
          <Tabs
            value={activeTab}
            onChange={this.handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {visibleTabs.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={formatMessage(intl, "claimlens", tab.labelKey)}
              />
            ))}
          </Tabs>
        </Paper>
        <div className={classes.tabContent}>
          {this.renderTabContent()}
        </div>
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
