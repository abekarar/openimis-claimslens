import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

const LANGUAGES = ["en", "fr", "sw", "ar", "es", "pt", "zh"];

class LanguagePicker extends Component {
  render() {
    return (
      <ConstantBasedPicker
        module="claimlens"
        label="language"
        constants={LANGUAGES}
        {...this.props}
      />
    );
  }
}

export default LanguagePicker;
