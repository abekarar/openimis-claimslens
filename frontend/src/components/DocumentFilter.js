import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { withStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";
import {
  withModulesManager,
  ControlledField,
  TextInput,
  PublishedComponent,
} from "@openimis/fe-core";

const styles = (theme) => ({
  form: { padding: 0 },
  item: { padding: theme.spacing(1) },
});

class DocumentFilter extends Component {
  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters[k] ? filters[k]["value"] : null;
  };

  _onChangeFilter = (k, v) => {
    this.props.onChangeFilters([
      {
        id: k,
        value: v,
        filter: `${k}: "${v}"`,
      },
    ]);
  };

  _onChangeStatusFilter = (k, v) => {
    this.props.onChangeFilters([
      {
        id: k,
        value: v,
        filter: v ? `status: ${v.toUpperCase()}` : null,
      },
    ]);
  };

  _onChangeClassificationFilter = (k, v) => {
    this.props.onChangeFilters([
      {
        id: k,
        value: v,
        filter: v ? `documentType_Code: "${v}"` : null,
      },
    ]);
  };

  _onChangeDateFilter = (k, v) => {
    this.props.onChangeFilters([
      {
        id: k,
        value: v,
        filter: v ? `${k}: "${v}"` : null,
      },
    ]);
  };

  render() {
    const { classes, intl } = this.props;
    return (
      <Grid container className={classes.form}>
        <ControlledField
          module="claimlens"
          id="DocumentFilter.filename"
          field={
            <Grid item xs={3}>
              <TextInput
                module="claimlens"
                label="filter.filename"
                value={this._filterValue("originalFilename_Icontains")}
                onChange={(v) =>
                  this._onChangeFilter("originalFilename_Icontains", v)
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="claimlens"
          id="DocumentFilter.status"
          field={
            <Grid item xs={3}>
              <PublishedComponent
                pubRef="claimlens.DocumentStatusPicker"
                value={this._filterValue("status")}
                onChange={(v) => this._onChangeStatusFilter("status", v)}
                withNull={true}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claimlens"
          id="DocumentFilter.classification"
          field={
            <Grid item xs={3}>
              <PublishedComponent
                pubRef="claimlens.DocumentClassificationPicker"
                value={this._filterValue("documentType_Code")}
                onChange={(v) =>
                  this._onChangeClassificationFilter("documentType_Code", v)
                }
                withNull={true}
              />
            </Grid>
          }
        />
        <ControlledField
          module="claimlens"
          id="DocumentFilter.dateRange"
          field={
            <Grid item xs={3}>
              <Grid container>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue("dateCreated_Gte")}
                    module="claimlens"
                    label="filter.dateCreatedFrom"
                    onChange={(d) =>
                      this._onChangeDateFilter("dateCreated_Gte", d)
                    }
                  />
                </Grid>
                <Grid item xs={6} className={classes.item}>
                  <PublishedComponent
                    pubRef="core.DatePicker"
                    value={this._filterValue("dateCreated_Lte")}
                    module="claimlens"
                    label="filter.dateCreatedTo"
                    onChange={(d) =>
                      this._onChangeDateFilter("dateCreated_Lte", d)
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          }
        />
      </Grid>
    );
  }
}

export default withModulesManager(injectIntl(withStyles(styles)(DocumentFilter)));
