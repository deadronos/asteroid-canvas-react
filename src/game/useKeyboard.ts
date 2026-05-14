import { useEffect, useRef } from 'react';

export interface KeyboardState {
  up: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  enter: boolean;
}

export function useKeyboard(): React.MutableRefObject<KeyboardState> {
  const keys = useRef<KeyboardState>({
    up: false,
    left: false,
    right: false,
    space: false,
    enter: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.up = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.space = true;
          break;
        case 'Enter':
          keys.current.enter = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.up = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.space = false;
          break;
        case 'Enter':
          keys.current.enter = false;
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

  return keys;
}