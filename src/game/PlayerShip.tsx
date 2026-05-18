import { useStore } from "zustand";
import { GameContext } from "../App";
import { JSX, useContext,useRef } from "react";
import { Vec3 } from "./types";
import * as THREE from 'three';
import { useFrame } from "@react-three/fiber";

export default function PlayerShip() {
    const gameState = useContext(GameContext);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    const  player = useStore(gameState, (state) => state.player);
    const  meshRef= useRef<THREE.Mesh>(null);
    const  position:THREE.Vector3 = useStore(gameState, (state) => state.player.position)as THREE.Vector3;  
    const  rotation:THREE.Euler = new THREE.Euler(player.pitch, player.yaw, player.roll);
    useFrame((state,dt) => {
        meshRef.current?.position.copy(position);
        meshRef.current?.rotation.copy(rotation);
        // Placeholder    
    });

    interface ShipMeshProps {
        position: THREE.Vector3;
        rotation: THREE.Euler;
    }

    function ShipMesh({ position, rotation }: ShipMeshProps): JSX.Element {
        const forwardVector = new THREE.Vector3(0, 0, -1).applyEuler(rotation);
        const bridgePosition = position.clone().add(forwardVector.clone().multiplyScalar(1));

        const bridgeRotation = new THREE.Euler(rotation.x, rotation.y, rotation.z);
        const bridgeSize = new THREE.Vector3(0.5, 0.2, 0.5);
        const hullSize = new THREE.Vector3(1, 0.5, 2);
        const hullPosition = position.clone().add(forwardVector.clone().multiplyScalar(0));
        const hullRotation = new THREE.Euler(rotation.x, rotation.y, rotation.z);

        return (
            <group ref={meshRef} position={position} rotation={rotation}>
                <mesh position={bridgePosition} rotation={bridgeRotation} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 0.3, 1]} />
                    {player.isIdle ? <meshStandardMaterial color="yellow" /> : <meshStandardMaterial color="red" />}
                </mesh>
                <mesh position={hullPosition} rotation={hullRotation} castShadow receiveShadow>
                    <boxGeometry args={[1, 0.5, 2]} />
                    {player.isIdle ? <meshStandardMaterial color="blue" /> : <meshStandardMaterial color="red" />}
                </mesh>
            </group>
        );    
    }
    

    return (
        <ShipMesh position={position} rotation={rotation} />
    );
}