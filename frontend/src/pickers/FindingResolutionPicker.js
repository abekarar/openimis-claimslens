import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { RESOLUTION_STATUSES } from "../constants";

class FindingResolutionPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="resolution"
        constants={RESOLUTION_STATUSES}
        {...this.props}
      />
    );
  }
}

export default FindingResolutionPicker;
