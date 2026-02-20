import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withModulesManager, SelectInput, formatMessage } from "@openimis/fe-core";
import { fetchClaimsForPicker } from "../actions";

class ClaimPicker extends Component {
  componentDidMount() {
    this.props.fetchClaimsForPicker(this.props.modulesManager, [
      `first: 50`,
      `orderBy: ["-dateClaimed"]`,
    ]);
  }

  formatClaimLabel = (claim) => {
    const insuree = claim.insuree;
    const facility = claim.healthFacility;
    const insureeName = insuree
      ? `${insuree.lastName} ${insuree.otherNames}`.trim()
      : "";
    const facilityName = facility ? facility.name : "";
    let label = `#${claim.code}`;
    if (insureeName) label += ` \u2014 ${insureeName}`;
    if (facilityName) label += ` (${facilityName})`;
    return label;
  };

  render() {
    const { intl, claimsForPicker, value, onChange, readOnly, withNull = true, withLabel = true } = this.props;
    const options = (withNull
      ? [{ value: null, label: formatMessage(intl, "claimlens", "claimPicker.null") }]
      : []
    ).concat(
      (claimsForPicker || []).map((claim) => ({
        value: claim.uuid,
        label: this.formatClaimLabel(claim),
      }))
    );

    return (
      <SelectInput
        module="claimlens"
        label={withLabel ? "claimPicker.label" : " "}
        withLabel={withLabel}
        options={options}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  claimsForPicker: state.claimlens.claimsForPicker,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchClaimsForPicker }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(ClaimPicker))
);
