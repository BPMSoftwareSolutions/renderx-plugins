import { EventBus } from "./EventBus";

export type StageCueOp =
  | { type: "update"; selector: string; classes?: { add?: string[]; remove?: string[] }; attrs?: Record<string, any>; style?: Record<string, string | number>; textContent?: string }
  | { type: "create"; tagName: string; attrs?: Record<string, any>; classes?: string[]; appendTo?: string; textContent?: string }
  | { type: "remove"; selector: string }
  | { type: "upsertStyle"; id: string; cssText: string };

export interface StageCueEvent {
  correlationId: string;
  meta?: any;
  batch?: boolean;
  ops: StageCueOp[];
  appliedAt: number;
}

export const stageEventBus = new EventBus();

export type StageCrewTxn = {
  update: (selector: string, patch: Partial<Extract<StageCueOp, { type: "update" }>>) => StageCrewTxn;
  create: (
    tagName: string,
    init?: Partial<Extract<StageCueOp, { type: "create" }>>
  ) => { appendTo: (selector: string) => StageCrewTxn } & StageCrewTxn;
  remove: (selector: string) => StageCrewTxn;
  upsertStyle: (id: string, cssText: string) => StageCrewTxn;
  commit: (opts?: { batch?: boolean }) => void;
};

class StageCrewImpl {
  constructor(private bus: EventBus) {}

  beginBeat(correlationId: string, meta?: any): StageCrewTxn {
    const ops: StageCueOp[] = [];

    const api: any = {
      update: (selector: string, patch: any) => {
        ops.push({ type: "update", selector, ...patch });
        return api;
      },
      create: (tagName: string, init?: any) => {
        const op: any = { type: "create", tagName, ...(init || {}) };
        ops.push(op);
        return {
          appendTo: (selector: string) => {
            op.appendTo = selector;
            return api;
          },
          ...api,
        };
      },
      remove: (selector: string) => {
        ops.push({ type: "remove", selector });
        return api;
      },
      upsertStyle: (id: string, cssText: string) => {
        ops.push({ type: "upsertStyle", id, cssText });
        return api;
      },
      commit: (opts?: { batch?: boolean }) => {
        const apply = () => {
          try {
            for (const op of ops) this.applyOp(op);
          } catch {}
          try {
            this.bus.emit("stage:cue", {
              correlationId,
              meta,
              batch: !!opts?.batch,
              ops,
              appliedAt: Date.now(),
            } as StageCueEvent);
          } catch {}
        };
        if (opts?.batch && typeof (globalThis as any).requestAnimationFrame === "function") {
          (globalThis as any).requestAnimationFrame(() => apply());
        } else {
          apply();
        }
      },
    } as StageCrewTxn;

    return api;
  }

  private applyOp(op: StageCueOp) {
    if (typeof document === "undefined") return;
    switch (op.type) {
      case "upsertStyle": {
        try {
          let el = document.getElementById(op.id) as HTMLStyleElement | null;
          if (!el) {
            el = document.createElement("style");
            el.id = op.id;
            document.head.appendChild(el);
          }
          el.textContent = op.cssText;
        } catch {}
        return;
      }
      case "update": {
        try {
          const target = document.querySelector(op.selector) as any;
          if (!target) return;
          if (op.classes) {
            const add = op.classes.add || [];
            const rm = op.classes.remove || [];
            add.forEach((c) => target.classList?.add?.(c));
            rm.forEach((c) => target.classList?.remove?.(c));
          }
          if (op.attrs) {
            for (const [k, v] of Object.entries(op.attrs)) {
              if (v == null) target.removeAttribute?.(k);
              else target.setAttribute?.(k, String(v));
            }
          }
          if (op.style) {
            for (const [k, v] of Object.entries(op.style)) {
              (target.style as any)[k] = v as any;
            }
          }
          if (typeof op.textContent === "string") {
            target.textContent = op.textContent;
          }
        } catch {}
        return;
      }
      case "create": {
        try {
          const el = document.createElement(op.tagName);
          if (op.classes?.length) el.className = op.classes.join(" ");
          if (op.attrs) {
            for (const [k, v] of Object.entries(op.attrs)) {
              if (v != null) el.setAttribute(k, String(v));
            }
          }
          if (typeof op.textContent === "string") el.textContent = op.textContent;
          if (op.appendTo) {
            const parent = document.querySelector(op.appendTo);
            parent?.appendChild?.(el);
          }
        } catch {}
        return;
      }
      case "remove": {
        try {
          const n = document.querySelector(op.selector) as any;
          n?.parentNode?.removeChild?.(n);
        } catch {}
        return;
      }
    }
  }
}

let singleton: StageCrewImpl | null = null;
export function getStageCrew(bus?: EventBus) {
  if (!singleton) singleton = new StageCrewImpl(bus || stageEventBus);
  return singleton;
}

