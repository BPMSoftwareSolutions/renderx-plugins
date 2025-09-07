import { openUiFile } from "./import.file.stage-crew";
import { parseUiFile } from "./import.parse.pure";
import { injectCssClasses } from "./import.css.stage-crew";
import {
  createComponentsSequentially,
  applyHierarchyAndOrder,
} from "./import.nodes.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  openUiFile,
  parseUiFile,
  injectCssClasses,
  createComponentsSequentially,
  applyHierarchyAndOrder,
};
