import { JSX, useContext, useMemo, useEffect, useState } from "react";
import { GameContext } from "../App";
import { useFrame } from "@react-three/fiber";
import type { GameState, InputState } from "./types";
import * as THREE from 'three';
import { useStore } from "zustand";


export function useKeyboardInput() {
    const keyboard: Record<string, boolean> = useMemo(() => ({}), []);

    const keydown= (e: KeyboardEvent) => (keyboard[e.code]=true);
    const keyup= (e: KeyboardEvent) => (keyboard[e.code]=false);

    useEffect(()=>{
        // Add event listeners for keydown and keyup
        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);
        return () => {
            // Clean up event listeners on unmount
            window.removeEventListener('keydown', keydown);
            window.removeEventListener('keyup', keyup);
        }
    })

    return keyboard;
}

export function useMouseInput() {
    const gameState = useContext(GameContext);
    if (!gameState) {
        return { x: 0, y: 0 };
    }
    const isPointerLocked = useStore(gameState, (state) => state.player.isPointerLocked);

    const mouseDelta = useMemo(() => ({ x: 0, y: 0 }), []);
    const mouseMove = (e: MouseEvent) => {
        mouseDelta.x += e.movementX;
        mouseDelta.y += e.movementY;
    };

    useEffect(() => {
        // Add event listener for mouse movement
        window.addEventListener('mousemove', mouseMove);
        return () => {
            // Clean up event listener on unmount
            window.removeEventListener('mousemove', mouseMove);
        }
    }, [isPointerLocked]);

    return mouseDelta;
}


export function getInputState(keyboard: Record<string, boolean>, mouse: { x: number; y: number }) {
    return {
        forward: keyboard['KeyW'] || false,
        backward: keyboard['KeyS'] || false,
        left: keyboard['KeyA'] || false,
        right: keyboard['KeyD'] || false,
        up: keyboard['Space'] || false,
        down: keyboard['ShiftLeft'] || false,
        rollLeft: keyboard['KeyQ'] || false,
        rollRight: keyboard['KeyE'] || false,
        cameraFollowToggle: keyboard['KeyC'] || false,
        pointerLocked: keyboard['KeyP'] || false,
        mouseDeltaX: mouse.x,
        mouseDeltaY: mouse.y,
    }
}

export default function InputHandler(): JSX.Element | null {
    const [debug, setDebug] = useState(false);
    const gameState = useContext(GameContext);
    const lastTimeRef = useMemo(() => ({ current: 0 }), []);
    const nowTimeRef = useMemo(() => ({ current: 0 }), []);
    const shouldProcessFrameRef = useMemo(() => ({ current: true }), []);
    
    if (!gameState) {
        return <div>Loading...</div>;
    }


    const keyboard = useKeyboardInput();
    const mouse = useMouseInput();
    const isPointerLocked = useStore(gameState, (state) => state.player.isPointerLocked);
    
    useFrame((state,dt)=> {
        if(!lastTimeRef.current) {
            lastTimeRef.current = state.clock.getElapsedTime()*1000;
            if (debug) console.debug('Initializing InputHandler timing');
            return; // skip the first frame to avoid large dt
        }
        if (!shouldProcessFrameRef.current) {
            // Skip this frame if we're waiting for the next one
            shouldProcessFrameRef.current = true; // reset for the next frame
            if (debug) console.debug('Skipping frame to maintain target FPS');
            return;
        }
        nowTimeRef.current = state.clock.getElapsedTime()*1000;
        const deltaTime = nowTimeRef.current - lastTimeRef.current;
        const targetFPS=1000/60; // 60 FPS target
        if ((deltaTime-targetFPS) < 0) {
            // Not enough time has passed to process the next frame, so skip it
            if (debug) console.debug(`Frame time (${deltaTime.toFixed(2)}ms) is below target (${targetFPS}ms), skipping frame`);
            shouldProcessFrameRef.current = true;
        } else {
            // Enough time has passed, so we can process the frame
            if (debug) console.debug(`Processing frame with deltaTime: ${deltaTime.toFixed(2)}ms`);
            shouldProcessFrameRef.current = false;            
            lastTimeRef.current = nowTimeRef.current;
            const inputState = getInputState(keyboard, mouse);
            if (debug)console.debug('Input State:', inputState);
            gameState.getState().setInputState(inputState as InputState);
        }
        if (debug)console.debug(`Frame time: ${deltaTime.toFixed(4)}ms`);
        return;
    })

    return null;
}
