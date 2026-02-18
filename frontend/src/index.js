import React from "react";
import { FindInPage, Settings, GavelRounded } from "@material-ui/icons";
import { FormattedMessage } from "@openimis/fe-core";
import ClaimLensMainMenu from "./components/ClaimLensMainMenu";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import UploadPage from "./pages/UploadPage";
import ModelRoutingPage from "./pages/ModelRoutingPage";
import ValidationRulesPage from "./pages/ValidationRulesPage";
import ValidationRuleDetailPage from "./pages/ValidationRuleDetailPage";
import DocumentStatusPicker from "./pickers/DocumentStatusPicker";
import DocumentClassificationPicker from "./pickers/DocumentClassificationPicker";
import ValidationStatusPicker from "./pickers/ValidationStatusPicker";
import ValidationSeverityPicker from "./pickers/ValidationSeverityPicker";
import FindingResolutionPicker from "./pickers/FindingResolutionPicker";
import ProposalStatusPicker from "./pickers/ProposalStatusPicker";
import LanguagePicker from "./pickers/LanguagePicker";
import RuleTypePicker from "./pickers/RuleTypePicker";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import {
  RIGHT_CLAIMLENS_DOCUMENTS,
  RIGHT_CLAIMLENS_UPLOAD,
  RIGHT_CLAIMLENS_ROUTING_POLICY,
  RIGHT_CLAIMLENS_VALIDATION_RULES,
  ROUTE_CLAIMLENS_DOCUMENTS,
  ROUTE_CLAIMLENS_DOCUMENT,
  ROUTE_CLAIMLENS_UPLOAD,
  ROUTE_CLAIMLENS_MODEL_ROUTING,
  ROUTE_CLAIMLENS_VALIDATION_RULES,
  ROUTE_CLAIMLENS_VALIDATION_RULE,
} from "./constants";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "claimlens", reducer }],
  "refs": [
    { key: "claimlens.route.documents", ref: ROUTE_CLAIMLENS_DOCUMENTS },
    { key: "claimlens.route.document", ref: ROUTE_CLAIMLENS_DOCUMENT },
    { key: "claimlens.route.upload", ref: ROUTE_CLAIMLENS_UPLOAD },
    { key: "claimlens.route.modelRouting", ref: ROUTE_CLAIMLENS_MODEL_ROUTING },
    { key: "claimlens.route.validationRules", ref: ROUTE_CLAIMLENS_VALIDATION_RULES },
    { key: "claimlens.route.validationRule", ref: ROUTE_CLAIMLENS_VALIDATION_RULE },
    { key: "claimlens.DocumentStatusPicker", ref: DocumentStatusPicker },
    { key: "claimlens.DocumentStatusPicker.projection", ref: null },
    { key: "claimlens.DocumentClassificationPicker", ref: DocumentClassificationPicker },
    { key: "claimlens.DocumentClassificationPicker.projection", ref: null },
    { key: "claimlens.ValidationStatusPicker", ref: ValidationStatusPicker },
    { key: "claimlens.ValidationStatusPicker.projection", ref: null },
    { key: "claimlens.ValidationSeverityPicker", ref: ValidationSeverityPicker },
    { key: "claimlens.ValidationSeverityPicker.projection", ref: null },
    { key: "claimlens.FindingResolutionPicker", ref: FindingResolutionPicker },
    { key: "claimlens.FindingResolutionPicker.projection", ref: null },
    { key: "claimlens.ProposalStatusPicker", ref: ProposalStatusPicker },
    { key: "claimlens.ProposalStatusPicker.projection", ref: null },
    { key: "claimlens.LanguagePicker", ref: LanguagePicker },
    { key: "claimlens.LanguagePicker.projection", ref: null },
    { key: "claimlens.RuleTypePicker", ref: RuleTypePicker },
    { key: "claimlens.RuleTypePicker.projection", ref: null },
  ],
  "core.Router": [
    { path: ROUTE_CLAIMLENS_DOCUMENTS, component: DocumentsPage },
    { path: ROUTE_CLAIMLENS_DOCUMENT + "/:document_uuid", component: DocumentDetailPage },
    { path: ROUTE_CLAIMLENS_UPLOAD, component: UploadPage },
    { path: ROUTE_CLAIMLENS_MODEL_ROUTING, component: ModelRoutingPage },
    { path: ROUTE_CLAIMLENS_VALIDATION_RULES, component: ValidationRulesPage },
    { path: ROUTE_CLAIMLENS_VALIDATION_RULE + "/:rule_uuid", component: ValidationRuleDetailPage },
    { path: ROUTE_CLAIMLENS_VALIDATION_RULE, component: ValidationRuleDetailPage },
  ],
  "core.MainMenu": [
    { name: "ClaimLensMainMenu", component: ClaimLensMainMenu },
  ],
  "claimlens.MainMenu": [
    {
      text: <FormattedMessage module="claimlens" id="menu.documents" />,
      icon: <FindInPage />,
      route: "/" + ROUTE_CLAIMLENS_DOCUMENTS,
      id: "claimlens.menu.documents",
      filter: (rights) => rights.includes(RIGHT_CLAIMLENS_DOCUMENTS),
    },
    {
      text: <FormattedMessage module="claimlens" id="menu.upload" />,
      icon: <FindInPage />,
      route: "/" + ROUTE_CLAIMLENS_UPLOAD,
      id: "claimlens.menu.upload",
      filter: (rights) => rights.includes(RIGHT_CLAIMLENS_UPLOAD),
    },
    {
      text: <FormattedMessage module="claimlens" id="menu.modelRouting" />,
      icon: <Settings />,
      route: "/" + ROUTE_CLAIMLENS_MODEL_ROUTING,
      id: "claimlens.menu.modelRouting",
      filter: (rights) => rights.includes(RIGHT_CLAIMLENS_ROUTING_POLICY),
    },
    {
      text: <FormattedMessage module="claimlens" id="menu.validationRules" />,
      icon: <GavelRounded />,
      route: "/" + ROUTE_CLAIMLENS_VALIDATION_RULES,
      id: "claimlens.menu.validationRules",
      filter: (rights) => rights.includes(RIGHT_CLAIMLENS_VALIDATION_RULES),
    },
  ],
};

export {
  fetchDocuments,
  fetchDocument,
  fetchExtractionResult,
  fetchDocumentTypes,
  fetchEngineConfigs,
  fetchAuditLogs,
  processDocument,
  createDocumentType,
  updateDocumentType,
  createEngineConfig,
  updateEngineConfig,
  uploadDocument,
  fetchCapabilityScores,
  createCapabilityScore,
  updateCapabilityScore,
  fetchRoutingPolicy,
  updateRoutingPolicy,
  fetchValidationResults,
  fetchValidationRules,
  fetchValidationRule,
  createValidationRule,
  updateValidationRule,
  fetchRegistryProposals,
  runValidation,
  reviewRegistryProposal,
  applyRegistryProposal,
  resolveValidationFinding,
} from "./actions";

export const ClaimLensModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
