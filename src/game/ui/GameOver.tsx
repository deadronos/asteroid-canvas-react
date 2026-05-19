import { useHudStore } from './useHudStore';

export default function GameOver({
  onRestart,
  onReturnToMenu,
}: {
  onRestart: () => void;
  onReturnToMenu: () => void;
}) {
  const score = useHudStore((state) => state.asteroidsDestroyed);
  const highScore = useHudStore((state) => state.highScore);
  const isNewHighScore = score > 0 && score === highScore;

  return (
    <div className="menu-overlay">
      <div className="menu-card gameover-card">
        <div className="menu-header">
          <h1 className="gameover-title">Mission Failed</h1>
          <p className="gameover-subtitle">Cruiser hull compromised in asteroid field</p>
        </div>

        <div className="gameover-stats">
          <div className="stat-box">
            <span className="stat-label">Asteroids Cleared</span>
            <strong className="stat-value">{score}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Sector Record</span>
            <strong className="stat-value">{highScore}</strong>
          </div>
        </div>

        {isNewHighScore && (
          <div className="new-highscore-badge">
            <span>★ New Sector Record Established ★</span>
          </div>
        )}

        <div className="gameover-actions">
          <button className="menu-start-button gameover-button" type="button" onClick={onRestart}>
            Try Again
          </button>
          <button
            className="menu-button-secondary gameover-button"
            type="button"
            onClick={onReturnToMenu}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
