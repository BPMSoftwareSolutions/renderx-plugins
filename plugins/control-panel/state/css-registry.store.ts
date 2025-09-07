// CSS Registry Store - Global management of CSS classes and their definitions
// Integrates with the new Control Panel architecture

import { getCssRegistryObserver } from "./observer.store";

export interface CssClassDefinition {
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isBuiltIn?: boolean;
}

export interface CssRegistryState {
  classes: Map<string, CssClassDefinition>;
  isLoaded: boolean;
  lastModified: number;
}

class CssRegistryStore {
  private state: CssRegistryState = {
    classes: new Map(),
    isLoaded: false,
    lastModified: Date.now(),
  };

  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    this.initializeStyleElement();
    this.loadDefaultClasses();
  }

  private initializeStyleElement() {
    // DOM operations moved to stage-crew handlers
    // This will be initialized via stage-crew when needed
    this.styleElement = null;
  }

  private loadDefaultClasses() {
    // Load default CSS classes that come with the system
    const defaultClasses: Omit<
      CssClassDefinition,
      "createdAt" | "updatedAt"
    >[] = [
      {
        name: "rx-button",
        content: `.rx-button {
  background-color: var(--bg-color, #3b82f6);
  color: var(--text-color, #ffffff);
  border: var(--border, none);
  padding: var(--padding, 12px 24px);
  border-radius: var(--border-radius, 8px);
  cursor: pointer;
  font-size: var(--font-size, 14px);
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  user-select: none;
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}`,
        isBuiltIn: true,
      },
      {
        name: "rx-container",
        content: `.rx-container {
  position: relative;
  background: var(--bg, #fafafa);
  border: 1px dashed #9ca3af;
  border-radius: 8px;
  min-height: 120px;
  min-width: 200px;
  padding: var(--padding, 16px);
  box-sizing: border-box;
}`,
        isBuiltIn: true,
      },
      {
        name: "rx-comp-div",
        content: `.rx-comp-div {
  position: relative;
  display: block;
  box-sizing: border-box;
  min-height: 20px;
  min-width: 20px;
}`,
        isBuiltIn: true,
      },
    ];

    const now = Date.now();
    defaultClasses.forEach((cls) => {
      this.state.classes.set(cls.name, {
        ...cls,
        createdAt: now,
        updatedAt: now,
      });
    });

    this.updateStylesheet();
    this.state.isLoaded = true;
    this.notifyObservers();
  }

  private updateStylesheet() {
    if (!this.styleElement) return;

    const cssContent = Array.from(this.state.classes.values())
      .map((cls) => cls.content)
      .join("\n\n");

    // DOM operations moved to stage-crew handlers
    // This will be handled via stage-crew when needed
    // Store the content for stage-crew to apply
    (this.styleElement as any)._pendingContent = cssContent;
  }

  private notifyObservers() {
    const observer = getCssRegistryObserver();
    if (observer) {
      try {
        observer({
          classes: Array.from(this.state.classes.values()),
          lastModified: this.state.lastModified,
        });
      } catch {
        // Silently handle observer errors
      }
    }
  }

  // Public API methods
  getAllClasses(): CssClassDefinition[] {
    return Array.from(this.state.classes.values());
  }

  getClass(name: string): CssClassDefinition | undefined {
    return this.state.classes.get(name);
  }

  hasClass(name: string): boolean {
    return this.state.classes.has(name);
  }

  createClass(name: string, content: string): boolean {
    if (this.state.classes.has(name)) {
      return false; // Class already exists
    }

    const now = Date.now();
    const newClass: CssClassDefinition = {
      name,
      content,
      createdAt: now,
      updatedAt: now,
      isBuiltIn: false,
    };

    this.state.classes.set(name, newClass);
    this.state.lastModified = now;
    this.updateStylesheet();
    this.notifyObservers();
    return true;
  }

  updateClass(name: string, content: string): boolean {
    const existingClass = this.state.classes.get(name);
    if (!existingClass) {
      return false; // Class doesn't exist
    }

    const now = Date.now();
    const updatedClass: CssClassDefinition = {
      ...existingClass,
      content,
      updatedAt: now,
    };

    this.state.classes.set(name, updatedClass);
    this.state.lastModified = now;
    this.updateStylesheet();
    this.notifyObservers();
    return true;
  }

  removeClass(name: string): boolean {
    const existingClass = this.state.classes.get(name);
    if (!existingClass) {
      return false; // Class doesn't exist
    }

    // Prevent removal of built-in classes
    if (existingClass.isBuiltIn) {
      // Silently prevent removal of built-in classes
      return false;
    }

    this.state.classes.delete(name);
    this.state.lastModified = Date.now();
    this.updateStylesheet();
    this.notifyObservers();
    return true;
  }

  getClassNames(): string[] {
    return Array.from(this.state.classes.keys());
  }

  isLoaded(): boolean {
    return this.state.isLoaded;
  }

  getLastModified(): number {
    return this.state.lastModified;
  }
}

// Singleton instance
export const cssRegistry = new CssRegistryStore();

// Expose for browser debugging (development only)
// Note: Direct window access moved to avoid ESLint plugin restrictions
// Use browser dev tools to access: globalThis.cssRegistry
if (typeof globalThis !== "undefined") {
  (globalThis as any).cssRegistry = cssRegistry;
}

// Export for testing
export { CssRegistryStore };
