import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { RULE_TYPES } from "../constants";

class RuleTypePicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="ruleType"
        constants={RULE_TYPES}
        {...this.props}
      />
    );
  }
}

export default RuleTypePicker;
