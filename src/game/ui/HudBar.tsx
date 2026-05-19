export default function HudBar({
  label,
  current,
  max,
  tone,
}: {
  label: string;
  current: number;
  max: number;
  tone: 'hull' | 'armor' | 'shield';
}) {
  return (
    <div className="hud-bar">
      <div className="hud-bar-label">
        <span>{label}</span>
        <strong>
          {Math.round(current)} / {Math.round(max)}
        </strong>
      </div>
      <progress
        className={`hud-progress hud-progress--${tone}`}
        value={current}
        max={Math.max(max, 1)}
      />
    </div>
  );
}
