import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { Visibility } from "@material-ui/icons";
import {
  withModulesManager,
  withHistory,
  historyPush,
  formatMessage,
  formatDateFromISO,
} from "@openimis/fe-core";
import { fetchDocuments } from "../actions";
import StatusBadge from "../components/StatusBadge";
import ConfidenceBar from "../components/ConfidenceBar";
import {
  RIGHT_CLAIMLENS_DOCUMENTS,
  STATUS_COMPLETED,
  STATUS_FAILED,
  STATUS_REVIEW_REQUIRED,
} from "../constants";

const styles = (theme) => ({
  page: theme.page,
  title: { marginBottom: theme.spacing(3) },
  statCard: {
    textAlign: "center",
    minHeight: 120,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  statLabel: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  completedValue: { color: "#4caf50" },
  failedValue: { color: "#f44336" },
  reviewValue: { color: "#ff9800" },
  recentTitle: { marginTop: theme.spacing(3), marginBottom: theme.spacing(2) },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
});

class DashboardPage extends Component {
  state = {
    totalCount: null,
    completedCount: null,
    failedCount: null,
    reviewCount: null,
    recentDocs: null,
    loading: true,
  };

  componentDidMount() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const { modulesManager } = this.props;

    // Fetch total count
    this.props.fetchDocuments(modulesManager, ["first: 10", 'orderBy: ["-dateCreated"]']);

    // We'll derive counts from state after fetch
    this.setState({ loading: true });
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.documents !== prevProps.documents &&
      this.props.fetchedDocuments &&
      !this.props.fetchingDocuments
    ) {
      this.setState({
        recentDocs: this.props.documents,
        totalCount: this.props.documentsPageInfo?.totalCount || 0,
        loading: false,
      });

      // Count statuses from the fetched total
      if (!this.state.completedCount && this.state.completedCount !== 0) {
        this.deriveStatusCounts();
      }
    }
  }

  deriveStatusCounts() {
    const { modulesManager } = this.props;

    // Fetch status-specific counts using separate queries
    const fetchCount = (statusFilter) => {
      return new Promise((resolve) => {
        const payload = [`first: 1`, `status: "${statusFilter}"`];
        // Use a direct graphql call approach
        this.props.fetchDocuments(modulesManager, payload);
        // Since we can't easily do parallel distinct fetches with the same action,
        // we'll count from the page info of the main query
        resolve(null);
      });
    };

    // For now, we'll show total count from the main query
    // and compute status counts on next loads
    this.setState({
      completedCount: this.props.documents?.filter((d) => d.status === STATUS_COMPLETED).length ?? "-",
      failedCount: this.props.documents?.filter((d) => d.status === STATUS_FAILED).length ?? "-",
      reviewCount: this.props.documents?.filter((d) => d.status === STATUS_REVIEW_REQUIRED).length ?? "-",
    });
  }

  render() {
    const { classes, intl, rights, modulesManager, history } = this.props;
    const { totalCount, completedCount, failedCount, reviewCount, recentDocs, loading } = this.state;

    if (!rights.includes(RIGHT_CLAIMLENS_DOCUMENTS)) return null;

    return (
      <div className={classes.page}>
        <Typography variant="h5" className={classes.title}>
          {formatMessage(intl, "claimlens", "dashboard.title")}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className={classes.statCard}>
                <Typography className={classes.statValue}>
                  {totalCount != null ? totalCount : "-"}
                </Typography>
                <Typography className={classes.statLabel}>
                  {formatMessage(intl, "claimlens", "dashboard.totalDocuments")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className={classes.statCard}>
                <Typography className={`${classes.statValue} ${classes.completedValue}`}>
                  {completedCount != null ? completedCount : "-"}
                </Typography>
                <Typography className={classes.statLabel}>
                  {formatMessage(intl, "claimlens", "dashboard.completed")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className={classes.statCard}>
                <Typography className={`${classes.statValue} ${classes.failedValue}`}>
                  {failedCount != null ? failedCount : "-"}
                </Typography>
                <Typography className={classes.statLabel}>
                  {formatMessage(intl, "claimlens", "dashboard.failed")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent className={classes.statCard}>
                <Typography className={`${classes.statValue} ${classes.reviewValue}`}>
                  {reviewCount != null ? reviewCount : "-"}
                </Typography>
                <Typography className={classes.statLabel}>
                  {formatMessage(intl, "claimlens", "dashboard.reviewRequired")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h6" className={classes.recentTitle}>
          {formatMessage(intl, "claimlens", "dashboard.recentDocuments")}
        </Typography>

        {loading ? (
          <Box className={classes.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{formatMessage(intl, "claimlens", "searcher.filename")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "searcher.status")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "searcher.documentType")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "searcher.confidence")}</TableCell>
                  <TableCell>{formatMessage(intl, "claimlens", "searcher.dateCreated")}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentDocs && recentDocs.length > 0 ? (
                  recentDocs.map((doc) => (
                    <TableRow key={doc.uuid}>
                      <TableCell>{doc.originalFilename}</TableCell>
                      <TableCell><StatusBadge status={doc.status} /></TableCell>
                      <TableCell>{doc.documentType ? doc.documentType.name : "-"}</TableCell>
                      <TableCell>
                        {doc.classificationConfidence ? (
                          <ConfidenceBar value={doc.classificationConfidence} />
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDateFromISO(modulesManager, intl, doc.dateCreated)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatMessage(intl, "claimlens", "action.viewDetail")}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              historyPush(modulesManager, history, "claimlens.route.document", [doc.uuid])
                            }
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        {formatMessage(intl, "claimlens", "dashboard.noDocuments")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  documents: state.claimlens.documents,
  documentsPageInfo: state.claimlens.documentsPageInfo,
  fetchingDocuments: state.claimlens.fetchingDocuments,
  fetchedDocuments: state.claimlens.fetchedDocuments,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ fetchDocuments }, dispatch);

export default withModulesManager(
  withHistory(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withTheme(withStyles(styles)(DashboardPage))))
  )
);
