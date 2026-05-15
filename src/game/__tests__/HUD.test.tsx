import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HUD } from '../HUD';
import type { GameData } from '../types';

const createGameData = (overrides: Partial<GameData> = {}): GameData => ({
  state: 'START',
  score: 0,
  lives: 3,
  level: 1,
  ship: {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: 0,
    invulnerable: false,
    invulnerableTimer: 0,
  },
  asteroids: [],
  bullets: [],
  particles: [],
  nextAsteroidId: 4,
  nextBulletId: 0,
  nextParticleId: 0,
  levelClearTimer: 0,
  ...overrides,
});

describe('HUD', () => {
  it('should return null when data is null', () => {
    const { container } = render(<HUD data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display score zero-padded to 6 digits', () => {
    render(<HUD data={createGameData({ score: 0 })} />);
    expect(screen.getByText(/SCORE:\s*000000/)).toBeInTheDocument();
  });

  it('should display score with correct padding for non-zero values', () => {
    render(<HUD data={createGameData({ score: 123 })} />);
    expect(screen.getByText(/SCORE:\s*000123/)).toBeInTheDocument();
  });

  it('should display score with maximum padding', () => {
    render(<HUD data={createGameData({ score: 999999 })} />);
    expect(screen.getByText(/SCORE:\s*999999/)).toBeInTheDocument();
  });

  it('should display level', () => {
    render(<HUD data={createGameData({ level: 5 })} />);
    expect(screen.getByText(/LEVEL:\s*5/)).toBeInTheDocument();
  });

  it('should display lives with multiplication sign', () => {
    render(<HUD data={createGameData({ lives: 3 })} />);
    expect(screen.getByText(/LIVES:\s*×3/)).toBeInTheDocument();
  });

  it('should display lives as 0 when no lives left', () => {
    render(<HUD data={createGameData({ lives: 0 })} />);
    expect(screen.getByText(/LIVES:\s*×0/)).toBeInTheDocument();
  });

  it('should show start screen message', () => {
    render(<HUD data={createGameData({ state: 'START' })} />);
    expect(screen.getByText('ASTEROIDS')).toBeInTheDocument();
    expect(screen.getByText('PRESS ENTER TO START')).toBeInTheDocument();
  });

  it('should show game over message with final score', () => {
    render(<HUD data={createGameData({ state: 'GAME_OVER', score: 5432 })} />);
    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    expect(screen.getByText(/FINAL SCORE:\s*5432/)).toBeInTheDocument();
    expect(screen.getByText('PRESS ENTER TO RESTART')).toBeInTheDocument();
  });

  it('should show level clear message', () => {
    render(<HUD data={createGameData({ state: 'LEVEL_CLEAR', level: 2 })} />);
    expect(screen.getByText('LEVEL 2 CLEAR')).toBeInTheDocument();
  });

  it('should show ship destroyed message', () => {
    render(<HUD data={createGameData({ state: 'SHIP_DESTROYED' })} />);
    expect(screen.getByText('SHIP DESTROYED')).toBeInTheDocument();
  });

  it('should not show center message during PLAYING state', () => {
    render(<HUD data={createGameData({ state: 'PLAYING' })} />);
    expect(screen.queryByText('ASTEROIDS')).not.toBeInTheDocument();
    expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
    expect(screen.queryByText('LEVEL')).not.toBeInTheDocument();
    expect(screen.queryByText('SHIP DESTROYED')).not.toBeInTheDocument();
  });

  it('should display score for playing state', () => {
    render(<HUD data={createGameData({ state: 'PLAYING', score: 999 })} />);
    expect(screen.getByText(/SCORE:\s*000999/)).toBeInTheDocument();
  });

  it('should display updated score in PLAYING', () => {
    render(<HUD data={createGameData({ state: 'PLAYING', score: 1500, level: 3, lives: 2 })} />);
    expect(screen.getByText(/SCORE:\s*001500/)).toBeInTheDocument();
    expect(screen.getByText(/LEVEL:\s*3/)).toBeInTheDocument();
    expect(screen.getByText(/LIVES:\s*×2/)).toBeInTheDocument();
  });

  it('should hide start message when not in START state', () => {
    render(<HUD data={createGameData({ state: 'PLAYING' })} />);
    expect(screen.queryByText('PRESS ENTER TO START')).not.toBeInTheDocument();
  });

  it('should handle game over with zero score', () => {
    render(<HUD data={createGameData({ state: 'GAME_OVER', score: 0 })} />);
    expect(screen.getByText(/FINAL SCORE:\s*0/)).toBeInTheDocument();
  });
});