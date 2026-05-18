import { ReactThreeFiber } from '@react-three/fiber';
import { createStore } from 'zustand';
import * as THREE from 'three';

export type Vec3 = ReactThreeFiber.Vector3;

interface Player {
    id: number; // Unique identifier for the player
    isIdle: boolean; // Whether the player is currently idle (not moving)
    position: Vec3;
    velocity: Vec3; // per second
    acceleration: Vec3; // per second squared
    pitch: number;  // Rotation around the X-axis
    roll: number;  // Rotation around the Z-axis
    yaw: number;  // Rotation around the Y-axis
    health: HealthProps;
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
    player: Player;
    asteroids: Asteroid[];
}

export interface GameState extends GameStateProps {
    setIsRunning: (isRunning: boolean) => void;
    toggleIsRunning: () => void;
    setScore: (score: number) => void;
    incrementScore: (amount: number) => void;
    setPlayer: (player: Player) => void;
    setAsteroids: (asteroids: Asteroid[]) => void;
    spawnAsteroid: (asteroid: Asteroid) => void;
    updatePlayerPosition: (position: Vec3) => void;
    updatePlayerVelocity: (velocity: Vec3) => void;
    updatePlayerAcceleration: (acceleration: Vec3) => void;
    updatePlayerRotation: (pitch: number, roll: number, yaw: number) => void;
    damagePlayer: (amount: number) => void;
    damageAsteroid: (id: number, amount: number) => void;
}


export type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (initProps?: Partial<GameStateProps>) => {
    const DEFAULT_PROPS: GameStateProps = {
        isRunning: false,
        score: 0,
        player: {
            id: 1,
            isIdle: true,
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, 0, 0),
            pitch: 0,
            roll: 0,
            yaw: 0,
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
        spawnAsteroid: (asteroid) => set((state) => ({ asteroids: [...state.asteroids, asteroid] })),
        updatePlayerPosition: (position) => set((state) => ({ player: { ...state.player, position } })),
        updatePlayerVelocity: (velocity) => set((state) => ({ player: { ...state.player, velocity } })),
        updatePlayerAcceleration: (acceleration) => set((state) => ({ player: { ...state.player, acceleration } })),
        updatePlayerRotation: (pitch, roll, yaw) => set((state) => ({ player: { ...state.player, pitch, roll, yaw } })),
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