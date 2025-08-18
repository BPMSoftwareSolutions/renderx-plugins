// JS Stage Crew shim for utils that are authored in JS
// Exports: getStageCrew(), stageEventBus (CommonJS)

class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  subscribe(type, fn) {
    const list = this.listeners.get(type) || [];
    list.push(fn);
    this.listeners.set(type, list);
    return () => {
      const ls = this.listeners.get(type) || [];
      const i = ls.indexOf(fn);
      if (i >= 0) ls.splice(i, 1);
      this.listeners.set(type, ls);
    };
  }
  emit(type, payload) {
    const list = this.listeners.get(type) || [];
    for (const fn of list) {
      try {
        fn(payload);
      } catch {}
    }
  }
}

const stageEventBus = new EventBus();

class StageCrewImpl {
  constructor(bus) {
    this.bus = bus;
  }
  beginBeat(correlationId, meta) {
    const ops = [];
    const api = {
      update: (selector, patch) => {
        ops.push({ type: "update", selector, ...(patch || {}) });
        return api;
      },
      create: (tagName, init) => {
        const op = { type: "create", tagName, ...(init || {}) };
        ops.push(op);
        return Object.assign(api, {
          appendTo: (selector) => {
            op.appendTo = selector;
            return api;
          },
        });
      },
      remove: (selector) => {
        ops.push({ type: "remove", selector });
        return api;
      },
      upsertStyle: (id, cssText) => {
        ops.push({ type: "upsertStyle", id, cssText });
        return api;
      },
      commit: (opts) => {
        const apply = () => {
          try {
            for (const op of ops) this.applyOp(op);
          } catch {}
          try {
            this.bus.emit("stage:cue", {
              correlationId,
              meta,
              batch: !!(opts && opts.batch),
              ops,
              appliedAt: Date.now(),
            });
          } catch {}
        };
        const raf =
          (typeof globalThis !== "undefined" &&
            globalThis.requestAnimationFrame) ||
          null;
        if (opts && opts.batch && typeof raf === "function") raf(() => apply());
        else apply();
      },
    };
    return api;
  }
  applyOp(op) {
    if (typeof document === "undefined" || !document) return;
    switch (op.type) {
      case "upsertStyle": {
        try {
          let el = document.getElementById(op.id);
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
          const target = document.querySelector(op.selector);
          if (!target) return;
          if (op.classes) {
            const add = op.classes.add || [];
            const rm = op.classes.remove || [];
            add.forEach(
              (c) =>
                target.classList &&
                target.classList.add &&
                target.classList.add(c)
            );
            rm.forEach(
              (c) =>
                target.classList &&
                target.classList.remove &&
                target.classList.remove(c)
            );
          }
          if (op.attrs) {
            for (const k of Object.keys(op.attrs)) {
              const v = op.attrs[k];
              if (v == null)
                target.removeAttribute && target.removeAttribute(k);
              else target.setAttribute && target.setAttribute(k, String(v));
            }
          }
          if (op.style) {
            for (const k of Object.keys(op.style)) {
              try {
                target.style[k] = op.style[k];
              } catch {}
            }
          }
          if (typeof op.textContent === "string")
            target.textContent = op.textContent;
        } catch {}
        return;
      }
      case "create": {
        try {
          const el = document.createElement(op.tagName);
          if (op.classes && op.classes.length)
            el.className = op.classes.join(" ");
          if (op.attrs) {
            for (const k of Object.keys(op.attrs)) {
              const v = op.attrs[k];
              if (v != null) el.setAttribute(k, String(v));
            }
          }
          if (typeof op.textContent === "string")
            el.textContent = op.textContent;
          if (op.appendTo) {
            const parent = document.querySelector(op.appendTo);
            parent && parent.appendChild && parent.appendChild(el);
          }
        } catch {}
        return;
      }
      case "remove": {
        try {
          const n = document.querySelector(op.selector);
          n &&
            n.parentNode &&
            n.parentNode.removeChild &&
            n.parentNode.removeChild(n);
        } catch {}
        return;
      }
    }
  }
}

let singleton = null;
function getStageCrew() {
  if (!singleton) singleton = new StageCrewImpl(stageEventBus);
  return singleton;
}

module.exports = { stageEventBus, getStageCrew };
