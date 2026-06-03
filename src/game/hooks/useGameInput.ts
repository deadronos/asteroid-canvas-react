import { useEffect, useRef } from 'react';

import { EMPTY_INPUT } from '../core/types';
import type { InputSnapshot } from '../core/types';

/**
 * Keyboard codes that the game handles. Used both to short-circuit the
 * switch and to call `event.preventDefault()` so the browser's default
 * behavior (page scrolling on Space / arrows, button activation on
 * Space, etc.) doesn't run alongside the game.
 */
const HANDLED_KEYS = new Set<string>([
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
  'KeyQ',
  'KeyE',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'KeyT',
]);

export function useGameInput() {
  const inputRef = useRef<InputSnapshot>({ ...EMPTY_INPUT });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = true;
          break;
        case 'KeyA':
          inputRef.current.strafeLeft = true;
          break;
        case 'KeyD':
          inputRef.current.strafeRight = true;
          break;
        case 'KeyQ':
        case 'ArrowLeft':
          inputRef.current.yawLeft = true;
          break;
        case 'KeyE':
        case 'ArrowRight':
          inputRef.current.yawRight = true;
          break;
        case 'Space':
          inputRef.current.fire = true;
          break;
        case 'KeyT':
          if (!event.repeat) {
            inputRef.current.toggleAutoTurrets = true;
          }
          break;
        default:
          break;
      }

      // Prevent the browser's default behavior for game keys so that
      // Space doesn't scroll the page or activate focused buttons,
      // arrow keys don't scroll, etc. Keys we don't handle are left
      // alone (Tab still works for focus traversal, F5 still reloads,
      // etc.).
      if (HANDLED_KEYS.has(event.code)) {
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = false;
          break;
        case 'KeyA':
          inputRef.current.strafeLeft = false;
          break;
        case 'KeyD':
          inputRef.current.strafeRight = false;
          break;
        case 'KeyQ':
        case 'ArrowLeft':
          inputRef.current.yawLeft = false;
          break;
        case 'KeyE':
        case 'ArrowRight':
          inputRef.current.yawRight = false;
          break;
        case 'Space':
          inputRef.current.fire = false;
          break;
        default:
          break;
      }
    };

    // When the window loses focus (Alt-Tab, clicking outside, devtools,
    // etc.) the browser does NOT guarantee that keyup events fire for
    // any keys currently held down. Without this reset the input ref
    // would be stuck with `forward = true` (or similar) and the ship
    // would keep accelerating when the user returns.
    const onBlur = () => {
      inputRef.current = { ...EMPTY_INPUT };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return inputRef;
}
