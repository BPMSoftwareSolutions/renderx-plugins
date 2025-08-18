// Overlay StageCrew (Adapter): applies arrangement CSS via Stage Crew (ADR-0017 Option B)
import { getStageCrew } from "@communication/StageCrew";

export function makeOverlayStageCrew(
  _cssAdapter: { upsertStyle: Function; removeStyle: Function },
  overlayArrangement: any
) {
  return {
    transform(elementId: string, dx: number, dy: number) {
      const css = overlayArrangement.transformRule(elementId, dx, dy);
      const sc = getStageCrew();
      const id = `overlay-transform-${elementId}`;
      const corr = `mc-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      sc.beginBeat(corr, { handlerName: "overlay.transform", elementId })
        .upsertStyle(id, css)
        .commit({ batch: true });
    },
    hide(elementId: string) {
      const css = overlayArrangement.hideRule(elementId);
      const sc = getStageCrew();
      const id = `overlay-visibility-${elementId}`;
      const corr = `mc-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      sc.beginBeat(corr, { handlerName: "overlay.hide", elementId })
        .upsertStyle(id, css)
        .commit();
    },
    show(elementId: string) {
      const sc = getStageCrew();
      const id = `overlay-visibility-${elementId}`;
      const corr = `mc-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      sc.beginBeat(corr, { handlerName: "overlay.show", elementId })
        .remove(`#${id}`)
        .commit();
    },
    commitInstance(
      elementId: string,
      position: { x: number; y: number },
      size: { w?: number | string; h?: number | string }
    ) {
      const css = overlayArrangement.instanceRule(elementId, position, size);
      const sc = getStageCrew();
      const id = `overlay-instance-${elementId}`;
      const corr = `mc-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      sc.beginBeat(corr, { handlerName: "overlay.commitInstance", elementId })
        .upsertStyle(id, css)
        .commit();
    },
  };
}
