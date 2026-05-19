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

interface HudStore {
  autoTurretsEnabled: boolean;
  telemetry: TelemetrySnapshot;
  setAutoTurrets: (enabled: boolean) => void;
  toggleAutoTurrets: () => void;
  updateTelemetry: (telemetry: TelemetrySnapshot) => void;
}

export const useHudStore = create<HudStore>((set) => ({
  autoTurretsEnabled: true,
  telemetry: defaultTelemetry,
  setAutoTurrets: (enabled) => set({ autoTurretsEnabled: enabled }),
  toggleAutoTurrets: () =>
    set((state) => ({
      autoTurretsEnabled: !state.autoTurretsEnabled,
    })),
  updateTelemetry: (telemetry) => set({ telemetry }),
}));