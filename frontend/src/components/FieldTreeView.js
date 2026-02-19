import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  List, ListItem, ListItemText, ListItemIcon, Collapse, Typography, Box, IconButton, Chip,
} from "@material-ui/core";
import { ExpandMore, ChevronRight } from "@material-ui/icons";
import ConfidenceBar from "./ConfidenceBar";

const styles = (theme) => ({
  root: {
    width: "100%",
  },
  nestedItem: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  key: {
    fontWeight: 500,
    color: theme.palette.text.primary,
    fontFamily: "'Roboto Mono', monospace",
    fontSize: "0.85rem",
  },
  value: {
    color: theme.palette.text.secondary,
    fontFamily: "'Roboto Mono', monospace",
    fontSize: "0.85rem",
    wordBreak: "break-word",
  },
  expandIcon: {
    minWidth: 28,
  },
  confidenceContainer: {
    minWidth: 120,
    maxWidth: 120,
  },
  arrayBadge: {
    marginLeft: theme.spacing(1),
    height: 20,
  },
});

class TreeNode extends Component {
  state = {
    open: false,
  };

  constructor(props) {
    super(props);
    this.state = { open: !!props.defaultOpen };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextState.open !== this.state.open ||
      nextProps.value !== this.props.value ||
      nextProps.confidence !== this.props.confidence ||
      nextProps.nodeKey !== this.props.nodeKey
    );
  }

  handleToggle = () => {
    this.setState((prev) => ({ open: !prev.open }));
  };

  render() {
    const { classes, nodeKey, value, confidence, depth } = this.props;
    const { open } = this.state;
    const indent = depth * 24;

    if (value === null || value === undefined) {
      return (
        <ListItem className={classes.nestedItem} style={{ paddingLeft: indent }}>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <span className={classes.key}>{nodeKey}</span>
                  <span className={classes.value}>: null</span>
                </Box>
                {confidence !== undefined && (
                  <Box className={classes.confidenceContainer}>
                    <ConfidenceBar value={confidence} />
                  </Box>
                )}
              </Box>
            }
          />
        </ListItem>
      );
    }

    if (Array.isArray(value)) {
      return (
        <>
          <ListItem
            button
            className={classes.nestedItem}
            style={{ paddingLeft: indent }}
            onClick={this.handleToggle}
          >
            <ListItemIcon className={classes.expandIcon}>
              {open ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <span className={classes.key}>{nodeKey}</span>
                  <Chip
                    size="small"
                    label={value.length}
                    className={classes.arrayBadge}
                    variant="outlined"
                  />
                  {confidence !== undefined && (
                    <Box className={classes.confidenceContainer} ml={1}>
                      <ConfidenceBar value={confidence} />
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {value.map((item, index) => (
                <TreeNode
                  key={index}
                  classes={classes}
                  nodeKey={`[${index}]`}
                  value={item}
                  depth={depth + 1}
                  defaultOpen={false}
                />
              ))}
            </List>
          </Collapse>
        </>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);
      return (
        <>
          <ListItem
            button
            className={classes.nestedItem}
            style={{ paddingLeft: indent }}
            onClick={this.handleToggle}
          >
            <ListItemIcon className={classes.expandIcon}>
              {open ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <span className={classes.key}>{nodeKey}</span>
                  {confidence !== undefined && (
                    <Box className={classes.confidenceContainer} ml={1}>
                      <ConfidenceBar value={confidence} />
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {entries.map(([k, v]) => (
                <TreeNode
                  key={k}
                  classes={classes}
                  nodeKey={k}
                  value={v}
                  depth={depth + 1}
                  defaultOpen={false}
                />
              ))}
            </List>
          </Collapse>
        </>
      );
    }

    // Primitive value
    const displayValue = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
    return (
      <ListItem className={classes.nestedItem} style={{ paddingLeft: indent }}>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <span className={classes.key}>{nodeKey}</span>
                <span className={classes.value}>: {displayValue}</span>
              </Box>
              {confidence !== undefined && (
                <Box className={classes.confidenceContainer}>
                  <ConfidenceBar value={confidence} />
                </Box>
              )}
            </Box>
          }
        />
      </ListItem>
    );
  }
}

class FieldTreeView extends Component {
  render() {
    const { classes, data, confidences } = this.props;
    if (!data || typeof data !== "object") return null;

    const entries = Object.entries(data);

    return (
      <List component="nav" className={classes.root} dense>
        {entries.map(([key, value]) => (
          <TreeNode
            key={key}
            classes={classes}
            nodeKey={key}
            value={value}
            confidence={confidences ? confidences[key] : undefined}
            depth={0}
            defaultOpen={true}
          />
        ))}
      </List>
    );
  }
}

export default withStyles(styles)(FieldTreeView);
