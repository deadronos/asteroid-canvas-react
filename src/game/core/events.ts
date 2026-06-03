import type { TelemetrySnapshot } from './types';

/**
 * Events emitted by the game simulation core.
 * The UI layer subscribes and forwards these to its own state stores.
 * This keeps the core free of any React / Zustand dependency.
 */
export interface GameEvents {
  gameStateChange: { state: 'menu' | 'playing' | 'gameover' };
  telemetryUpdate: TelemetrySnapshot;
  asteroidDestroyed: { count: number };
  shipDamaged: { hull: number };
}

export type GameEventKey = keyof GameEvents;

export interface GameEventBus {
  emit<K extends GameEventKey>(event: K, payload: GameEvents[K]): void;
  on<K extends GameEventKey>(event: K, handler: (payload: GameEvents[K]) => void): () => void;
}

export function createGameEventBus(): GameEventBus {
  const listeners = new Map<GameEventKey, Set<(payload: unknown) => void>>();

  return {
    emit(event, payload) {
      const handlers = listeners.get(event);

      if (handlers) {
        for (const handler of handlers) {
          handler(payload);
        }
      }
    },
    on(event, handler) {
      let handlers = listeners.get(event);

      if (!handlers) {
        handlers = new Set();
        listeners.set(event, handlers);
      }

      handlers.add(handler as (payload: unknown) => void);

      return () => {
        handlers.delete(handler as (payload: unknown) => void);
      };
    },
  };
}
