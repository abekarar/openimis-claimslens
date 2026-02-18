import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";
import { DOCUMENT_STATUSES } from "../constants";

class DocumentStatusPicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="status"
        constants={DOCUMENT_STATUSES}
        {...this.props}
      />
    );
  }
}

export default DocumentStatusPicker;
