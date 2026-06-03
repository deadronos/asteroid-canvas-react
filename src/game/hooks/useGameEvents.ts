import { useEffect } from 'react';

import type { GameSession } from '../core/sessionTypes';
import { useHudStore } from '../ui/useHudStore';

/**
 * Subscribes to core simulation events and forwards them to the Zustand HUD store.
 * This is the single bridge between the framework-agnostic core and the React UI layer.
 */
export function useGameEvents(session: GameSession | null) {
  useEffect(() => {
    if (!session) {
      return;
    }

    const { eventBus } = session;
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      eventBus.on('telemetryUpdate', (telemetry) => {
        useHudStore.getState().updateTelemetry(telemetry);
      }),
    );

    unsubscribers.push(
      eventBus.on('asteroidDestroyed', () => {
        useHudStore.getState().incrementAsteroidsDestroyed();
      }),
    );

    unsubscribers.push(
      eventBus.on('gameStateChange', ({ state }) => {
        useHudStore.getState().setGameState(state);
      }),
    );

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }, [session]);
}
