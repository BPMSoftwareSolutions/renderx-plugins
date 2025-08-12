/**
 * Jest Setup File
 * Global test configuration and custom matchers for MusicalConductor testing
 */

import "jest-extended";

// Global test timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests (can be overridden per test)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Store original methods for restoration
(global as any).originalConsole = {
  log: originalConsoleLog,
  warn: originalConsoleWarn,
  error: originalConsoleError,
};

// Mock console by default (tests can restore if needed)
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Custom Jest matchers for MusicalConductor testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinMusicalTiming(expectedMs: number, toleranceMs?: number): R;
      toHaveEventSubscription(eventName: string): R;
      toHaveSequenceRegistered(sequenceName: string): R;
      toHaveSPAViolation(violationType: string): R;
      toEmitEventInOrder(events: string[]): R;
    }
  }
}

// Musical timing matcher - checks if timing is within musical tolerance
expect.extend({
  toBeWithinMusicalTiming(
    received: number,
    expected: number,
    tolerance: number = 50
  ) {
    const pass = Math.abs(received - expected) <= tolerance;

    if (pass) {
      return {
        message: () =>
          `Expected ${received}ms not to be within ${tolerance}ms of ${expected}ms`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${received}ms to be within ${tolerance}ms of ${expected}ms (difference: ${Math.abs(
            received - expected
          )}ms)`,
        pass: false,
      };
    }
  },

  // EventBus subscription matcher
  toHaveEventSubscription(eventBus: any, eventName: string) {
    const debugInfo = eventBus.getDebugInfo();
    const hasSubscription = debugInfo.subscriptionCounts[eventName] > 0;

    if (hasSubscription) {
      return {
        message: () =>
          `Expected EventBus not to have subscription for '${eventName}'`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected EventBus to have subscription for '${eventName}', but found subscriptions for: ${Object.keys(
            debugInfo.subscriptionCounts
          ).join(", ")}`,
        pass: false,
      };
    }
  },

  // MusicalConductor sequence registration matcher
  toHaveSequenceRegistered(conductor: any, sequenceName: string) {
    const sequences = conductor.getSequenceNames();
    const hasSequence = sequences.includes(sequenceName);

    if (hasSequence) {
      return {
        message: () =>
          `Expected MusicalConductor not to have sequence '${sequenceName}' registered`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected MusicalConductor to have sequence '${sequenceName}' registered, but found: ${sequences.join(
            ", "
          )}`,
        pass: false,
      };
    }
  },

  // SPAValidator violation matcher
  toHaveSPAViolation(validator: any, violationType: string) {
    const report = validator.generateViolationReport();
    const hasViolationType = report.violationsBySeverity[violationType] > 0;

    if (hasViolationType) {
      return {
        message: () =>
          `Expected SPAValidator not to have '${violationType}' violations`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected SPAValidator to have '${violationType}' violations, but found: ${JSON.stringify(
            report.violationsBySeverity
          )}`,
        pass: false,
      };
    }
  },
});

// Global test utilities
(global as any).testUtils = {
  // Restore console for debugging
  restoreConsole: () => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  },

  // Mock console again
  mockConsole: () => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  },

  // Wait for musical timing
  waitForBeats: (beats: number, tempo: number = 120) => {
    const beatDuration = (60 / tempo) * 1000; // Convert BPM to ms
    return new Promise((resolve) => setTimeout(resolve, beats * beatDuration));
  },

  // Create mock event data
  createMockEvent: (type: string, data: any = {}) => ({
    type,
    data,
    timestamp: Date.now(),
    id: `mock-${Math.random().toString(36).substr(2, 9)}`,
  }),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Reset console mocks
  (global as any).testUtils.mockConsole();
});

// Global error handler for unhandled promise rejections in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process in tests, just log the error
});
