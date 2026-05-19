import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

import { createGameSession } from './core/createGameSession';
import { ensureRapierReady } from './core/rapier';
import type { GameSession } from './core/sessionTypes';
import { useGameInput } from './hooks/useGameInput';
import Scene from './render/Scene';
import BootCard from './ui/BootCard';
import Hud from './ui/Hud';

export default function Game() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const inputRef = useGameInput();

  useEffect(() => {
    let active = true;
    let nextSession: GameSession | null = null;

    void ensureRapierReady()
      .then(() => {
        if (!active) {
          return;
        }

        nextSession = createGameSession();
        setSession(nextSession);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setBootError(error instanceof Error ? error.message : 'Unknown Rapier bootstrap failure.');
      });

    return () => {
      active = false;
      nextSession?.dispose();
    };
  }, []);

  if (bootError) {
    return (
      <div className="game-shell">
        <BootCard title="Physics bootstrap failed" message={bootError} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="game-shell">
        <BootCard
          title="Initializing cruiser systems"
          message="Loading Rapier physics, creating the Miniplex world, and seeding the first asteroid field."
        />
      </div>
    );
  }

  return (
    <div className="game-shell">
      <Canvas
        className="space-canvas"
        camera={{ position: [0, 4.8, 13.5], fov: 52 }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <Scene session={session} inputRef={inputRef} />
      </Canvas>
      <Hud />
    </div>
  );
}
