export type NodeInput = {
  id: string;
  cssClass: string;
  type: string; // e.g. 'button'
  position: { x: number; y: number };
  width?: number | string; // from integration default
  height?: number | string; // from integration default
  variant?: string; // e.g. 'primary'
  size?: string; // e.g. 'md'
  content?: string; // e.g. 'Button'
};

export function buildExpectedHTML(node: NodeInput) {
  const variant = node.variant ?? 'primary';
  const size = node.size ?? 'md';
  const content = node.content ?? 'Button';

  const classes = [
    node.cssClass,
    'rx-button',
    `rx-button--${variant}`,
    `rx-button--${size}`,
  ]
    .filter(Boolean)
    .join(' ');

  return `<${node.type} id="${node.id}" class="${classes}" data-component-id="${node.id}" draggable="true">${content}</${node.type}>`;
}

function px(v?: number | string) {
  if (v == null) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export function buildExpectedInstanceCSS(node: NodeInput) {
  const base = `.${node.cssClass} { position: absolute; left: ${px(node.position.x)}; top: ${px(node.position.y)}; box-sizing: border-box; display: block; }`;
  const width = px(node.width);
  const height = px(node.height);
  const w = width ? `\n.${node.cssClass} { width: ${width}; }` : '';
  const h = height ? `\n.${node.cssClass} { height: ${height}; }` : '';
  return `${base}${w}${h}`;
}

