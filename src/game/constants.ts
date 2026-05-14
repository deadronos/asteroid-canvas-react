export const COLORS = {
  ship: 0x00ffff,
  asteroid: 0xff00ff,
  bullet: 0x00ffff,
  particle: 0xffffaa,
  background: 0x000000,
  hudText: '#00ffff',
};

export const WORLD = {
  width: 40,
  height: 40,
  depth: 20,
};

export const SHIP = {
  radius: 1.0,
  thrust: 15,
  turnSpeed: 3.0,
  drag: 0.98,
  maxSpeed: 20,
  invulnerableTime: 2.0,
};

export const ASTEROID = {
  large: { radius: 2.5, points: 20, speed: 3, splitsInto: 'medium' },
  medium: { radius: 1.5, points: 50, speed: 5, splitsInto: 'small' },
  small: { radius: 0.7, points: 100, speed: 8, splitsTo: null },
};

export const BULLET = {
  speed: 30,
  lifetime: 1.5,
  maxCount: 5,
  radius: 0.15,
};

export const PARTICLE = {
  poolSize: 200,
  thrustBurstCount: 18,
  thrustContinuousCount: 4,
  thrustLifetime: 0.3,
  thrustSpeed: 8,
};

export const CAMERA = {
  offsetBack: 12,
  offsetUp: 4,
  lerpFactor: 0.08,
};

export const GAME = {
  startLives: 3,
  startAsteroids: 4,
  levelClearDelay: 3.0,
};