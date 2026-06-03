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
    session?.clearTransientEntities();
    resetShip();
    session?.setConfig({ gameState: 'playing' });
    useHudStore.getState().setGameState('playing');
  };

  const handleReturnToMenu = () => {
    session?.clearTransientEntities();
    resetShip();
    session?.setConfig({ gameState: 'menu' });
    useHudStore.getState().setGameState('menu');
  };

  // Keep the HUD's auto-turret toggle wired to the session config. The
  // keyboard `T` key toggles `session.config.autoTurretsEnabled` directly
  // via the step function, but the HUD button previously only flipped the
  // Zustand UI state, so clicking it changed the label without affecting
  // gameplay.
  const handleToggleAutoTurrets = () => {
    if (!session) {
      useHudStore.getState().toggleAutoTurrets();
      return;
    }
    const next = !session.config.autoTurretsEnabled;
    session.setConfig({ autoTurretsEnabled: next });
    useHudStore.getState().setAutoTurrets(next);
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
      {gameState === 'playing' && <Hud onToggleAutoTurrets={handleToggleAutoTurrets} />}
      {gameState === 'gameover' && (
        <GameOver onRestart={handleStartGame} onReturnToMenu={handleReturnToMenu} />
      )}
    </div>
  );
}
