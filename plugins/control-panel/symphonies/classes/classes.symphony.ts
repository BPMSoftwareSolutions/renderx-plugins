import { addClass, removeClass } from "./classes.stage-crew";
import { getClassesObserver } from "../../state/observer.store";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  addClass,
  removeClass,
  notifyUi(data: any, ctx: any) {
    const observer = getClassesObserver();
    const { id, updatedClasses } = ctx.payload || {};

    if (observer && id && updatedClasses) {
      try {
        observer({ id, classes: updatedClasses });
      } catch (e) {
        ctx.logger?.warn?.("Control Panel classes observer error:", e);
      }
    }
  },
};
