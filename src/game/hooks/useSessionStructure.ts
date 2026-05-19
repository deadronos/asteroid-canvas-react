import { useSyncExternalStore } from 'react';

import type { GameSession } from '../core/sessionTypes';

export function useSessionStructure(session: GameSession) {
  return useSyncExternalStore(
    session.subscribeStructure,
    session.getStructureRevision,
    session.getStructureRevision,
  );
}
