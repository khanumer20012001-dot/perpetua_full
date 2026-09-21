import { EventEmitter } from 'events';

type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * Typed in-process event bus (Observer / Pub-Sub pattern).
 * Wraps async listeners in safe try/catch error boundaries to prevent process crashes.
 */
class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Increase max listeners to prevent warnings under load
    this.emitter.setMaxListeners(50);
  }

  emit<T>(event: string, payload: T): void {
    this.emitter.emit(event, payload);
  }

  async emitAsync<T>(event: string, payload: T): Promise<void> {
    const listeners = this.emitter.listeners(event);
    for (const listener of listeners) {
      try {
        await (listener as EventHandler<T>)(payload);
      } catch (err) {
        console.error(`[EventBus Error] Unhandled exception in listener for event '${event}':`, err);
      }
    }
  }

  on<T>(event: string, handler: EventHandler<T>): void {
    const safeHandler = async (payload: T) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus Error] Event handler for '${event}' threw an unhandled error:`, err);
      }
    };
    this.emitter.on(event, safeHandler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.emitter.off(event, handler as (...args: any[]) => void);
  }
}

export const eventBus = new EventBus();

export * from './events';
