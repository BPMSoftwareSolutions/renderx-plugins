// Canvas Prompt Book (Store): centralized, annotated state for the canvas
// - Single source of truth for nodes and selection
// - Concertmasters (controllers) are the only writers; Arrangements are pure; StageCrew never writes

export type Vec2 = { x: number; y: number };
export type CanvasNode = {
  id?: string;
  elementId?: string;
  cssClass?: string;
  position?: Vec2;
  type?: string;
  component?: any;
  componentData?: any;
};

export type CanvasPromptBookState = {
  nodes: CanvasNode[];
  selectedId: string | null;
};

export type CanvasPromptBook = {
  getState(): CanvasPromptBookState;
  subscribe(listener: () => void): () => void;
  actions: {
    setNodes(nodes: CanvasNode[]): void;
    select(id: string | null): void;
    move(elementId: string, next: Vec2): void;
  };
  selectors: {
    nodes(): CanvasNode[];
    selectedId(): string | null;
    nodeById(id: string): CanvasNode | null;
    positionOf(id: string): Vec2;
  };
};

function normalizeId(n?: CanvasNode | null): string | null {
  if (!n) return null;
  return (n.id || n.elementId || null) as string | null;
}

export function createCanvasPromptBook(
  initial?: Partial<CanvasPromptBookState>
): CanvasPromptBook {
  let state: CanvasPromptBookState = {
    nodes: Array.isArray(initial?.nodes) ? initial!.nodes!.slice() : [],
    selectedId: initial?.selectedId ?? null,
  };
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const l of Array.from(listeners)) {
      try {
        l();
      } catch {}
    }
  };

  const api: CanvasPromptBook = {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions: {
      setNodes(nodes: CanvasNode[]) {
        state = { ...state, nodes: Array.isArray(nodes) ? nodes.slice() : [] };
        notify();
      },
      select(id: string | null) {
        state = { ...state, selectedId: id ?? null };
        notify();
      },
      move(elementId: string, next: Vec2) {
        const nodes = (state.nodes || []).map((n) => {
          const nid = normalizeId(n);
          if (nid === elementId) {
            return { ...n, position: { x: next?.x ?? 0, y: next?.y ?? 0 } };
          }
          return n;
        });
        state = { ...state, nodes };
        notify();
      },
    },
    selectors: {
      nodes() {
        return state.nodes || [];
      },
      selectedId() {
        return state.selectedId ?? null;
      },
      nodeById(id: string) {
        const arr = state.nodes || [];
        for (const n of arr) {
          const nid = normalizeId(n);
          if (nid === id) return n;
        }
        return null;
      },
      positionOf(id: string) {
        const n = api.selectors.nodeById(id);
        const p = n?.position;
        return { x: p?.x ?? 0, y: p?.y ?? 0 };
      },
    },
  };

  return api;
}

// Default singleton Prompt Book for app runtime; tests can construct isolated instances
export const canvasPromptBook = createCanvasPromptBook();

// Safe window bridge for JS modules until migration completes
try {
  // @ts-ignore
  if (typeof window !== "undefined") {
    // @ts-ignore
    (window as any).__rx_prompt_book__ = canvasPromptBook;
  }
} catch {}
