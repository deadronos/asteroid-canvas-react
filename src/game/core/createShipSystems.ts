import { useHudStore } from '../ui/useHudStore';

import { updateShipMovement } from './ship/shipMovementSystem';
import { updateCooldowns, updateShipShields } from './ship/shipStatusSystem';
import { updateShipWeapons } from './ship/shipWeaponSystem';
import { applyShipDamage } from './shipState';
import type { EntityStore, SpawnApi } from './sessionTypes';
import type { GameEntity, InputSnapshot } from './types';

export function createShipSystems(store: EntityStore, spawnApi: SpawnApi) {
  const updateShip = (shipEntity: GameEntity, dt: number, input: InputSnapshot) => {
    if (!shipEntity.ship) {
      return;
    }

    const gameState = useHudStore.getState().gameState;
    const isPlaying = gameState === 'playing';

    // 1. Update movement and controls
    updateShipMovement(shipEntity, dt, input, isPlaying);

    // 2. Decrement cooldowns and update status (shield delay, autoTurrets state)
    updateCooldowns(shipEntity, dt);

    // 3. Recharge shields if applicable
    updateShipShields(shipEntity, dt);

    // 4. Update weapons (manual firing & auto-turrets targeting/firing)
    updateShipWeapons(shipEntity, dt, input, store, spawnApi, isPlaying);
  };

  return {
    applyShipDamage,
    updateShip,
  };
}
