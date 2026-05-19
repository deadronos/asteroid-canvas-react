import * as RAPIER from '@dimforge/rapier3d-compat';

let initialized = false;
let initializationPromise: Promise<typeof RAPIER> | null = null;
const RAPIER_INIT_DEPRECATION =
  'using deprecated parameters for the initialization function; pass a single object instead';

export async function ensureRapierReady() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const originalWarn = console.warn;

      console.warn = (...args: unknown[]) => {
        const [message] = args;

        if (typeof message === 'string' && message.includes(RAPIER_INIT_DEPRECATION)) {
          return;
        }

        originalWarn(...args);
      };

      try {
        await RAPIER.init();
        initialized = true;

        return RAPIER;
      } finally {
        console.warn = originalWarn;
      }
    })();
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
