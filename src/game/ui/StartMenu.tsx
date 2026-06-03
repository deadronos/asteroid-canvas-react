import { useHudStore } from './useHudStore';

export default function StartMenu({ onStart }: { onStart: () => void }) {
  const highScore = useHudStore((state) => state.highScore);

  return (
    <div className="menu-overlay">
      <div className="menu-card">
        <div className="menu-header">
          <h1 className="menu-title">Asteroid Canyon</h1>
          <p className="menu-subtitle">Cruiser Flight Simulator</p>
        </div>

        <div className="menu-columns">
          <section className="menu-section">
            <h3>Vessel Specifications</h3>
            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">Class</span>
                <span className="spec-value text-blue">Venture Cruiser</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Hull Strength</span>
                <span className="spec-value">180 HP</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Armor Plating</span>
                <span className="spec-value">120 AP (34% mitigation)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Deflector Shield</span>
                <span className="spec-value">95 SP (Auto-charge)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Weapons</span>
                <span className="spec-value">2x Mounted Auto-Turrets</span>
              </div>
            </div>
          </section>

          <section className="menu-section">
            <h3>Flight Controls</h3>
            <div className="controls-list">
              <div className="control-item">
                <kbd>W</kbd> / <kbd>S</kbd>
                <span>Accelerate / Brake</span>
              </div>
              <div className="control-item">
                <kbd>A</kbd> / <kbd>D</kbd>
                <span>Lateral Strafe</span>
              </div>
              <div className="control-item">
                <kbd>Q</kbd> / <kbd>E</kbd>
                <span>Ship Yaw (Turn)</span>
              </div>
              <div className="control-item">
                <kbd>Space</kbd>
                <span>Forward Plasma Cannon</span>
              </div>
              <div className="control-item">
                <kbd>T</kbd>
                <span>Toggle Auto-Turrets</span>
              </div>
            </div>
          </section>
        </div>

        {highScore > 0 && (
          <div className="menu-highscore">
            <span className="highscore-label">Sector High Score</span>
            <strong className="highscore-value">{highScore} Asteroids Cleared</strong>
          </div>
        )}

        <div className="menu-actions">
          <button className="menu-start-button" type="button" onClick={onStart}>
            Start Mission
          </button>
        </div>
      </div>
    </div>
  );
}
