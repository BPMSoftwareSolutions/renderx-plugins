import { updateAttribute, refreshControlPanel } from "./update.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  updateAttribute,
  refreshControlPanel,
};
