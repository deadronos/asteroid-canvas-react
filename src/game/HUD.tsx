import type { GameData } from './types';

interface HUDProps {
  data: GameData | null;
}

export function HUD({ data }: HUDProps) {
  if (!data) return null;

  return (
    <div className="hud">
      <div className="hud-top-left">
        <div>SCORE: {String(data.score).padStart(6, '0')}</div>
        <div>LEVEL: {data.level}</div>
      </div>
      <div className="hud-top-right">
        <div>LIVES: ×{data.lives}</div>
      </div>
      {data.state === 'START' && (
        <div className="hud-center">
          <div className="title">ASTEROIDS</div>
          <div className="subtitle">PRESS ENTER TO START</div>
        </div>
      )}
      {data.state === 'GAME_OVER' && (
        <div className="hud-center">
          <div className="title">GAME OVER</div>
          <div className="subtitle">FINAL SCORE: {data.score}</div>
          <div className="subtitle">PRESS ENTER TO RESTART</div>
        </div>
      )}
      {data.state === 'LEVEL_CLEAR' && (
        <div className="hud-center">
          <div className="subtitle">LEVEL {data.level} CLEAR</div>
        </div>
      )}
      {data.state === 'SHIP_DESTROYED' && (
        <div className="hud-center">
          <div className="subtitle">SHIP DESTROYED</div>
        </div>
      )}
    </div>
  );
}