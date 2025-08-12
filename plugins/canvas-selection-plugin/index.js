/**
 * Canvas Component Selection Plugin (callback-first)
 */

export const sequence = {
  id: "Canvas.component-select-symphony",
  name: "Canvas Component Selection Symphony",
  description: "Select/deselect a canvas component and notify via callback",
  version: "1.0.0",
  key: "C Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "selection",
      name: "Selection",
      description: "Select or clear selection",
      beats: [
        {
          beat: 1,
          event: "canvas:selection:show",
          title: "Show selection",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleSelect",
        },
        {
          beat: 2,
          event: "canvas:selection:hide",
          title: "Hide selection",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleFinalize",
        },
      ],
    },
  ],
  events: {
    triggers: ["canvas:selection:show", "canvas:selection:hide"],
    emits: ["canvas:selection:show", "canvas:selection:hide"],
  },
};

export const handlers = {
  handleSelect: ({ elementId, onSelectionChange }, ctx) => {
    try {
      onSelectionChange?.(elementId);
    } catch {}
    return { elementId, selected: true };
  },
  handleFinalize: ({ elementId, clearSelection, onSelectionChange }, ctx) => {
    try {
      if (clearSelection === true) onSelectionChange?.(null);
    } catch {}
    return { elementId: elementId ?? null, cleared: clearSelection === true };
  },
};
