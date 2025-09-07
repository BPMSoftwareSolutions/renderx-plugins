import { 
  createCssClass, 
  updateCssClass, 
  deleteCssClass, 
  getCssClass, 
  listCssClasses,
  applyCssClassToElement,
  removeCssClassFromElement
} from "./css-management.stage-crew";
import { getCssRegistryObserver } from "../../state/observer.store";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  createCssClass,
  updateCssClass,
  deleteCssClass,
  getCssClass,
  listCssClasses,
  applyCssClassToElement,
  removeCssClassFromElement,
  
  notifyUi(data: any, ctx: any) {
    const observer = getCssRegistryObserver();
    const { success, className, content, error } = ctx.payload || {};

    if (observer) {
      try {
        observer({ 
          success, 
          className, 
          content, 
          error,
          timestamp: Date.now()
        });
      } catch (e) {
        ctx.logger?.warn?.("Control Panel CSS registry observer error:", e);
      }
    }
  },
};
