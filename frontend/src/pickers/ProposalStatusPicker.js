import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { PROPOSAL_STATUSES } from "../constants";

class ProposalStatusPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="proposals.status"
        constants={PROPOSAL_STATUSES}
        {...this.props}
      />
    );
  }
}

export default ProposalStatusPicker;
