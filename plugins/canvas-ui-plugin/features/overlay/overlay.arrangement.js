// Overlay Arrangement (Service): builds CSS rule strings; pure functions
export const overlayArrangement = {
  transformRule(elementId, dx = 0, dy = 0) {
    const x = Math.round(dx) || 0;
    const y = Math.round(dy) || 0;
    return `.rx-overlay-${elementId}{transform:translate(${x}px,${y}px);}`;
  },

  hideRule(elementId) {
    return `.rx-overlay-${elementId}{display:none;}`;
  },

  instanceRule(elementId, position = { x: 0, y: 0 }, size = {}) {
    const x = typeof position.x === 'number' ? position.x : 0;
    const y = typeof position.y === 'number' ? position.y : 0;
    const w = size && typeof size.w === 'number' ? `${size.w}px` : size?.w;
    const h = size && typeof size.h === 'number' ? `${size.h}px` : size?.h;
    const widthLine = w != null ? `width:${w};` : '';
    const heightLine = h != null ? `height:${h};` : '';
    return `.rx-overlay-${elementId}{position:absolute;left:${x}px;top:${y}px;${widthLine}${heightLine}z-index:10;}`;
  },
};

