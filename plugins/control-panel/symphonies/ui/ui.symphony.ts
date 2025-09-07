import {
  initConfig,
  initResolver,
  loadSchemas,
  registerObservers,
  notifyReady,
  generateFields,
  generateSections,
  renderView,
  prepareField,
  dispatchField,
  setDirty,
  awaitRefresh,
  validateField,
  mergeErrors,
  updateView,
  toggleSection,
  initMovement,
} from "./ui.stage-crew";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  // ui.init handlers
  initConfig,
  initResolver,
  loadSchemas,
  registerObservers,
  notifyReady,
  initMovement,

  // ui.render handlers
  generateFields,
  generateSections,
  renderView,

  // ui.field.change handlers
  prepareField,
  dispatchField,
  setDirty,
  awaitRefresh,

  // ui.field.validate handlers
  validateField,
  mergeErrors,
  updateView,

  // ui.section.toggle handlers
  toggleSection,
};
