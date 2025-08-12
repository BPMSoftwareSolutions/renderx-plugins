/**
 * Mock EventBus Implementation
 * Provides a controllable mock for EventBus testing
 */

import type { EventCallback, UnsubscribeFunction, EventSubscription, EventDebugInfo } from '@communication/EventBus';

export class MockEventBus {
  private events: Record<string, EventSubscription[]> = {};
  private subscriptionCounter: number = 0;
  private eventCounts: Record<string, number> = {};
  private emittedEvents: Array<{ eventName: string; data: any; timestamp: number }> = [];
  
  // Mock control properties
  public shouldThrowOnSubscribe: boolean = false;
  public shouldThrowOnEmit: boolean = false;
  public subscribeDelay: number = 0;
  public emitDelay: number = 0;

  /**
   * Subscribe to an event (mocked)
   */
  subscribe<T = any>(
    eventName: string,
    callback: EventCallback<T>,
    context?: any
  ): UnsubscribeFunction {
    if (this.shouldThrowOnSubscribe) {
      throw new Error(`Mock error: Failed to subscribe to ${eventName}`);
    }

    const subscription: EventSubscription = {
      id: `mock-sub-${++this.subscriptionCounter}`,
      eventName,
      callback,
      subscribedAt: new Date(),
      pluginId: context?.pluginId,
      context
    };

    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(subscription);

    // Return unsubscribe function
    return () => {
      const index = this.events[eventName]?.indexOf(subscription);
      if (index !== undefined && index > -1) {
        this.events[eventName].splice(index, 1);
        if (this.events[eventName].length === 0) {
          delete this.events[eventName];
        }
      }
    };
  }

  /**
   * Emit an event (mocked)
   */
  async emit<T = any>(eventName: string, data?: T): Promise<void> {
    if (this.shouldThrowOnEmit) {
      throw new Error(`Mock error: Failed to emit ${eventName}`);
    }

    // Record the emission
    this.emittedEvents.push({
      eventName,
      data,
      timestamp: Date.now()
    });

    // Update event counts
    this.eventCounts[eventName] = (this.eventCounts[eventName] || 0) + 1;

    // Add delay if configured
    if (this.emitDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.emitDelay));
    }

    // Call all subscribers
    const subscribers = this.events[eventName] || [];
    const promises = subscribers.map(async (subscription) => {
      try {
        await subscription.callback(data);
      } catch (error) {
        // Mock error handling - log but don't throw
        console.warn(`Mock EventBus: Callback error for ${eventName}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get debug information (mocked)
   */
  getDebugInfo(): EventDebugInfo {
    const subscriptionCounts: Record<string, number> = {};
    Object.keys(this.events).forEach(eventName => {
      subscriptionCounts[eventName] = this.events[eventName].length;
    });

    return {
      totalEvents: Object.values(this.eventCounts).reduce((sum, count) => sum + count, 0),
      totalSubscriptions: Object.values(subscriptionCounts).reduce((sum, count) => sum + count, 0),
      eventCounts: { ...this.eventCounts },
      subscriptionCounts
    };
  }

  /**
   * Mock-specific methods for testing
   */

  /**
   * Get all emitted events for verification
   */
  getEmittedEvents(): Array<{ eventName: string; data: any; timestamp: number }> {
    return [...this.emittedEvents];
  }

  /**
   * Get events by name
   */
  getEmittedEventsByName(eventName: string): Array<{ data: any; timestamp: number }> {
    return this.emittedEvents
      .filter(event => event.eventName === eventName)
      .map(event => ({ data: event.data, timestamp: event.timestamp }));
  }

  /**
   * Check if event was emitted
   */
  wasEventEmitted(eventName: string): boolean {
    return this.emittedEvents.some(event => event.eventName === eventName);
  }

  /**
   * Get subscription count for event
   */
  getSubscriptionCount(eventName: string): number {
    return this.events[eventName]?.length || 0;
  }

  /**
   * Clear all recorded events
   */
  clearEmittedEvents(): void {
    this.emittedEvents = [];
    this.eventCounts = {};
  }

  /**
   * Clear all subscriptions
   */
  clearAllSubscriptions(): void {
    this.events = {};
    this.subscriptionCounter = 0;
  }

  /**
   * Reset mock to initial state
   */
  reset(): void {
    this.clearEmittedEvents();
    this.clearAllSubscriptions();
    this.shouldThrowOnSubscribe = false;
    this.shouldThrowOnEmit = false;
    this.subscribeDelay = 0;
    this.emitDelay = 0;
  }

  /**
   * Configure mock behavior
   */
  configure(options: {
    shouldThrowOnSubscribe?: boolean;
    shouldThrowOnEmit?: boolean;
    subscribeDelay?: number;
    emitDelay?: number;
  }): void {
    if (options.shouldThrowOnSubscribe !== undefined) {
      this.shouldThrowOnSubscribe = options.shouldThrowOnSubscribe;
    }
    if (options.shouldThrowOnEmit !== undefined) {
      this.shouldThrowOnEmit = options.shouldThrowOnEmit;
    }
    if (options.subscribeDelay !== undefined) {
      this.subscribeDelay = options.subscribeDelay;
    }
    if (options.emitDelay !== undefined) {
      this.emitDelay = options.emitDelay;
    }
  }

  /**
   * Simulate network delay for async operations
   */
  async simulateNetworkDelay(ms: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a spy for a specific event
   */
  createEventSpy(eventName: string): jest.SpyInstance {
    const originalEmit = this.emit.bind(this);
    const spy = jest.fn(originalEmit);
    this.emit = spy;
    return spy;
  }
}

/**
 * Factory for creating configured mock EventBus instances
 */
export class MockEventBusFactory {
  /**
   * Create a basic mock EventBus
   */
  static create(): MockEventBus {
    return new MockEventBus();
  }

  /**
   * Create a mock EventBus that throws errors
   */
  static createErrorProne(): MockEventBus {
    const mock = new MockEventBus();
    mock.configure({
      shouldThrowOnSubscribe: true,
      shouldThrowOnEmit: true
    });
    return mock;
  }

  /**
   * Create a mock EventBus with network delays
   */
  static createWithDelay(delay: number = 100): MockEventBus {
    const mock = new MockEventBus();
    mock.configure({
      subscribeDelay: delay,
      emitDelay: delay
    });
    return mock;
  }

  /**
   * Create a mock EventBus for performance testing
   */
  static createForPerformance(): MockEventBus {
    const mock = new MockEventBus();
    // No delays, no errors - pure performance testing
    return mock;
  }
}
