import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Hud from './Hud';
import { useHudStore } from './useHudStore';

describe('Hud', () => {
  beforeEach(() => {
    useHudStore.setState({
      gameState: 'playing',
      autoTurretsEnabled: true,
      asteroidsDestroyed: 0,
      highScore: 0,
      telemetry: {
        shipName: 'Test Cruiser',
        hull: 100,
        maxHull: 100,
        armor: 50,
        maxArmor: 50,
        shield: 30,
        maxShield: 30,
        speed: 0,
        asteroidCount: 5,
        turretCount: 2,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the ship name from the telemetry snapshot', () => {
    render(<Hud />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Cruiser');
  });

  it('shows the auto-turret state from the store', () => {
    useHudStore.setState({ autoTurretsEnabled: true });
    render(<Hud />);
    expect(screen.getByText('Turrets Auto')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Disable Auto Turrets');
  });

  it('invokes the provided onToggleAutoTurrets handler when the button is clicked (Bug #3)', () => {
    const onToggle = vi.fn();
    render(<Hud onToggleAutoTurrets={onToggle} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // The HUD button must call the session-level handler, not just the
    // local Zustand toggler. Otherwise the UI label changes but the
    // simulation config stays in sync, and turrets keep their old mode.
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('falls back to the local Zustand toggler when no handler is supplied', () => {
    render(<Hud />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // No handler -> HUD falls back to the local Zustand action so the
    // chip/label still updates (useful for isolated component tests).
    expect(useHudStore.getState().autoTurretsEnabled).toBe(false);
  });
});
