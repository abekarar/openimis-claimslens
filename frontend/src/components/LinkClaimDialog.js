import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
} from "@material-ui/core";
import { withModulesManager, formatMessage } from "@openimis/fe-core";
import { linkDocumentToClaim } from "../actions";

const styles = (theme) => ({
  field: { marginBottom: theme.spacing(2) },
});

class LinkClaimDialog extends Component {
  state = { claimUuid: "" };

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState({ claimUuid: "" });
    }
  }

  handleSave = () => {
    const { documentUuid, intl } = this.props;
    const { claimUuid } = this.state;
    this.props.linkDocumentToClaim(
      documentUuid,
      claimUuid,
      formatMessage(intl, "claimlens", "linkClaim.mutation")
    );
    this.props.onClose(true);
  };

  render() {
    const { intl, classes, open, onClose } = this.props;
    const { claimUuid } = this.state;

    return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {formatMessage(intl, "claimlens", "linkClaim.dialogTitle")}
        </DialogTitle>
        <DialogContent>
          <TextField
            className={classes.field}
            fullWidth
            label={formatMessage(intl, "claimlens", "linkClaim.claimUuid")}
            placeholder={formatMessage(intl, "claimlens", "linkClaim.claimUuidPlaceholder")}
            value={claimUuid}
            onChange={(e) => this.setState({ claimUuid: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>
            {formatMessage(intl, "claimlens", "action.cancel")}
          </Button>
          <Button
            onClick={this.handleSave}
            color="primary"
            variant="contained"
            disabled={!claimUuid}
          >
            {formatMessage(intl, "claimlens", "linkClaim.save")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ linkDocumentToClaim }, dispatch);

export default withModulesManager(
  connect(null, mapDispatchToProps)(injectIntl(withStyles(styles)(LinkClaimDialog)))
);
