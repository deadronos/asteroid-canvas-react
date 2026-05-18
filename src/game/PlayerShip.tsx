import { useStore } from "zustand";
import { GameContext } from "../App";
import { JSX, useContext, useRef } from "react";
import * as THREE from 'three';
import { useFrame } from "@react-three/fiber";

export default function PlayerShip() {
    const gameState = useContext(GameContext);
    const meshRef = useRef<THREE.Group>(null);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    const player = useStore(gameState, (state) => state.player);
    const position = useStore(gameState, (state) => state.player.position) as THREE.Vector3;
    const pitch = useStore(gameState, (state) => state.player.pitch);
    const roll = useStore(gameState, (state) => state.player.roll);
    const yaw = useStore(gameState, (state) => state.player.yaw);
    const rotation = new THREE.Euler(pitch, yaw, roll);
    

    useFrame(() => {
        meshRef.current?.position.copy(position);
        meshRef.current?.rotation.copy(rotation);
    });

    return (
        <group ref={meshRef} position={position} rotation={rotation}>
            <mesh position={[0, 0, -1.25]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.3, 0.5]} />
                {player.isIdle ? <meshStandardMaterial color="yellow" /> : <meshStandardMaterial color="yellow" />}
            </mesh>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 0.5, 2]} />
                {player.isIdle ? <meshStandardMaterial color="blue" /> : <meshStandardMaterial color="purple" />}
            </mesh>
        </group>
    );
}