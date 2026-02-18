import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { SEVERITY_LEVELS } from "../constants";

class ValidationSeverityPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="severity"
        constants={SEVERITY_LEVELS}
        {...this.props}
      />
    );
  }
}

export default ValidationSeverityPicker;
