import type { ShipBlueprint } from '../core/types';

export const cruiserBlueprint: ShipBlueprint = {
  id: 'cruiser',
  label: 'Venture Cruiser',
  description:
    'Starter hull with balanced armor, a forgiving shield envelope, and two dorsal turrets that can be handed off to an auto-fire routine.',
  hull: {
    maxHull: 180,
    mass: 38,
    radius: 3.1,
    dimensions: [2.8, 1.1, 7.8],
    color: '#7fa8d4',
    accentColor: '#d3e5ff',
  },
  armor: {
    maxArmor: 120,
    mitigation: 0.34,
    shellThickness: 0.15,
    color: '#9aa4b7',
  },
  shield: {
    maxShield: 95,
    rechargePerSecond: 18,
    rechargeDelay: 2.8,
    color: '#64d8ff',
  },
  engines: {
    mainThrust: 42,
    reverseThrust: 20,
    maxSpeed: 26,
    nozzleCount: 3,
  },
  thrusters: {
    strafeThrust: 24,
    yawRate: 1.9,
    dodgeImpulse: 10,
  },
  turrets: [
    {
      id: 'port-dorsal',
      label: 'Port Dorsal',
      mount: [-0.9, 0.75, -0.35],
      range: 34,
      cooldown: 0.44,
      projectileSpeed: 42,
      damage: 18,
      color: '#8cf3ff',
    },
    {
      id: 'starboard-dorsal',
      label: 'Starboard Dorsal',
      mount: [0.9, 0.75, -0.35],
      range: 34,
      cooldown: 0.44,
      projectileSpeed: 42,
      damage: 18,
      color: '#8cf3ff',
    },
  ],
};

export const shipBlueprints = {
  cruiser: cruiserBlueprint,
} as const;