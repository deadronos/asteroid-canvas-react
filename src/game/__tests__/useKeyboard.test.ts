import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboard } from '../useKeyboard';

describe('useKeyboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with all keys false', () => {
    const { result } = renderHook(() => useKeyboard());
    expect(result.current.current.up).toBe(false);
    expect(result.current.current.left).toBe(false);
    expect(result.current.current.right).toBe(false);
    expect(result.current.current.space).toBe(false);
    expect(result.current.current.enter).toBe(false);
  });

  it('should set up to true on KeyW press', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    });
    expect(result.current.current.up).toBe(true);
  });

  it('should set up to true on ArrowUp press', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    });
    expect(result.current.current.up).toBe(true);
  });

  it('should set left to true on KeyA press', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    });
    expect(result.current.current.left).toBe(true);
  });

  it('should set right to true on KeyD press', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    });
    expect(result.current.current.right).toBe(true);
  });

  it('should set space to true on Space press', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    });
    expect(result.current.current.space).toBe(true);
  });

  it('should set enter to true on Enter press', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    });
    expect(result.current.current.enter).toBe(true);
  });

  it('should set key to false on keyup', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    });
    expect(result.current.current.up).toBe(false);
  });

  it('should handle multiple keys pressed simultaneously', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
    });
    expect(result.current.current.up).toBe(true);
    expect(result.current.current.left).toBe(true);
    expect(result.current.current.right).toBe(false);
  });

  it('should handle keydown then keyup independently', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    });
    expect(result.current.current.up).toBe(false);
    expect(result.current.current.space).toBe(true);
  });

  it('should return a ref that persists across re-renders', () => {
    const { result, rerender } = renderHook(() => useKeyboard());
    const refBefore = result.current;
    rerender();
    const refAfter = result.current;
    expect(refBefore).toBe(refAfter);
  });

  it('should handle ArrowLeft for left turn', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    });
    expect(result.current.current.left).toBe(true);
  });

  it('should handle ArrowRight for right turn', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    });
    expect(result.current.current.right).toBe(true);
  });

  it('should not affect other keys when one is released', () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    });
    expect(result.current.current.up).toBe(false);
    expect(result.current.current.left).toBe(true);
  });

  it('should handle rapid key press/release cycles', () => {
    const { result } = renderHook(() => useKeyboard());
    for (let i = 0; i < 5; i++) {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
      });
    }
    expect(result.current.current.space).toBe(false);
  });
});