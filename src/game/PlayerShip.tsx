import { useStore } from "zustand";
import { GameContext } from "../App";
import { useContext } from "react";
import { Vec3 } from "./types";
import { useFrame } from "@react-three/fiber";

export default function PlayerShip() {
    const gameState = useContext(GameContext);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    const  player = useStore(gameState, (state) => state.player);
    const  meshRef= useStore(gameState, (state) => state.player.meshRef);
    const updatePlayerVelocity = useStore(gameState, (state) => state.updatePlayerVelocity);
    const updatePlayerPosition = useStore(gameState, (state) => state.updatePlayerPosition);
    const updatePlayerAcceleration = useStore(gameState, (state) => state.updatePlayerAcceleration);
    const acceleration = useStore(gameState, (state) => state.player.acceleration) as Vec3;
    const velocity = useStore(gameState, (state) => state.player.velocity) as Vec3;
    const position = useStore(gameState, (state) => state.player.position) as Vec3;

    useFrame(() => {
        if (player.isIdle) return; // if player is idle, skip updating position and rotation
        updatePlayerVelocity(
        

        if (meshRef) {
            meshRef.position.set(player.position.x, player.position.y, player.position.z);
            meshRef.rotation.set(player.pitch, player.yaw, player.roll);
        }
    });
    

    return (
        <mesh ref={meshRef} position={player.position as Vec3} rotation={[player.pitch, player.yaw, player.roll]}>
            <boxGeometry args={[1, 0.5, 2]} />
            {player.isIdle ? <meshStandardMaterial color="blue" /> : <meshStandardMaterial color="red" />}
        </mesh>    
    );
}