// Stage-crew handler: Export SVG component to GIF
import GIF from "gif.js.optimized";
import workerUrl from "gif.js.optimized/dist/gif.worker.js?url";

function makeGifEncoder(
  width: number,
  height: number,
  opts?: Partial<{
    repeat: number;
    quality: number;
    workers: number;
  }>
) {
  return new GIF({
    workers: opts?.workers ?? 2,
    workerScript: workerUrl,
    quality: opts?.quality ?? 10, // lower = better quality, slower
    repeat: opts?.repeat ?? 0, // 0=infinite
    width,
    height,
  });
}

export async function exportSvgToGif(data: any, ctx: any) {
  try {
    if (typeof document === "undefined") {
      ctx.payload.error = "Browser environment required for GIF export";
      return;
    }

    // Initial payload arrives as `data`; ctx.payload is the baton across beats.
    // Since this sequence has a single beat, prefer `data` and fallback to ctx.payload for tests.
    const baton =
      data && Object.keys(data || {}).length > 0 ? data : ctx.payload || {};
    const { targetId, options } = baton as any;

    if (!targetId) {
      ctx.payload.error = "No target element ID provided";
      return;
    }

    // Find the target SVG element
    const svgEl = document.getElementById(targetId) as SVGElement | null;
    if (!svgEl) {
      ctx.payload.error = `Element with ID "${targetId}" not found`;
      return;
    }

    if (svgEl.tagName.toLowerCase() !== "svg") {
      ctx.payload.error = "Selected element is not an SVG";
      return;
    }

    // Determine output size
    // For SVG components, prefer the intended dimensions over the visible bounding box
    // since components can be positioned off-screen (negative x/y) causing clipping
    const bbox = svgEl.getBoundingClientRect();
    let width = Math.round(options?.width ?? bbox.width);
    let height = Math.round(options?.height ?? bbox.height);

    // If the element appears to be clipped (very small bbox but has CSS dimensions),
    // use the CSS dimensions instead
    const cssWidth = parseFloat(svgEl.style.width) || 0;
    const cssHeight = parseFloat(svgEl.style.height) || 0;

    if (
      cssWidth > 0 &&
      cssHeight > 0 &&
      (bbox.width < cssWidth * 0.95 || bbox.height < cssHeight * 0.95)
    ) {
      width = Math.round(options?.width ?? cssWidth);
      height = Math.round(options?.height ?? cssHeight);
      ctx.logger?.info?.(
        `Using CSS dimensions (${width}x${height}) instead of bbox (${Math.round(
          bbox.width
        )}x${Math.round(bbox.height)}) due to clipping`
      );
    }

    if (width <= 0 || height <= 0) {
      ctx.payload.error = "Invalid dimensions for export";
      return;
    }

    ctx.logger?.info?.(
      `Exporting SVG "${targetId}" to GIF (${width}x${height})`
    );

    // Debug: Log SVG element details
    ctx.logger?.info?.(
      `SVG element position: left=${svgEl.style.left}, top=${svgEl.style.top}`
    );
    ctx.logger?.info?.(`SVG viewBox: ${svgEl.getAttribute("viewBox")}`);
    ctx.logger?.info?.(
      `SVG bbox: ${Math.round(bbox.width)}x${Math.round(
        bbox.height
      )} at (${Math.round(bbox.left)}, ${Math.round(bbox.top)})`
    );
    ctx.logger?.info?.(
      `SVG CSS size: ${svgEl.style.width} x ${svgEl.style.height}`
    );

    // Try server-side export via Python/Playwright/FFmpeg (Option A)
    // Only use server export when explicitly enabled via window.EXPORT_SERVER_ENABLED or options.serverExport === true
    const prefersServer =
      (window as any).EXPORT_SERVER_ENABLED === true ||
      (options as any)?.serverExport === true;
    if (prefersServer) {
      try {
        const serializer = new XMLSerializer();
        const svgClone = svgEl.cloneNode(true) as SVGElement;
        svgClone.setAttribute("width", String(width));
        svgClone.setAttribute("height", String(height));
        const svgString = serializer.serializeToString(svgClone);

        const payload = {
          svg: svgString,
          width,
          height,
          fps: Math.max(1, Math.floor((options as any)?.fps ?? 20)),
          duration: Math.max(
            0,
            Math.floor(((options as any)?.durationMs ?? 10000) / 1000)
          ),
          maxColors: (options as any)?.maxColors ?? 256,
          dither: (options as any)?.dither ?? "sierra2_4a",
          loop: (options as any)?.loop ?? 0,
          filename: `${targetId}-${Date.now()}.gif`,
        } as any;

        const port = (window as any).EXPORT_SERVER_PORT || 5055;
        const resp = await fetch(`http://localhost:${port}/api/export/gif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const info = await resp.json().catch(() => ({}));
          ctx.logger?.error?.("Server export failed", info);
          throw new Error(
            (info as any)?.error ||
              `Export server error: ${resp.status} ${resp.statusText}`
          );
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = payload.filename;
        a.click();
        URL.revokeObjectURL(url);

        ctx.payload.downloadTriggered = true;
        (ctx.payload as any).gifSize = (blob as any).size;
        return;
      } catch (e) {
        ctx.logger?.warn?.(
          "Server-side GIF export failed, falling back to in-browser encoding",
          e
        );
        // fall through to client-side fallback
      }
    }

    // Fallback: client-side gif.js
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx2d = canvas.getContext("2d");

    if (!ctx2d) {
      ctx.payload.error = "2D context unavailable";
      return;
    }

    // Encode GIF using gif.js
    const gif = makeGifEncoder(width, height, {
      workers: 2,
      quality: 10,
      repeat: 0,
    });

    // Export scope and optional subtree selection
    const exportScope =
      (options?.exportScope as "inner" | "wrapper") ?? "inner";
    const contentSelector = options?.contentSelector as string | undefined;

    // Animation parameters - purely data-driven
    type KF = {
      selector: string;
      attr: string;
      from: number;
      to: number;
      kind?: "rotate" | "scale";
    };
    const keyframes: KF[] = (options?.animation?.keyframes as KF[]) || [];
    const fps = Math.max(1, Math.floor(options?.fps ?? 5));
    const durationMs = Math.max(0, Math.floor(options?.durationMs ?? 0));
    const totalFrames =
      durationMs > 0 ? Math.max(2, Math.round((fps * durationMs) / 1000)) : 1;
    const frameDelay =
      totalFrames <= 1 ? 100 : Math.max(1, Math.round(1000 / fps));

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    async function drawFrame(frameIndex: number) {
      const t = totalFrames <= 1 ? 0 : frameIndex / (totalFrames - 1);

      // Build the SVG serialization root based on export scope
      let svgClone: SVGElement;
      if (exportScope === "wrapper" && !contentSelector) {
        svgClone = svgEl.cloneNode(true) as SVGElement;
      } else {
        svgClone = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        // Ensure namespace for proper decoding in Image
        svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        // Preserve viewBox if provided; otherwise synthesize from export size
        const vb = svgEl.getAttribute("viewBox");
        if (vb) svgClone.setAttribute("viewBox", vb);
        else svgClone.setAttribute("viewBox", `0 0 ${width} ${height}`);

        if (contentSelector) {
          // Build content from a specific subtree plus defs/style
          const selection = svgEl.querySelector(
            contentSelector
          ) as SVGGraphicsElement | null;
          if (selection) {
            // Copy defs/style to keep fills/filters
            const frag = document.createDocumentFragment();
            const defsAndStyles = svgEl.querySelectorAll("defs, style");
            defsAndStyles.forEach((n) => frag.appendChild(n.cloneNode(true)));
            svgClone.appendChild(frag);

            // Clone the selection and crop to its bbox by translating to (0,0)
            const cloned = selection.cloneNode(true) as SVGGraphicsElement;
            let bx = 0,
              by = 0,
              bw = width,
              bh = height;
            try {
              const bb = (selection as any).getBBox?.();
              if (bb && bb.width > 0 && bb.height > 0) {
                bx = bb.x;
                by = bb.y;
                bw = bb.width;
                bh = bb.height;
              }
            } catch {}

            // Wrap in a group that translates the selection so its top-left is at 0,0
            const g = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            g.setAttribute("transform", `translate(${-bx} ${-by})`);
            g.appendChild(cloned);
            svgClone.appendChild(g);

            // Set viewBox to the cropped bounds for tighter framing
            svgClone.setAttribute("viewBox", `${bx} ${by} ${bw} ${bh}`);
          } else {
            // Fallback to inner html
            svgClone.innerHTML = svgEl.innerHTML;
          }
        } else {
          // Export inner markup only
          svgClone.innerHTML = svgEl.innerHTML;
        }
      }

      // Set explicit output size
      svgClone.setAttribute("width", String(width));
      svgClone.setAttribute("height", String(height));

      // Optionally remove unwanted elements (e.g., full-canvas backgrounds)
      const excludeSelectors =
        (options?.excludeSelectors as string[] | undefined) || [];
      for (const sel of excludeSelectors) {
        try {
          svgClone
            .querySelectorAll(sel)
            .forEach((n) => n.parentNode?.removeChild(n));
        } catch {}
      }

      // Apply animation keyframes (numeric attribute interpolation and simple transforms)
      if (keyframes && Array.isArray(keyframes) && keyframes.length) {
        for (const k of keyframes) {
          const nodes = svgClone.querySelectorAll(k.selector);
          const val = lerp(Number(k.from), Number(k.to), t);
          nodes.forEach((node) => {
            try {
              const el = node as SVGGraphicsElement;
              if (k.kind === "rotate") {
                const bb = el.getBBox?.();
                const cx = bb ? bb.x + bb.width / 2 : width / 2;
                const cy = bb ? bb.y + bb.height / 2 : height / 2;
                el.setAttribute("transform", `rotate(${val} ${cx} ${cy})`);
              } else if (k.kind === "scale") {
                const bb = el.getBBox?.();
                const cx = bb ? bb.x + bb.width / 2 : width / 2;
                const cy = bb ? bb.y + bb.height / 2 : height / 2;
                el.setAttribute(
                  "transform",
                  `translate(${cx} ${cy}) scale(${val}) translate(${-cx} ${-cy})`
                );
              } else {
                el.setAttribute(k.attr, String(val));
              }
            } catch {}
          });
        }
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      const dataUri =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Optional background fill (transparent by default)
            if (options?.backgroundColor) {
              ctx2d.fillStyle = options.backgroundColor;
              ctx2d.fillRect(0, 0, width, height);
            } else {
              // Clear previous frame
              ctx2d.clearRect(0, 0, width, height);
            }

            ctx2d.drawImage(img, 0, 0, width, height);
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = (error) => reject(error);
        (img as any).src = dataUri;
      });

      gif.addFrame(canvas, { delay: frameDelay, copy: true });
    }

    // Draw frames sequentially
    for (let i = 0; i < totalFrames; i++) {
      await drawFrame(i);
    }

    // Handle completion and trigger download
    gif.on("finished", (blob: Blob) => {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${targetId}-${Date.now()}.gif`;
        a.click();
        URL.revokeObjectURL(url);

        ctx.payload.downloadTriggered = true;
        ctx.payload.gifSize = blob.size;
        ctx.logger?.info?.(`GIF export completed: ${blob.size} bytes`);
      } catch (error) {
        ctx.logger?.error?.("Failed to trigger download:", error);
        ctx.payload.error = `Download failed: ${error}`;
      }
    });

    gif.on("progress", (progress: number) => {
      ctx.logger?.info?.(
        `GIF encoding progress: ${Math.round(progress * 100)}%`
      );
    });

    // Start encoding
    gif.render();
  } catch (error) {
    ctx.logger?.error?.("Failed to export SVG to GIF:", error);
    ctx.payload.error = String(error);
    ctx.payload.downloadTriggered = false;
  }
}
