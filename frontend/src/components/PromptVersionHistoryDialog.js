import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Table, TableBody, TableCell, TableHead, TableRow,
  Typography,
} from "@material-ui/core";
import { CheckCircle, CompareArrows } from "@material-ui/icons";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { fetchPromptVersionHistory, activatePromptVersion } from "../actions";
import { RIGHT_CLAIMLENS_MANAGE_PROMPT_TEMPLATES } from "../constants";

const styles = (theme) => ({
  activeChip: { backgroundColor: theme.palette.success ? theme.palette.success.light : "#c8e6c9" },
  diffContainer: { marginTop: theme.spacing(2), fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap" },
  addedLine: { backgroundColor: "#e6ffe6", display: "block" },
  removedLine: { backgroundColor: "#ffe6e6", display: "block" },
  unchangedLine: { display: "block" },
  diffHeader: { marginTop: theme.spacing(2), marginBottom: theme.spacing(1) },
  versionCell: { whiteSpace: "nowrap" },
});

class PromptVersionHistoryDialog extends Component {
  state = {
    compareA: null,
    compareB: null,
    showDiff: false,
  };

  componentDidMount() {
    this.loadHistory();
  }

  loadHistory = () => {
    const { promptType, documentTypeId } = this.props;
    this.props.fetchPromptVersionHistory(this.props.modulesManager, promptType, documentTypeId);
  };

  handleActivate = (id) => {
    const { intl } = this.props;
    this.props.activatePromptVersion(
      id,
      formatMessage(intl, "claimlens", "settings.promptTemplates.mutation.activate")
    );
    setTimeout(() => {
      this.loadHistory();
    }, 1000);
  };

  handleCompareToggle = (version) => {
    const { compareA, compareB } = this.state;
    if (!compareA) {
      this.setState({ compareA: version, compareB: null, showDiff: false });
    } else if (!compareB && version.uuid !== compareA.uuid) {
      this.setState({ compareB: version, showDiff: true });
    } else {
      this.setState({ compareA: version, compareB: null, showDiff: false });
    }
  };

  computeDiff = (textA, textB) => {
    const linesA = (textA || "").split("\n");
    const linesB = (textB || "").split("\n");
    const result = [];
    const maxLen = Math.max(linesA.length, linesB.length);

    for (let i = 0; i < maxLen; i++) {
      const lineA = i < linesA.length ? linesA[i] : undefined;
      const lineB = i < linesB.length ? linesB[i] : undefined;

      if (lineA === lineB) {
        result.push({ type: "unchanged", text: lineA });
      } else {
        if (lineA !== undefined) {
          result.push({ type: "removed", text: lineA });
        }
        if (lineB !== undefined) {
          result.push({ type: "added", text: lineB });
        }
      }
    }
    return result;
  };

  render() {
    const { classes, intl, open, onClose, promptVersionHistory, fetchingPromptVersionHistory, rights } = this.props;
    const { compareA, compareB, showDiff } = this.state;
    const canManage = rights.includes(RIGHT_CLAIMLENS_MANAGE_PROMPT_TEMPLATES);

    const titleKey = "settings.promptTemplates.history";

    return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {formatMessage(intl, "claimlens", titleKey)}
        </DialogTitle>
        <DialogContent>
          {fetchingPromptVersionHistory ? (
            <Typography>{formatMessage(intl, "claimlens", "settings.promptTemplates.loading")}</Typography>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{formatMessage(intl, "claimlens", "settings.promptTemplates.version")}</TableCell>
                    <TableCell>{formatMessage(intl, "claimlens", "settings.promptTemplates.changeSummary")}</TableCell>
                    <TableCell>{formatMessage(intl, "claimlens", "settings.promptTemplates.author")}</TableCell>
                    <TableCell>{formatMessage(intl, "claimlens", "settings.promptTemplates.date")}</TableCell>
                    <TableCell>{formatMessage(intl, "claimlens", "settings.promptTemplates.status")}</TableCell>
                    <TableCell>{formatMessage(intl, "claimlens", "settings.promptTemplates.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(promptVersionHistory || []).map((v) => (
                    <TableRow
                      key={v.uuid}
                      selected={
                        (compareA && compareA.uuid === v.uuid) ||
                        (compareB && compareB.uuid === v.uuid)
                      }
                    >
                      <TableCell className={classes.versionCell}>v{v.version}</TableCell>
                      <TableCell>{v.changeSummary}</TableCell>
                      <TableCell>{v.userCreated ? v.userCreated.username : ""}</TableCell>
                      <TableCell className={classes.versionCell}>
                        {v.dateCreated ? new Date(v.dateCreated).toLocaleString() : ""}
                      </TableCell>
                      <TableCell>
                        {v.isActive && (
                          <Chip label="Active" size="small" className={classes.activeChip} />
                        )}
                      </TableCell>
                      <TableCell className={classes.versionCell}>
                        {canManage && !v.isActive && (
                          <IconButton
                            size="small"
                            title={formatMessage(intl, "claimlens", "settings.promptTemplates.activate")}
                            onClick={() => {
                              this.handleActivate(v.uuid);
                              onClose(true);
                            }}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          title={formatMessage(intl, "claimlens", "settings.promptTemplates.compare")}
                          onClick={() => this.handleCompareToggle(v)}
                          color={
                            (compareA && compareA.uuid === v.uuid) ||
                            (compareB && compareB.uuid === v.uuid)
                              ? "primary"
                              : "default"
                          }
                        >
                          <CompareArrows fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {showDiff && compareA && compareB && (
                <div>
                  <Typography variant="subtitle2" className={classes.diffHeader}>
                    {formatMessage(intl, "claimlens", "settings.promptTemplates.diffTitle")}
                    {" v"}{compareA.version} → v{compareB.version}
                  </Typography>
                  <div className={classes.diffContainer}>
                    {this.computeDiff(compareA.content, compareB.content).map((line, i) => (
                      <span
                        key={i}
                        className={
                          line.type === "added"
                            ? classes.addedLine
                            : line.type === "removed"
                            ? classes.removedLine
                            : classes.unchangedLine
                        }
                      >
                        {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                        {line.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>
            {formatMessage(intl, "claimlens", "action.cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = (state) => ({
  promptVersionHistory: state.claimlens.promptVersionHistory,
  fetchingPromptVersionHistory: state.claimlens.fetchingPromptVersionHistory,
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchPromptVersionHistory, activatePromptVersion }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(PromptVersionHistoryDialog)))
);
