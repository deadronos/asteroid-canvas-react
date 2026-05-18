
import Game from './game/Game';

import { createContext, useState } from 'react';
import { createGameStore, GameStore } from './game/types';
import type { Vec3 } from './game/types';

export const GameContext = createContext<GameStore|null>
(createGameStore({ 
  isRunning: false, 
  score: 0, 
  player: {
    id: 1,
    isIdle: true, 
    position: {x: 0, y: 0, z: 0} as Vec3, 
    velocity: {x: 0, y: 0, z: 0} as Vec3, 
    acceleration: {x: 0, y: 0, z: 0} as Vec3, 
    pitch: 0, 
    roll: 0, 
    yaw: 0, 
    health: {current: 100, max: 100}, 
    meshRef: null
  }, 
  asteroids: [] 
}));




export default function App() {
  const [gameState]=useState(()=>createGameStore());
  return (
    <GameContext.Provider value={gameState}>
      <Game />
    </GameContext.Provider>
  );
}