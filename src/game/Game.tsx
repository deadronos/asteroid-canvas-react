import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './GameScene';
import { HUD } from './HUD';
import { useKeyboard } from './useKeyboard';
import type { GameData } from './types';
import type { KeyboardState } from './useKeyboard';

export default function Game() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const keysRef = useKeyboard() as React.MutableRefObject<KeyboardState>;

  const handleDataChange = useCallback((data: GameData) => {
    setGameData(data);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 4, -12], fov: 75 }} style={{ background: '#000000' }}>
        <GameScene keysRef={keysRef} onDataChange={handleDataChange} />
      </Canvas>
      <HUD data={gameData} />
    </div>
  );
}