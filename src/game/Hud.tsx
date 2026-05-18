import { useContext } from "react";
import { GameContext } from "../App";
import { useStore } from "zustand";
import * as THREE from 'three';
import { Vec3 } from "./types";





export default function HUD() {
    const gameState = useContext(GameContext);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    const score = useStore(gameState, (state) => state.score);
    const player = useStore(gameState, (state) => state.player);
    const position:THREE.Vector3 = useStore(gameState, (state) => state.player.position)as THREE.Vector3;
    const velocity:THREE.Vector3 = useStore(gameState, (state) => state.player.velocity)as THREE.Vector3;
    const acceleration:THREE.Vector3 = useStore(gameState, (state) => state.player.acceleration)as THREE.Vector3;
    const pitch = useStore(gameState, (state) => state.player.pitch);
    const roll = useStore(gameState, (state) => state.player.roll);
    const yaw = useStore(gameState, (state) => state.player.yaw);
    
    function RadiansToDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }
    
    return (
        <>
        <div className="hud">
            <p>Score: {score}</p>
            <p>Health: {player.health.current}%</p>
        </div>
        <div className="hud-right-player-info">
            <p>Position: {`(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`}</p>
            <p>Velocity: {`(${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)})`}</p>
            <p>Acceleration: {`(${acceleration.x.toFixed(2)}, ${acceleration.y.toFixed(2)}, ${acceleration.z.toFixed(2)})`}</p>
            <p>Pitch: {RadiansToDegrees(pitch).toFixed(2)}</p>
            <p>Roll: {RadiansToDegrees(roll).toFixed(2)}</p>
            <p>Yaw: {RadiansToDegrees(yaw).toFixed(2)}</p>
        </div>
        </>
    );
}