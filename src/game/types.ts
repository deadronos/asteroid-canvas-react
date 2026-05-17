import { ReactThreeFiber } from '@react-three/fiber';


export type Vec3 = ReactThreeFiber.Vector3;

export type GameStateType = {
    isRunning: boolean;
    score: number;
    player: PlayerStateType;
    asteroids: AsteroidStateType[];
    bullets: BulletStateType[];
}

export type PlayerStateType = {
    id: number;
    position: Vec3;
    velocity: Vec3;
    isAlive: boolean;
    health: {
        current: number;
        max: number;
    };
}

export type AsteroidStateType = {
    id: number;
    position: Vec3;
    velocity: Vec3;
    radius: number;
    isAlive: boolean;
    health: {
        current: number;
        max: number;
    };
}

export type BulletStateType = {
    id: number;
    position: Vec3;
    velocity: Vec3;
    isAlive: boolean;
    damage: number;
    radius: number;
    firedBy: number; // Player ID who fired the bullet
}


