import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withModulesManager, SelectInput, formatMessage } from "@openimis/fe-core";
import { fetchDocumentTypes } from "../actions";

class DocumentClassificationPicker extends Component {
  componentDidMount() {
    if (!this.props.documentTypes) {
      this.props.fetchDocumentTypes(this.props.modulesManager, []);
    }
  }

  render() {
    const { intl, documentTypes, value, onChange, readOnly, withNull = true, withLabel = true } = this.props;
    const options = (withNull
      ? [{ value: null, label: formatMessage(intl, "claimlens", "documentType.null") }]
      : []
    ).concat(
      (documentTypes || []).map((dt) => ({
        value: dt.code,
        label: `${dt.code} - ${dt.name}`,
      }))
    );

    return (
      <SelectInput
        module="claimlens"
        label={withLabel ? "documentType" : " "}
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
  documentTypes: state.claimlens.documentTypes,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchDocumentTypes }, dispatch);

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(injectIntl(DocumentClassificationPicker))
);
