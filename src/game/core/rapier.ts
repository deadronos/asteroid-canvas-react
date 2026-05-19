import * as RAPIER from '@dimforge/rapier3d-compat';

let initialized = false;
let initializationPromise: Promise<typeof RAPIER> | null = null;

export async function ensureRapierReady() {
  if (!initializationPromise) {
    initializationPromise = RAPIER.init().then(() => {
      initialized = true;
      return RAPIER;
    });
  }

  return initializationPromise;
}

export function assertRapierReady() {
  if (!initialized) {
    throw new Error(
      'RAPIER has not been initialized. Call ensureRapierReady() before createGameSession().',
    );
  }
}

export { RAPIER };
