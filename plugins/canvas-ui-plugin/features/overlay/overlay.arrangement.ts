// Overlay Arrangement (Service): builds CSS rule strings; pure functions
export const overlayArrangement = {
  transformRule(elementId: string, dx: number = 0, dy: number = 0): string {
    const x = Math.round(dx) || 0;
    const y = Math.round(dy) || 0;
    return `.rx-overlay-${elementId}{transform:translate(${x}px,${y}px);}`;
  },

  hideRule(elementId: string): string {
    return `.rx-overlay-${elementId}{display:none;}`;
    },

  instanceRule(
    elementId: string,
    position: { x?: number; y?: number } = { x: 0, y: 0 },
    size: { w?: number | string; h?: number | string } = {}
  ): string {
    const x = typeof position.x === 'number' ? position.x : 0;
    const y = typeof position.y === 'number' ? position.y : 0;
    const w = typeof size.w === 'number' ? `${size.w}px` : size.w;
    const h = typeof size.h === 'number' ? `${size.h}px` : size.h;
    const widthLine = w != null ? `width:${w};` : '';
    const heightLine = h != null ? `height:${h};` : '';
    return `.rx-overlay-${elementId}{position:absolute;left:${x}px;top:${y}px;${widthLine}${heightLine}z-index:10;}`;
  },
};

