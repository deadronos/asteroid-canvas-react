import { ReactThreeFiber } from '@react-three/fiber';
import { createStore } from 'zustand';
import * as THREE from 'three';

export type Vec3 = ReactThreeFiber.Vector3;

interface Player {
    id: number; // Unique identifier for the player
    isIdle: boolean; // Whether the player is currently idle (not moving)
    isPointerLocked: boolean; // Whether the pointer is locked for camera control
    position: Vec3;
    velocity: Vec3; // per second
    acceleration: Vec3; // per second squared
    quaternion: THREE.Quaternion; // For representing rotation in 3D space
    health: HealthProps;
    isCameraFollow: boolean;  // Whether the camera is following the player
    meshRef: THREE.Mesh | null;  // Reference to the player's mesh for rendering
}

interface HealthProps {
    current: number;
    max: number;
}

interface Asteroid {
    id: number; // Unique identifier for the asteroid
    position: Vec3;
    velocity: Vec3;
    size: number;
    health: HealthProps;
    meshRef: THREE.Mesh | null;  // Reference to the asteroid's mesh for rendering
}

interface GameStateProps {
    isRunning: boolean;
    score: number;
    inputState: InputState;
    player: Player;
    asteroids: Asteroid[];
    
}

export interface InputState {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        up: boolean;
        down: boolean;
        rollLeft: boolean;
        rollRight: boolean;
        pitchUp: boolean;
        pitchDown: boolean;
        yawLeft: boolean;
        yawRight: boolean;
        cameraFollowToggle: boolean;
        pointerLocked: boolean;
        mouseDeltaX: number;
        mouseDeltaY: number;
};

export interface GameState extends GameStateProps {
    setIsRunning: (isRunning: boolean) => void;
    toggleIsRunning: () => void;
    setScore: (score: number) => void;
    incrementScore: (amount: number) => void;
    setInputState: (inputState: InputState) => void;
    setPlayer: (player: Player) => void;
    setAsteroids: (asteroids: Asteroid[]) => void;
    spawnAsteroid: (asteroid: Asteroid) => void;
    toggleCameraFollow: () => void;
    toggleIsPointerLocked: () => void;
    updatePlayerPosition: (position: Vec3) => void;
    updatePlayerVelocity: (velocity: Vec3) => void;
    updatePlayerAcceleration: (acceleration: Vec3) => void;
    updatePlayerQuaternion: (quaternion: THREE.Quaternion) => void;
    damagePlayer: (amount: number) => void;
    damageAsteroid: (id: number, amount: number) => void;
}


export type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (initProps?: Partial<GameStateProps>) => {
    const DEFAULT_PROPS: GameStateProps = {
        isRunning: false,
        score: 0,
        inputState: {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            rollLeft: false,
            rollRight: false,
            pitchUp: false,
            pitchDown: false,
            yawLeft: false,
            yawRight: false,
            cameraFollowToggle: false,
            pointerLocked: false,
            mouseDeltaX: 0,
            mouseDeltaY: 0,
        },
        player: {
            id: 1,
            isIdle: true,
            isCameraFollow: true,
            isPointerLocked: false,
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, 0, 0),
            quaternion: new THREE.Quaternion(), // Default orientation
            health: {
                current: 100,
                max: 100,
            },
            meshRef: null,
        },
        asteroids: [],
    }
    return createStore<GameState>()((set) => ({
        ...DEFAULT_PROPS,  
        ...initProps,  // Override defaults with any provided initial properties
        setIsRunning: (isRunning) => set({ isRunning }),
        toggleIsRunning: () => set((state) => ({ isRunning: !state.isRunning })),
        setScore: (score) => set({ score }),
        incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
        setPlayer: (player) => set({ player }),
        setAsteroids: (asteroids) => set({ asteroids }),
        setInputState: (inputState) => set({ inputState }),
        spawnAsteroid: (asteroid) => set((state) => ({ asteroids: [...state.asteroids, asteroid] })),
        toggleCameraFollow: () => set((state) => ({ player: { ...state.player, isCameraFollow: !state.player.isCameraFollow } })), // Example of toggling camera follow on the player state
        toggleIsPointerLocked: () => set((state) => ({ player: { ...state.player, isPointerLocked: !state.player.isPointerLocked } })),
        updatePlayerPosition: (position) => set((state) => ({ player: { ...state.player, position } })),
        updatePlayerVelocity: (velocity) => set((state) => ({ player: { ...state.player, velocity } })),
        updatePlayerAcceleration: (acceleration) => set((state) => ({ player: { ...state.player, acceleration } })),
        updatePlayerQuaternion: (quaternion) => set((state) => ({ player: { ...state.player, quaternion } })),
        damagePlayer: (amount) => set((state) => ({ player: { ...state.player, health: { ...state.player.health, current: Math.max(state.player.health.current - amount, 0) } } })),
        damageAsteroid: (id, amount) => set((state) => ({
            asteroids: state.asteroids.map((asteroid) =>
                asteroid.id === id
                    ? { ...asteroid, health: { ...asteroid.health, current: Math.max(asteroid.health.current - amount, 0) } }
                    : asteroid
            )
        })),
    }))
}