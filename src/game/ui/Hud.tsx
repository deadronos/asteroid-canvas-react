import { useHudStore } from './useHudStore';
import HudBar from './HudBar';

export default function Hud() {
  const telemetry = useHudStore((state) => state.telemetry);
  const autoTurretsEnabled = useHudStore((state) => state.autoTurretsEnabled);
  const toggleAutoTurrets = useHudStore((state) => state.toggleAutoTurrets);

  return (
    <div className="hud">
      <section className="hud-panel">
        <div className="hud-title">
          <div>
            <h1>{telemetry.shipName}</h1>
            <p className="hud-copy">
              Data-driven starter slice: configurable hull, armor, shield, engines, thrusters, and
              turret mounts.
            </p>
          </div>
          <span className="hud-chip" data-active={autoTurretsEnabled}>
            {autoTurretsEnabled ? 'Turrets Auto' : 'Turrets Manual'}
          </span>
        </div>
        <div className="hud-grid">
          <HudBar label="Hull" current={telemetry.hull} max={telemetry.maxHull} tone="hull" />
          <HudBar label="Armor" current={telemetry.armor} max={telemetry.maxArmor} tone="armor" />
          <HudBar
            label="Shield"
            current={telemetry.shield}
            max={telemetry.maxShield}
            tone="shield"
          />
        </div>
        <div className="hud-metrics">
          <div className="hud-metric">
            <strong>{telemetry.speed.toFixed(1)}</strong>
            <span>Current Speed</span>
          </div>
          <div className="hud-metric">
            <strong>{telemetry.asteroidCount}</strong>
            <span>Active Asteroids</span>
          </div>
          <div className="hud-metric">
            <strong>{telemetry.turretCount}</strong>
            <span>Mounted Turrets</span>
          </div>
          <div className="hud-metric">
            <strong>3rd Person</strong>
            <span>Player Chase Cam</span>
          </div>
        </div>
        <button className="hud-button" type="button" onClick={toggleAutoTurrets}>
          {autoTurretsEnabled ? 'Disable Auto Turrets' : 'Enable Auto Turrets'}
        </button>
      </section>

      <section className="hud-panel">
        <div className="hud-title">
          <div>
            <h2>Controls</h2>
            <p className="hud-copy">
              Manual piloting stays with the player while turrets can be toggled into
              auto-target/auto-fire mode.
            </p>
          </div>
        </div>
        <div className="hud-controls">
          <span>
            <code>W</code>/<code>S</code> or <code>Up</code>/<code>Down</code> to accelerate and
            brake
          </span>
          <span>
            <code>A</code>/<code>D</code> to strafe around asteroid lines
          </span>
          <span>
            <code>Q</code>/<code>E</code> or <code>Left</code>/<code>Right</code> to yaw the ship
          </span>
          <span>
            <code>Space</code> to fire the forward cannon
          </span>
          <span>
            <code>T</code> to toggle turret auto-targeting and auto-fire
          </span>
        </div>
      </section>
    </div>
  );
}
