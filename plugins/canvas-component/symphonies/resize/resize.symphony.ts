import { startResize, updateSize, endResize } from "./resize.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = { startResize, updateSize, endResize };

