// Canvas UI plugin sequence and handlers
export const sequence = {
  id: "Canvas.ui-symphony",
  name: "Canvas UI (Scaffold)",
  description: "Scaffold for Canvas UI plugin (center slot)",
  version: "0.1.0",
  key: "G Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui",
  movements: [
    {
      id: "ui",
      name: "UI Lifecycle",
      description: "Minimal UI lifecycle",
      beats: [
        {
          beat: 1,
          event: "canvas-ui:init",
          title: "Init UI",
          handler: "noop",
          dynamics: "p",
          timing: "immediate",
        },
      ],
    },
  ],

  events: { triggers: ["canvas-ui:init"], emits: ["canvas-ui:init"] },
  configuration: {},
};

export const handlers = {
  noop: () => ({}),
};

