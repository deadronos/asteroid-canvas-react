import React, { useContext, useRef, useState, useEffect, useMemo } from 'react';
import { GameContext } from '../App';
import { useFrame, useThree } from "@react-three/fiber";
import { GameState } from './types';
import * as THREE from 'three';
import { Camera } from 'three';
import { useStore } from 'zustand';
import * as DREI from '@react-three/drei';

export default function Systems() {
    const [debug, setDebug] = useState(false);
    const gameState = useContext(GameContext);
    const lastTimeRef = useRef(0);
    const nowTimeRef = useRef(0);
    const { camera, controls } = useThree();
    const [updateCameraFlag, setUpdateCameraFlag] = useState(false);
    const [delta, setDelta] = useState(new THREE.Vector3(0, 0, 0));
    const [prevPlayerPosition, setPrevPlayerPosition] = useState(new THREE.Vector3(0, 0, 0));
    const [deltaTime, setDeltaTime] = useState(0);

    if (!gameState) {
        return <div>Loading...</div>;
    }

   /* function handlePlayerInput(gameState:GameState, dt:number) {
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
        const newAcceleration = (gameState.player.acceleration as THREE.Vector3).clone().add(transformedAcceleration);
        gameState.updatePlayerAcceleration(newAcceleration);

        if (inputState.cameraFollowToggle) {
            gameState.toggleCameraFollow();
        }

        if (inputState.pointerLocked) {
            gameState.toggleIsPointerLocked();
        }



    } */

    function handlePlayerInput(gameState: GameState, dt: number) {
        const inputState = gameState.inputState;
        const player = gameState.player; // Assuming player has .quaternion, .acceleration, etc.

        // --- 1. HANDLE ROTATION (Pitch, Yaw, Roll) ---
        // Values from your mouse move listeners / mouse sensitivity
        if (inputState.pointerLocked) {
            // Pointer locked, quaternion controls are active
        
            const mouseSensitivity = 0.05;
            const rollSpeed = 1.5; // Radians per second

            const pitchTarget = inputState.mouseDeltaY * mouseSensitivity * dt;
            const yawTarget = inputState.mouseDeltaX * mouseSensitivity * dt;
            let rollTarget = 0;

            if (inputState.rollLeft) rollTarget += rollSpeed * dt;  // Q key
            if (inputState.rollRight) rollTarget -= rollSpeed * dt; // E key

            // Create local rotations based on the ship's current internal axes
            const localPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchTarget);
            const localYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawTarget);
            const localRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollTarget);

            // Multiply them directly into the player's current quaternion orientation
            // Note: order matters! This rotates them relative to their CURRENT local orientation.
            player.quaternion.multiply(localPitch);
            player.quaternion.multiply(localYaw);
            player.quaternion.multiply(localRoll);
            player.quaternion.normalize(); // Prevent floating-point drift

            // Reset mouse deltas so they don't loop forever
            inputState.mouseDeltaX = 0;
            inputState.mouseDeltaY = 0;
        } else {
            // Pointer not locked, no quaternion input controls
        }

        // --- 2. HANDLE TRANSLATION (Thrust) ---
        const accelerationMagnitude = 0.1; 
        const thrustDirection = new THREE.Vector3(0, 0, 0);

        // Instead of creating 6 separate vectors, we create 1 combined local direction vector
        if (inputState.forward)  thrustDirection.z -= 1; // In Three.js, -Z is forward
        if (inputState.backward) thrustDirection.z += 1;
        if (inputState.right)    thrustDirection.x += 1;
        if (inputState.left)     thrustDirection.x -= 1;
        if (inputState.up)       thrustDirection.y += 1;
        if (inputState.down)     thrustDirection.y -= 1;

        const transformedAcceleration = new THREE.Vector3(0, 0, 0);

        if (thrustDirection.lengthSq() > 0) {
            // Normalize the combined input direction first so diagonals aren't faster
            thrustDirection.normalize();
            
            // Rotate the final thrust vector by the player's orientation quaternion
            transformedAcceleration.copy(thrustDirection).applyQuaternion(player.quaternion);
            transformedAcceleration.multiplyScalar(accelerationMagnitude);
        }

        // Accumulate or set acceleration
        const newAcceleration = (player.acceleration as THREE.Vector3).clone().add(transformedAcceleration);
        gameState.updatePlayerAcceleration(newAcceleration);


        // --- 3. UI & SYSTEM TOGGLES ---
        if (inputState.cameraFollowToggle) gameState.toggleCameraFollow();
        if (inputState.pointerLocked)      gameState.toggleIsPointerLocked();
    }

    function handlePlayerAcceleration(gameState:GameState, dt:number) {
       if (debug) console.debug('Handling player acceleration with dt:', dt, 'Acceleration:', gameState.player.acceleration);
    }

    function handlePlayerVelocity(gameState:GameState, dt:number) {
        const currentVelocity = gameState.player.velocity as THREE.Vector3;
        const currentAcceleration = gameState.player.acceleration as THREE.Vector3;
        const newVelocity = currentVelocity.clone().add(currentAcceleration.clone().multiplyScalar(dt));
        gameState.updatePlayerVelocity(newVelocity);
    }

    function handlePlayerPosition(gameState:GameState, dt:number) {
        const currentPosition = gameState.player.position as THREE.Vector3;
        const currentVelocity = gameState.player.velocity as THREE.Vector3;
        const newPosition = currentPosition.clone().add(currentVelocity.clone().multiplyScalar(dt));
        gameState.updatePlayerPosition(newPosition);
    }

    function handlePlayerRotation(gameState:GameState, dt:number) {
        // Placeholder for rotation logic

    }

    function updateCamera(gameState:GameState, state:RootState, dt:number) {
        // Placeholder for camera update logic based on player position and isCameraFollow state
        const cameraFollow = gameState.player.isCameraFollow;
        const playerPosition = gameState.player.position as THREE.Vector3;
        
        

        
        if (cameraFollow) {
            playerPosition.copy(gameState.player.position as THREE.Vector3);
            if (prevPlayerPosition.length() === 0) {
                setPrevPlayerPosition(playerPosition.clone());
            } else {
                /* if(prevPlayerPosition.equals(playerPosition)){
                    console.debug('Player position has not changed since last frame, skipping camera update. Player position:', playerPosition);
                    return;
                }else{
                    if(prevPlayerPosition.clone().sub(playerPosition).length() < 1){
                        console.debug('Player position change is very small, skipping camera update. Player position:', playerPosition);
                        return;
                    }
                } */

                console.debug('Camera follow is enabled. Scheduling camera update. Current player position:', playerPosition);
                const newDelta = playerPosition.clone().sub(prevPlayerPosition);
                setDelta(newDelta);
                setDeltaTime(dt);
                setUpdateCameraFlag(true);
            }
        } else {
            console.debug('Camera follow is disabled. Current player position:', playerPosition);
        }
        return null;
    }

    useEffect(()=>{
        if (updateCameraFlag) {
            console.debug('Consuming scheduled camera update');
            if(controls){
                console.debug('inside camera update, applying delta to camera position. Delta:', delta);
                const cameraControls=(controls as DREI.CameraControls);
                if(deltaTime < 0.001) {
                    console.debug('Delta time is very small, skipping camera update to avoid jitter. Delta time:', deltaTime);
                    return;
                }
                if (cameraControls) {
                    console.debug('Camera controls found, applying delta');
                    const currentTarget = cameraControls.getTarget(new THREE.Vector3());
                    const newTarget = currentTarget.add(delta);
                    const currentCameraPosition = cameraControls.getPosition(new THREE.Vector3());
                    const newCameraPosition = currentCameraPosition.add(delta);
                    cameraControls.setLookAt(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z, newTarget.x, newTarget.y, newTarget.z);
                    
                }else{
                    console.debug('Camera controls not found, cannot apply delta');
                    
                }
                setPrevPlayerPosition((gameState.getState().player.position as THREE.Vector3).clone());
                console.debug('updated Prev Player Position to:', gameState.getState().player.position);
            }
            setUpdateCameraFlag(false);
        } else {
            if (debug) console.debug('No camera update scheduled');
        }
        return () =>{
            console.debug('Cleaning up Systems useEffect');
        }
    }, [updateCameraFlag, delta, controls, gameState]);

    useFrame((state,dt) => {
        lastTimeRef.current = nowTimeRef.current;
        nowTimeRef.current = state.clock.getElapsedTime();
        const deltaTime = nowTimeRef.current - lastTimeRef.current;
        const targetFPS = 1/60; // target 60 FPS = ~0.0167 seconds

        if (lastTimeRef.current === 0) return; // skip the first frame to avoid large dt
        if (nowTimeRef.current < lastTimeRef.current) return; // skip if time goes backwards (shouldn't happen but just in case)
        if (deltaTime < targetFPS * 0.5) return; // skip if dt is too small (less than half the target frame time) to avoid unnecessary updates

        handlePlayerInput(gameState.getState(), deltaTime);
        handlePlayerAcceleration(gameState.getState(), deltaTime);
        handlePlayerVelocity(gameState.getState(), deltaTime);
        handlePlayerPosition(gameState.getState(), deltaTime);
        handlePlayerRotation(gameState.getState(), deltaTime);
        updateCamera(gameState.getState(), state, deltaTime);

        return null;
    });

    return null;
}








    