import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

import { createGameSession } from './core/createGameSession';
import { ensureRapierReady } from './core/rapier';
import { resetShipState } from './core/shipState';
import type { GameSession } from './core/sessionTypes';
import { useGameEvents } from './hooks/useGameEvents';
import { useGameInput } from './hooks/useGameInput';
import Scene from './render/Scene';
import BootCard from './ui/BootCard';
import Hud from './ui/Hud';
import StartMenu from './ui/StartMenu';
import GameOver from './ui/GameOver';
import { useHudStore } from './ui/useHudStore';

export default function Game() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const inputRef = useGameInput();
  const gameState = useHudStore((state) => state.gameState);

  useGameEvents(session);

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

  const resetShip = () => {
    if (session) {
      const ship = session.getPlayerShip();
      if (ship && ship.ship) {
        resetShipState(ship.ship);
        ship.body.setTranslation({ x: 0, y: 0, z: 0 }, true);
        ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        ship.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  };

  const handleStartGame = () => {
    resetShip();
    session?.setConfig({ gameState: 'playing' });
    useHudStore.getState().setGameState('playing');
  };

  const handleReturnToMenu = () => {
    resetShip();
    session?.setConfig({ gameState: 'menu' });
    useHudStore.getState().setGameState('menu');
  };

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
      {gameState === 'menu' && <StartMenu onStart={handleStartGame} />}
      {gameState === 'playing' && <Hud />}
      {gameState === 'gameover' && (
        <GameOver onRestart={handleStartGame} onReturnToMenu={handleReturnToMenu} />
      )}
    </div>
  );
}
