/**
 * Test Helpers
 * Reusable utility functions for MusicalConductor testing
 */

import { EventBus, ConductorEventBus } from "@communication/EventBus";
import { MusicalConductor } from "@communication/sequences/MusicalConductor";
import { SPAValidator } from "@communication/SPAValidator";
import type {
  MusicalSequence,
  SequenceBeat,
} from "@communication/sequences/SequenceTypes";

/**
 * Test Environment Setup Helpers
 */
export class TestEnvironment {
  private static instances: Map<string, any> = new Map();

  /**
   * Create a clean EventBus instance for testing
   */
  static createEventBus(): EventBus {
    const eventBus = new EventBus();
    this.instances.set("eventBus", eventBus);
    return eventBus;
  }

  /**
   * Create a clean MusicalConductor instance for testing
   */
  static createMusicalConductor(eventBus?: EventBus): MusicalConductor {
    // Reset singleton for testing
    MusicalConductor.resetInstance();
    const conductor = MusicalConductor.getInstance(
      eventBus || this.createEventBus()
    );
    this.instances.set("conductor", conductor);
    return conductor;
  }

  /**
   * Create a clean SPAValidator instance for testing
   */
  static createSPAValidator(config: any = {}): SPAValidator {
    const validator = new SPAValidator({
      strictMode: false,
      logViolations: false,
      throwOnViolation: false,
      enableRuntimeChecks: true,
      ...config,
    });
    this.instances.set("validator", validator);
    return validator;
  }

  /**
   * Clean up all test instances
   */
  static cleanup(): void {
    // Reset MusicalConductor singleton
    MusicalConductor.resetInstance();

    // Disable SPA validator runtime checks
    const validator = this.instances.get("validator");
    if (validator) {
      validator.disableRuntimeChecks();
    }

    // Clear all instances
    this.instances.clear();

    // Clear all timers
    jest.clearAllTimers();
    jest.useRealTimers();
  }
}

/**
 * Event Testing Helpers
 */
export class EventTestHelpers {
  /**
   * Create a mock event callback that tracks calls
   */
  static createMockCallback(): jest.MockedFunction<(data: any) => void> {
    return jest.fn();
  }

  /**
   * Wait for an event to be emitted
   */
  static waitForEvent(
    eventBus: EventBus,
    eventName: string,
    timeout: number = 5000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(
          new Error(`Event '${eventName}' was not emitted within ${timeout}ms`)
        );
      }, timeout);

      const unsubscribe = eventBus.subscribe(eventName, (data) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(data);
      });
    });
  }

  /**
   * Collect all events emitted during a test operation
   */
  static collectEvents(
    eventBus: EventBus,
    eventNames: string[]
  ): {
    events: Array<{ name: string; data: any; timestamp: number }>;
    stop: () => void;
  } {
    const events: Array<{ name: string; data: any; timestamp: number }> = [];
    const unsubscribers: Array<() => void> = [];

    eventNames.forEach((eventName) => {
      const unsubscribe = eventBus.subscribe(eventName, (data) => {
        events.push({
          name: eventName,
          data,
          timestamp: Date.now(),
        });
      });
      unsubscribers.push(unsubscribe);
    });

    return {
      events,
      stop: () => unsubscribers.forEach((unsub) => unsub()),
    };
  }

  /**
   * Assert event order
   */
  static assertEventOrder(
    events: Array<{ name: string; timestamp: number }>,
    expectedOrder: string[]
  ): void {
    const actualOrder = events
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e) => e.name);

    expect(actualOrder).toEqual(expectedOrder);
  }
}

/**
 * Musical Timing Helpers
 */
export class MusicalTimingHelpers {
  /**
   * Convert BPM to milliseconds per beat
   */
  static bpmToMs(bpm: number): number {
    return (60 / bpm) * 1000;
  }

  /**
   * Create a timing test helper
   */
  static createTimingTest(expectedBpm: number = 120) {
    const beatDuration = this.bpmToMs(expectedBpm);
    const timestamps: number[] = [];

    return {
      recordBeat: () => timestamps.push(Date.now()),
      assertTiming: (tolerance: number = 50) => {
        for (let i = 1; i < timestamps.length; i++) {
          const actualDuration = timestamps[i] - timestamps[i - 1];
          expect(actualDuration).toBeWithinMusicalTiming(
            beatDuration,
            tolerance
          );
        }
      },
      getBeatDurations: () => {
        const durations: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
          durations.push(timestamps[i] - timestamps[i - 1]);
        }
        return durations;
      },
    };
  }

  /**
   * Mock timers for musical timing tests
   */
  static mockMusicalTimers(): {
    advanceByBeats: (beats: number, bpm?: number) => void;
    restore: () => void;
  } {
    jest.useFakeTimers();

    return {
      advanceByBeats: (beats: number, bpm: number = 120) => {
        const duration = beats * this.bpmToMs(bpm);
        jest.advanceTimersByTime(duration);
      },
      restore: () => {
        jest.useRealTimers();
      },
    };
  }
}

/**
 * Async Testing Helpers
 */
export class AsyncTestHelpers {
  /**
   * Wait for a condition to be true
   */
  static async waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Condition not met within ${timeout}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  /**
   * Wait for async operations to complete
   */
  static async flushPromises(): Promise<void> {
    await new Promise((resolve) => {
      if (typeof setImmediate !== "undefined") {
        setImmediate(resolve);
      } else {
        // Fallback for environments without setImmediate
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Create a deferred promise for testing
   */
  static createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
  } {
    let resolve: (value: T) => void;
    let reject: (error: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }
}

/**
 * Performance Testing Helpers
 */
export class PerformanceTestHelpers {
  /**
   * Measure execution time
   */
  static async measureTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * Memory usage helper (Node.js only)
   */
  static getMemoryUsage(): NodeJS.MemoryUsage | null {
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }

  /**
   * Assert performance within bounds
   */
  static assertPerformance(
    duration: number,
    maxMs: number,
    operation: string
  ): void {
    if (duration > maxMs) {
      throw new Error(`${operation} took ${duration}ms, expected < ${maxMs}ms`);
    }
  }
}
