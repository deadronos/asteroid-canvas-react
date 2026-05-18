import React, { useContext, useRef, useState } from 'react';
import { GameContext } from '../App';
import { useFrame, useThree } from "@react-three/fiber";
import { GameState } from './types';
import * as THREE from 'three';
import { Camera } from 'three';
import { useStore } from 'zustand';
import * as DREI from '@react-three/drei';


export default function Systems({ orbitControlsRef }: { orbitControlsRef: React.RefObject<typeof DREI.OrbitControls> }) {
    const [debug, setDebug] = useState(false);
    const gameState = useContext(GameContext);
    const lastTimeRef = useRef(0);
    const nowTimeRef = useRef(0);
    const camera = useThree().camera;
    const controls = useRef(orbitControlsRef.current);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    function handlePlayerInput(gameState:GameState, dt:number) {
        const inputState = gameState.inputState;
        // Placeholder for input handling logic
        const accelerationMagnitude = 0.1; // units per second squared
        const currentForwardVector = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(gameState.player.pitch, gameState.player.yaw, gameState.player.roll));
        const currentBackwardVector = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(gameState.player.pitch, gameState.player.yaw, gameState.player.roll));
        const currentRightVector = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(gameState.player.pitch, gameState.player.yaw, gameState.player.roll));
        const currentLeftVector = new THREE.Vector3(-1, 0, 0).applyEuler(new THREE.Euler(gameState.player.pitch, gameState.player.yaw, gameState.player.roll));
        const currentUpVector = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(gameState.player.pitch, gameState.player.yaw, gameState.player.roll));
        const currentDownVector = new THREE.Vector3(0, -1, 0).applyEuler(new THREE.Euler(gameState.player.pitch, gameState.player.yaw, gameState.player.roll));
        const transformedAcceleration = new THREE.Vector3(0, 0, 0);
        if (inputState.forward) transformedAcceleration.add(currentForwardVector);
        if (inputState.backward) transformedAcceleration.add(currentBackwardVector);
        if (inputState.right) transformedAcceleration.add(currentRightVector);
        if (inputState.left) transformedAcceleration.add(currentLeftVector);
        if (inputState.up) transformedAcceleration.add(currentUpVector);
        if (inputState.down) transformedAcceleration.add(currentDownVector);
        transformedAcceleration.normalize().multiplyScalar(accelerationMagnitude);
        const newAcceleration = (gameState.player.acceleration as THREE.Vector3).add(transformedAcceleration);
        gameState.updatePlayerAcceleration(newAcceleration);

        if (inputState.cameraFollowToggle) {
            gameState.toggleCameraFollow();
        }

        if (inputState.pointerLocked) {
            gameState.togglePointerLock();
        }

    }

    function handlePlayerAcceleration(gameState:GameState, dt:number) {
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

    function updateCamera(gameState:GameState, camera?:Camera) {
        // Placeholder for camera update logic based on player position and isCameraFollow state
        const cameraFollow = gameState.player.isCameraFollow;
        const playerPosition = gameState.player.position as THREE.Vector3;
        const prevPlayerPosition = (gameState.player.position as THREE.Vector3).clone();
       
        
        if (cameraFollow) {
            if (!camera) {
                console.warn('Camera is not available for follow logic');
                return null;
            }
            // Implement camera follow logic here, e.g. update camera position to match player position with some offset
            const prevPlayerPosition = (gameState.player.position as THREE.Vector3).clone();
            const delta=playerPosition.clone().sub(prevPlayerPosition);
            const newCameraPosition = camera.position.clone().add(delta);
            
            orbitControlsRef.current.target.add(delta); // Move the target of the orbit controls by the same delta to keep it centered on the player
            orbitControlsRef.current.
            camera.position.lerp(newCameraPosition, 0.1); // Smoothly interpolate to the desired position
            
            console.debug('Camera follow is enabled. Updating camera position to:', camera.position);
        } else {
            console.debug('Camera follow is disabled. Current player position:', playerPosition);
        }
        return null;
    }

    useFrame((state,dt) => {
        lastTimeRef.current = nowTimeRef.current;
        nowTimeRef.current = state.clock.getElapsedTime();
        const deltaTime = nowTimeRef.current - lastTimeRef.current;
        const targetFPS=1/60/1000;

        if (lastTimeRef.current === 0) return; // skip the first frame to avoid large dt
        if (nowTimeRef.current < lastTimeRef.current) return; // skip if time goes backwards (shouldn't happen but just in case)
        if (deltaTime < targetFPS) return; // skip if we're running faster than the target FPS

        handlePlayerInput(gameState.getState(), deltaTime);
        handlePlayerAcceleration(gameState.getState(), deltaTime);
        handlePlayerVelocity(gameState.getState(), deltaTime);
        handlePlayerPosition(gameState.getState(), deltaTime);
        handlePlayerRotation(gameState.getState(), deltaTime);
        updateCamera(gameState.getState(), camera);
    });

    return null;
}








    