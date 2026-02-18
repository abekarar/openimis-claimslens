import React from "react";
import { FindInPage } from "@material-ui/icons";
import { FormattedMessage } from "@openimis/fe-core";
import ClaimLensMainMenu from "./components/ClaimLensMainMenu";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import UploadPage from "./pages/UploadPage";
import DocumentStatusPicker from "./pickers/DocumentStatusPicker";
import DocumentClassificationPicker from "./pickers/DocumentClassificationPicker";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import {
  RIGHT_CLAIMLENS_DOCUMENTS,
  RIGHT_CLAIMLENS_UPLOAD,
  ROUTE_CLAIMLENS_DOCUMENTS,
  ROUTE_CLAIMLENS_DOCUMENT,
  ROUTE_CLAIMLENS_UPLOAD,
} from "./constants";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: "claimlens", reducer }],
  "refs": [
    { key: "claimlens.route.documents", ref: ROUTE_CLAIMLENS_DOCUMENTS },
    { key: "claimlens.route.document", ref: ROUTE_CLAIMLENS_DOCUMENT },
    { key: "claimlens.route.upload", ref: ROUTE_CLAIMLENS_UPLOAD },
    { key: "claimlens.DocumentStatusPicker", ref: DocumentStatusPicker },
    { key: "claimlens.DocumentStatusPicker.projection", ref: null },
    { key: "claimlens.DocumentClassificationPicker", ref: DocumentClassificationPicker },
    { key: "claimlens.DocumentClassificationPicker.projection", ref: null },
  ],
  "core.Router": [
    { path: ROUTE_CLAIMLENS_DOCUMENTS, component: DocumentsPage },
    { path: ROUTE_CLAIMLENS_DOCUMENT + "/:document_uuid", component: DocumentDetailPage },
    { path: ROUTE_CLAIMLENS_UPLOAD, component: UploadPage },
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
  ],
};

export const ClaimLensModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
