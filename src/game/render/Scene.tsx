import { Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { MutableRefObject } from 'react';

import type { GameSession } from '../core/sessionTypes';
import type { GameEntity, InputSnapshot } from '../core/types';
import { useSessionStructure } from '../hooks/useSessionStructure';
import AsteroidMesh from './AsteroidMesh';
import ChaseCamera from './ChaseCamera';
import ProjectileMesh from './ProjectileMesh';
import ShipMesh from './ShipMesh';

export default function Scene({
  session,
  inputRef,
}: {
  session: GameSession;
  inputRef: MutableRefObject<InputSnapshot>;
}) {
  useSessionStructure(session);

  useFrame((_, delta) => {
    session.step(delta, inputRef.current);
    inputRef.current.toggleAutoTurrets = false;
  });

  const ships: GameEntity[] = Array.from(session.queries.ships);
  const asteroids: GameEntity[] = Array.from(session.queries.asteroids);
  const projectiles: GameEntity[] = Array.from(session.queries.projectiles);

  return (
    <>
      <color attach="background" args={['#050a12']} />
      <fog attach="fog" args={['#050a12', 45, 360]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[12, 18, 10]} intensity={1.5} castShadow />
      <pointLight position={[0, 0, -24]} intensity={1.1} color="#9edcff" />
      <Stars radius={180} depth={80} count={10000} factor={4} saturation={0.3} fade speed={0.3} />
      <ChaseCamera session={session} />
      {ships.map((entity) => (
        <ShipMesh key={entity.id} entity={entity} />
      ))}
      {asteroids.map((entity) => (
        <AsteroidMesh key={entity.id} entity={entity} />
      ))}
      {projectiles.map((entity) => (
        <ProjectileMesh key={entity.id} entity={entity} />
      ))}
    </>
  );
}
