import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { VALIDATION_STATUSES } from "../constants";

class ValidationStatusPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="validation.status"
        constants={VALIDATION_STATUSES}
        {...this.props}
      />
    );
  }
}

export default ValidationStatusPicker;
