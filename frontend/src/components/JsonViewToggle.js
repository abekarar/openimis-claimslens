import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import { AccountTree, Code } from "@material-ui/icons";
import { injectIntl } from "react-intl";
import { formatMessage } from "@openimis/fe-core";
import FieldTreeView from "./FieldTreeView";
import JsonEditor from "./JsonEditor";

const styles = (theme) => ({
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  toggleGroup: {
    height: 32,
  },
  toggleButton: {
    textTransform: "none",
    padding: "4px 12px",
  },
});

class JsonViewToggle extends Component {
  state = {
    viewMode: "tree",
  };

  handleViewModeChange = (_event, newMode) => {
    if (newMode) {
      this.setState({ viewMode: newMode });
    }
  };

  render() {
    const { classes, intl, data, confidences } = this.props;
    const { viewMode } = this.state;

    return (
      <div>
        <Box className={classes.header}>
          <Typography variant="subtitle2">
            {formatMessage(intl, "claimlens", "extraction.fields")}
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={this.handleViewModeChange}
            className={classes.toggleGroup}
          >
            <ToggleButton value="tree" className={classes.toggleButton}>
              <AccountTree fontSize="small" style={{ marginRight: 4 }} />
              {formatMessage(intl, "claimlens", "extraction.treeView")}
            </ToggleButton>
            <ToggleButton value="json" className={classes.toggleButton}>
              <Code fontSize="small" style={{ marginRight: 4 }} />
              {formatMessage(intl, "claimlens", "extraction.jsonView")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {viewMode === "tree" ? (
          <FieldTreeView data={data} confidences={confidences} />
        ) : (
          <JsonEditor
            value={JSON.stringify(data, null, 2)}
            readOnly
            height="400px"
          />
        )}
      </div>
    );
  }
}

export default injectIntl(withStyles(styles)(JsonViewToggle));
