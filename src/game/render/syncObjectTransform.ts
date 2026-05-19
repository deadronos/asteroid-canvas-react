import type * as THREE from 'three';

import type { GameEntity } from '../core/types';

export function syncObjectTransform(object: THREE.Object3D | null, entity: GameEntity) {
  if (!object) {
    return;
  }

  const translation = entity.body.translation();
  const rotation = entity.body.rotation();

  object.position.set(translation.x, translation.y, translation.z);
  object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}
