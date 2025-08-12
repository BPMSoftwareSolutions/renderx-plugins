export type EventCallback<T = any> = (data?: T) => void | Promise<void>;
export type UnsubscribeFunction = () => void;

export interface EventSubscription {
  id: string;
  eventName: string;
  callback: EventCallback;
  subscribedAt: Date;
  pluginId?: string;
  context?: any;
}

export interface EventDebugInfo {
  totalEvents: number;
  totalSubscriptions: number;
  eventCounts: Record<string, number>;
  subscriptionCounts: Record<string, number>;
}

export class EventBus {
  private events: Map<string, EventSubscription[]> = new Map();
  private counts: Record<string, number> = {};
  private subId = 0;

  subscribe<T = any>(eventName: string, callback: EventCallback<T>, context?: any): UnsubscribeFunction {
    const sub: EventSubscription = {
      id: `sub-${++this.subId}`,
      eventName,
      callback: callback as EventCallback,
      subscribedAt: new Date(),
      pluginId: context?.pluginId,
      context,
    };
    const arr = this.events.get(eventName) || [];
    arr.push(sub);
    this.events.set(eventName, arr);
    return () => {
      const current = this.events.get(eventName) || [];
      const next = current.filter((s) => s !== sub);
      if (next.length) this.events.set(eventName, next);
      else this.events.delete(eventName);
    };
  }

  async emit<T = any>(eventName: string, data?: T): Promise<void> {
    this.counts[eventName] = (this.counts[eventName] || 0) + 1;
    const subs = this.events.get(eventName) || [];
    for (const s of subs) {
      await Promise.resolve(s.callback(data));
    }
  }

  getDebugInfo(): EventDebugInfo {
    const subscriptionCounts: Record<string, number> = {};
    for (const [name, subs] of this.events.entries()) subscriptionCounts[name] = subs.length;
    const totalSubscriptions = Object.values(subscriptionCounts).reduce((a, b) => a + b, 0);
    const totalEvents = Object.values(this.counts).reduce((a, b) => a + b, 0);
    return { totalEvents, totalSubscriptions, eventCounts: { ...this.counts }, subscriptionCounts };
  }
}

export class ConductorEventBus extends EventBus {}

