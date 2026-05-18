import React, { useContext, useRef, useState } from 'react';
import { GameContext } from '../App';
import { useFrame } from "@react-three/fiber";
import { GameState } from './types';
import * as THREE from 'three';


export default function Systems() {
    const [debug, setDebug] = useState(false);
    const gameState = useContext(GameContext);
    const lastTimeRef = useRef(0);
    const nowTimeRef = useRef(0);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    function handlePlayerAccceleration(gameState:GameState, dt:number) {
       if (debug) console.debug('Handling player acceleration with dt:', dt, 'Acceleration:', gameState.player.acceleration);
    }

    function handlePlayerVelocity(gameState:GameState, dt:number) {
        const currentVelocity = gameState.player.velocity as THREE.Vector3;
        const currentAcceleration = gameState.player.acceleration as THREE.Vector3;
        const newVelocity = currentVelocity.add(currentAcceleration.clone().multiplyScalar(dt));
        gameState.updatePlayerVelocity(newVelocity);
    }

    function handlePlayerPosition(gameState:GameState, dt:number) {
        const currentPosition = gameState.player.position as THREE.Vector3;
        const currentVelocity = gameState.player.velocity as THREE.Vector3;
        const newPosition = currentPosition.add(currentVelocity.clone().multiplyScalar(dt));
        gameState.updatePlayerPosition(newPosition);
    }

    function handlePlayerRotation(gameState:GameState, dt:number) {
        // Placeholder for rotation logic

    }

    useFrame((state,dt) => {
        lastTimeRef.current = nowTimeRef.current;
        nowTimeRef.current = state.clock.getElapsedTime();
        const deltaTime = nowTimeRef.current - lastTimeRef.current;
        const targetFPS=1/60/1000; 

        if (lastTimeRef.current === 0) return; // skip the first frame to avoid large dt
        if (nowTimeRef.current < lastTimeRef.current) return; // skip if time goes backwards (shouldn't happen but just in case)
        if (deltaTime < targetFPS) return; // skip if we're running faster than the target FPS

        handlePlayerAccceleration(gameState.getState(), deltaTime);
        handlePlayerVelocity(gameState.getState(), deltaTime);
        handlePlayerPosition(gameState.getState(), deltaTime);
        handlePlayerRotation(gameState.getState(), deltaTime);
    });

    return null;
}








    