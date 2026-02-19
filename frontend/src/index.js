import React from "react";
import { FindInPage, Tune } from "@material-ui/icons";
import { FormattedMessage } from "@openimis/fe-core";
import ClaimLensMainMenu from "./components/ClaimLensMainMenu";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import UploadPage from "./pages/UploadPage";
import ValidationRuleDetailPage from "./pages/ValidationRuleDetailPage";
import SettingsPage from "./pages/SettingsPage";
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
  RIGHT_CLAIMLENS_DOCUMENT_TYPES,
  RIGHT_CLAIMLENS_ENGINE_CONFIGS,
  RIGHT_CLAIMLENS_MODULE_CONFIG,
  ROUTE_CLAIMLENS_DOCUMENTS,
  ROUTE_CLAIMLENS_DOCUMENT,
  ROUTE_CLAIMLENS_UPLOAD,
  ROUTE_CLAIMLENS_VALIDATION_RULE,
  ROUTE_CLAIMLENS_SETTINGS,
} from "./constants";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "claimlens", reducer }],
  "refs": [
    { key: "claimlens.route.documents", ref: ROUTE_CLAIMLENS_DOCUMENTS },
    { key: "claimlens.route.document", ref: ROUTE_CLAIMLENS_DOCUMENT },
    { key: "claimlens.route.upload", ref: ROUTE_CLAIMLENS_UPLOAD },
    { key: "claimlens.route.validationRule", ref: ROUTE_CLAIMLENS_VALIDATION_RULE },
    { key: "claimlens.route.settings", ref: ROUTE_CLAIMLENS_SETTINGS },
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
    { path: ROUTE_CLAIMLENS_VALIDATION_RULE + "/:rule_uuid", component: ValidationRuleDetailPage },
    { path: ROUTE_CLAIMLENS_VALIDATION_RULE, component: ValidationRuleDetailPage },
    { path: ROUTE_CLAIMLENS_SETTINGS, component: SettingsPage },
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
      text: <FormattedMessage module="claimlens" id="menu.settings" />,
      icon: <Tune />,
      route: "/" + ROUTE_CLAIMLENS_SETTINGS,
      id: "claimlens.menu.settings",
      filter: (rights) =>
        [RIGHT_CLAIMLENS_MODULE_CONFIG, RIGHT_CLAIMLENS_DOCUMENT_TYPES, RIGHT_CLAIMLENS_ENGINE_CONFIGS, RIGHT_CLAIMLENS_ROUTING_POLICY, RIGHT_CLAIMLENS_VALIDATION_RULES].some((r) => rights.includes(r)),
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
  linkDocumentToClaim,
  updateModuleConfig,
  fetchEngineRoutingRules,
  createEngineRoutingRule,
  updateEngineRoutingRule,
} from "./actions";

export const ClaimLensModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
