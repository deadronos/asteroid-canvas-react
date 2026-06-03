import { describe, expect, it, vi } from 'vitest';

import { createGameEventBus } from './events';

describe('GameEventBus', () => {
  it('delivers emitted events to registered listeners', () => {
    const bus = createGameEventBus();
    const handler = vi.fn();

    bus.on('telemetryUpdate', handler);
    bus.emit('telemetryUpdate', {
      shipName: 'Test',
      hull: 100,
      maxHull: 100,
      armor: 50,
      maxArmor: 50,
      shield: 30,
      maxShield: 30,
      speed: 10,
      asteroidCount: 5,
      turretCount: 2,
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ shipName: 'Test', speed: 10 }),
    );
  });

  it('supports multiple listeners on the same event', () => {
    const bus = createGameEventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    bus.on('asteroidDestroyed', handlerA);
    bus.on('asteroidDestroyed', handlerB);
    bus.emit('asteroidDestroyed', { count: 1 });

    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledOnce();
  });

  it('does not call listeners for other events', () => {
    const bus = createGameEventBus();
    const handler = vi.fn();

    bus.on('telemetryUpdate', handler);
    bus.emit('asteroidDestroyed', { count: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('returns an unsubscribe function that removes the listener', () => {
    const bus = createGameEventBus();
    const handler = vi.fn();

    const unsub = bus.on('shipDamaged', handler);
    bus.emit('shipDamaged', { hull: 50 });
    expect(handler).toHaveBeenCalledOnce();

    unsub();
    bus.emit('shipDamaged', { hull: 25 });
    expect(handler).toHaveBeenCalledOnce(); // still once
  });

  it('does not throw when emitting with no listeners', () => {
    const bus = createGameEventBus();

    expect(() => {
      bus.emit('gameStateChange', { state: 'gameover' });
    }).not.toThrow();
  });

  it('handles gameStateChange events', () => {
    const bus = createGameEventBus();
    const states: string[] = [];

    bus.on('gameStateChange', ({ state }) => {
      states.push(state);
    });

    bus.emit('gameStateChange', { state: 'playing' });
    bus.emit('gameStateChange', { state: 'gameover' });
    bus.emit('gameStateChange', { state: 'menu' });

    expect(states).toEqual(['playing', 'gameover', 'menu']);
  });

  it('allows unsubscribing one of multiple listeners without affecting others', () => {
    const bus = createGameEventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    const unsubA = bus.on('shipDamaged', handlerA);
    bus.on('shipDamaged', handlerB);

    unsubA();
    bus.emit('shipDamaged', { hull: 0 });

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledOnce();
  });
});
