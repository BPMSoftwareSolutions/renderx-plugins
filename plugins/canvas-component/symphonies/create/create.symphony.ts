import { resolveTemplate } from "./create.arrangement";
import { registerInstance } from "./create.io";
import { createNode } from "./create.stage-crew";
import { notifyUi } from "./create.notify";
import { enhanceLine } from "../augment/augment.line.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  resolveTemplate,
  registerInstance,
  createNode,
  notifyUi,
  enhanceLine,
};
