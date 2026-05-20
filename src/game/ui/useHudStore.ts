import { create } from 'zustand';

import type { TelemetrySnapshot } from '../core/types';

const defaultTelemetry: TelemetrySnapshot = {
  shipName: 'Venture Cruiser',
  hull: 180,
  maxHull: 180,
  armor: 120,
  maxArmor: 120,
  shield: 95,
  maxShield: 95,
  speed: 0,
  asteroidCount: 0,
  turretCount: 2,
};

const getStoredHighScore = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  const score = localStorage.getItem('asteroid_highscore');
  return score ? parseInt(score, 10) : 0;
};

interface HudStore {
  gameState: 'menu' | 'playing' | 'gameover';
  autoTurretsEnabled: boolean;
  telemetry: TelemetrySnapshot;
  asteroidsDestroyed: number;
  highScore: number;
  setAutoTurrets: (enabled: boolean) => void;
  toggleAutoTurrets: () => void;
  updateTelemetry: (telemetry: TelemetrySnapshot) => void;
  setGameState: (state: 'menu' | 'playing' | 'gameover') => void;
  incrementAsteroidsDestroyed: () => void;
  resetScore: () => void;
}

export const useHudStore = create<HudStore>((set) => ({
  gameState: 'menu',
  autoTurretsEnabled: true,
  telemetry: defaultTelemetry,
  asteroidsDestroyed: 0,
  highScore: getStoredHighScore(),
  setAutoTurrets: (enabled) => set({ autoTurretsEnabled: enabled }),
  toggleAutoTurrets: () =>
    set((state) => ({
      autoTurretsEnabled: !state.autoTurretsEnabled,
    })),
  updateTelemetry: (telemetry) => set({ telemetry }),
  setGameState: (state) =>
    set(() => {
      const updates: Partial<HudStore> = { gameState: state };
      if (state === 'playing') {
        updates.asteroidsDestroyed = 0;
      }
      return updates;
    }),
  incrementAsteroidsDestroyed: () =>
    set((state) => {
      const nextScore = state.asteroidsDestroyed + 1;
      const nextHighScore = Math.max(state.highScore, nextScore);
      if (nextHighScore > state.highScore && typeof window !== 'undefined') {
        localStorage.setItem('asteroid_highscore', String(nextHighScore));
      }
      return {
        asteroidsDestroyed: nextScore,
        highScore: nextHighScore,
      };
    }),
  resetScore: () => set({ asteroidsDestroyed: 0 }),
}));
