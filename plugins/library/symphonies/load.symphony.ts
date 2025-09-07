// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.
import { mapJsonComponentToTemplate } from "@renderx/host-sdk";
import { cssRegistry } from "../../control-panel/state/css-registry.store";

function mapJsonComponentToTemplateCompat(json: any) {
  const tpl = mapJsonComponentToTemplate(json);
  const type = json?.metadata?.replaces || json?.metadata?.type || "div";
  return {
    id: `json-${type}`,
    name: json?.metadata?.name || type,
    template: tpl,
    metadata: json?.metadata || {},
    // Preserve original UI for CSS extraction in Node/test path
    ui: json?.ui,
  };
}

export const handlers = {
  async loadComponents(_data: any, ctx: any) {
    let list: any[] = [];
    try {
      const isVitest = (() => {
        try {
          // @ts-ignore - Vitest injects this flag
          return (
            !!(import.meta as any)?.vitest || process.env.NODE_ENV === "test"
          );
        } catch {
          return process.env.NODE_ENV === "test";
        }
      })();

      if (typeof fetch === "function" && !isVitest) {
        // Browser/dev server path: serve from public/json-components using JSON index
        const idxRes = await fetch("/json-components/index.json");
        const idx = idxRes.ok ? await idxRes.json() : { components: [] };
        const files: string[] = idx?.components || [];
        const base = "/json-components/";
        const items: any[] = [];
        for (const f of files) {
          const res = await fetch(base + f);
          if (res.ok) {
            const json = await res.json();
            items.push(mapJsonComponentToTemplateCompat(json));
          }
        }
        list = items;
      } else {
        // Test/Node path: use repo json-components folder
        const idx = await import("../../../json-components/index.json", {
          with: { type: "json" },
        } as any);
        const files: string[] =
          idx?.default?.components || idx?.components || [];
        const items: any[] = [];
        for (const f of files) {
          const mod = await import(
            /* @vite-ignore */ `../../../json-components/${f}`,
            { with: { type: "json" } } as any
          );
          const json = mod?.default || mod;
          items.push(mapJsonComponentToTemplateCompat(json));
        }
        list = items;
      }
    } catch {
      // fallback to legacy data list on error
      try {
        const mod = await import("../../../data/components.json", {
          with: { type: "json" },
        } as any);
        list = mod?.default || [];
      } catch {}
    }

    // Register JSON component CSS into CSS registry so exports include CSS
    try {
      const seen = new Set<string>();
      for (const item of Array.isArray(list) ? list : []) {
        // Support both shapes: { id, name, template, metadata } and plain template
        const tpl = item?.template ?? item;
        let css: string | undefined = tpl?.css;

        // Also check for CSS in the original JSON structure (ui.styles.css)
        if (!css && item?.ui?.styles?.css) {
          css = item.ui.styles.css;
        }

        if (typeof css === "string" && css.trim().length) {
          // derive base class (exclude rx-comp)
          const classes: string[] = Array.isArray(tpl?.classes)
            ? tpl.classes
            : [];
          const base = classes.find(
            (c) => c.startsWith("rx-") && c !== "rx-comp"
          );
          const metaType = item?.metadata?.replaces || item?.metadata?.type;
          const name = base || (metaType ? `rx-${metaType}` : undefined);
          if (name && !seen.has(name)) {
            if (cssRegistry.hasClass(name)) cssRegistry.updateClass(name, css);
            else cssRegistry.createClass(name, css);
            seen.add(name);
          }
        }
      }
      const count = seen.size;
      if (count)
        ctx.logger?.info?.(
          `Registered ${count} JSON component CSS classes into registry`
        );
    } catch (e) {
      ctx.logger?.warn?.("Failed to register JSON component CSS:", e);
    }

    ctx.payload.components = Array.isArray(list) ? list : [];
    return { count: ctx.payload.components.length };
  },
  notifyUi(data: any, ctx: any) {
    data?.onComponentsLoaded?.(ctx.payload.components);
  },
};
