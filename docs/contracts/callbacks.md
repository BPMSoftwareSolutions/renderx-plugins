# Callback contracts for SPA plugins

This document defines the standard callback interfaces plugins use with the Musical Conductor.
Plugins initiate flows with `conductor.play()` and receive UI updates via:
- play-scoped callbacks (short-lived flows like create)
- registered callbacks (longer-lived subscriptions like selection, drag, resize)

The Musical Conductor preserves callbacks across nested `play()` calls via correlationId + callback registry (see orchestrator issue).

## 1. Creation
- Name: `onComponentCreated(node)`
- When: Library drop → Canvas create
- Shape:
```ts
interface CreatedNode {
  id: string;
  cssClass: string; // usually equals id
  type: string;     // component metadata.type (lowercased)
  position: { x: number; y: number };
  component: any;   // original component object
}
```
- Usage:
```ts
await conductor.play('Library.component-drop-symphony', {
  component,
  coordinates: { x, y },
  onComponentCreated: (node: CreatedNode) => setNodes(prev => [...prev, node]),
});
```

## 2. Selection
- Name: `onSelectionChanged(id: string | null)`
- When: selection changes in canvas-ui
- Usage (register long-lived):
```ts
conductor.registerCallbacks('Canvas.ui', {
  onSelectionChanged: (id: string | null) => setSelectedId(id),
});
```
- Emission from sequence/handler:
```ts
context.conductor.notify?.('onSelectionChanged', { id: nextId });
```

## 3. Drag
- Names: `onDragUpdate`, `onDragEnd`
- Payloads:
```ts
interface DragUpdate { elementId: string; position: { x: number; y: number }; }
interface DragEnd { elementId: string; }
```
- Usage (register):
```ts
conductor.registerCallbacks('Canvas.ui', {
  onDragUpdate: ({ elementId, position }) => applyOverlayTransform(elementId, position),
  onDragEnd: ({ elementId }) => clearOverlayTransform(elementId),
});
```

## 4. Resize
- Names: `onResizeStart`, `onResizeUpdate`, `onResizeEnd`
- Payloads:
```ts
interface ResizeStart { elementId: string; handle: string; start: { x: number; y: number }; }
interface ResizeUpdate { elementId: string; size: { width: number; height: number }; delta: { dx: number; dy: number }; }
interface ResizeEnd { elementId: string; }
```
- Usage (register):
```ts
conductor.registerCallbacks('Canvas.ui', {
  onResizeStart: (p: ResizeStart) => {/* show overlay or state changes */},
  onResizeUpdate: (p: ResizeUpdate) => {/* update overlay size */},
  onResizeEnd: (p: ResizeEnd) => {/* finalize */},
});
```

## Notes
- Plugins should not use global DOM events for orchestration.
- React event props (onClick, onPointerDown) remain fine for component interaction; they should call `conductor.play()` to start flows.
- The conductor’s callback preservation across nested plays ensures callbacks arrive even in transports that serialize payloads.

