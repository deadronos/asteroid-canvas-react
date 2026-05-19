import { useEffect, useRef } from 'react';

import { EMPTY_INPUT } from '../core/types';
import type { InputSnapshot } from '../core/types';

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

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return inputRef;
}