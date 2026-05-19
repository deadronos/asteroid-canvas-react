import type * as THREE from 'three';

import { copyBodyQuaternion, copyBodyTranslation } from '../core/spatial';
import type { GameEntity } from '../core/types';

export function syncObjectTransform(object: THREE.Object3D | null, entity: GameEntity) {
  if (!object || !entity.body.isValid()) {
    if (object) {
      object.visible = false;
    }

    return;
  }

  const translation = copyBodyTranslation(entity.body);
  const rotation = copyBodyQuaternion(entity.body);

  object.visible = true;
  object.position.set(translation.x, translation.y, translation.z);
  object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}
