import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { Paper, Typography } from "@material-ui/core";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";

const styles = (theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  label: {
    marginBottom: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
  },
  editorWrapper: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
  },
  editorWrapperError: {
    border: `1px solid ${theme.palette.error.main}`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
  },
  error: {
    color: theme.palette.error.main,
    fontSize: "0.75rem",
    marginTop: theme.spacing(0.5),
  },
});

class JsonEditor extends Component {
  state = {
    validationError: null,
  };

  handleChange = (value) => {
    const { onChange } = this.props;
    this.setState({ validationError: null });
    if (onChange) onChange(value);
  };

  handleBlur = () => {
    const { value } = this.props;
    if (!value || !value.trim()) {
      this.setState({ validationError: null });
      return;
    }
    try {
      JSON.parse(value);
      this.setState({ validationError: null });
    } catch (e) {
      this.setState({ validationError: e.message });
    }
  };

  render() {
    const { classes, value, readOnly, label, error, height } = this.props;
    const { validationError } = this.state;
    const displayError = error || validationError;
    const hasError = !!displayError;

    return (
      <div className={classes.root}>
        {label && (
          <Typography className={classes.label}>
            {label}
          </Typography>
        )}
        <div className={hasError ? classes.editorWrapperError : classes.editorWrapper}>
          <AceEditor
            mode="json"
            theme="github"
            value={value || ""}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            readOnly={readOnly}
            width="100%"
            height={height || "200px"}
            fontSize={13}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={!readOnly}
            setOptions={{
              showLineNumbers: true,
              tabSize: 2,
              useWorker: false,
            }}
            debounceChangePeriod={250}
            editorProps={{ $blockScrolling: true }}
          />
        </div>
        {displayError && (
          <Typography className={classes.error}>
            {displayError}
          </Typography>
        )}
      </div>
    );
  }
}

export default withStyles(styles)(JsonEditor);
