// Canvas UI Plugin index  API surface only
export { sequence, handlers } from './core/sequence.js';
export { CanvasPage } from './core/CanvasPage.js';
export { renderCanvasNode } from './core/renderCanvasNode.js';

// Export StageCrew-compliant CSS functions for CIA/SPA migration
export {
  updateInstancePositionCSSViaStageCrew,
  updateInstanceSizeCSSViaStageCrew
} from './styles/instanceCss.js';

// Export overlay helper functions
export {
  overlayInjectGlobalCSS as overlayEnsureGlobalCSS,
  overlayInjectInstanceCSS as overlayEnsureInstanceCSS
} from './utils/styles.js';
