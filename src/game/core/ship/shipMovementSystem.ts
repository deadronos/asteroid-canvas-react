import { capHorizontalVelocity, getForward, getRight } from '../bodyTransform';
import type { GameEntity, InputSnapshot } from '../types';

export function updateShipMovement(
  shipEntity: GameEntity,
  dt: number,
  input: InputSnapshot,
  isPlaying: boolean,
) {
  if (!shipEntity.ship) {
    return;
  }

  const forward = getForward(shipEntity.body);
  const right = getRight(shipEntity.body);
  const thrustInput = isPlaying ? Number(input.forward) - Number(input.backward) : 0;
  const strafeInput = isPlaying ? Number(input.strafeRight) - Number(input.strafeLeft) : 0;
  const yawInput = isPlaying ? Number(input.yawLeft) - Number(input.yawRight) : 0;
  const blueprint = shipEntity.ship.blueprint;
  const thrustForce =
    thrustInput >= 0 ? blueprint.engines.mainThrust : blueprint.engines.reverseThrust;

  if (thrustInput !== 0) {
    const thrustVector = forward.multiplyScalar(thrustForce * thrustInput * dt);
    shipEntity.body.applyImpulse({ x: thrustVector.x, y: 0, z: thrustVector.z }, true);
  }

  if (strafeInput !== 0) {
    const dodgeVector = right.multiplyScalar(blueprint.thrusters.strafeThrust * strafeInput * dt);
    shipEntity.body.applyImpulse({ x: dodgeVector.x, y: 0, z: dodgeVector.z }, true);
  }

  shipEntity.body.setAngvel({ x: 0, y: yawInput * blueprint.thrusters.yawRate, z: 0 }, true);
  capHorizontalVelocity(shipEntity.body, blueprint.engines.maxSpeed);
}
