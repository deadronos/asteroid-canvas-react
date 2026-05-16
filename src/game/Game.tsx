import { Canvas, ReactThreeFiber } from '@react-three/fiber';
import React from 'react';
import { OrbitControls, Stars } from '@react-three/drei';



export default function Game() {
  return (
    <div className="game-container">
        <h1 className="game-title">Game Component</h1>
        <Canvas className="3d-scene" shadows={true} >            
            {/* 3D content goes here */}
            <OrbitControls />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <axesHelper args={[5]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
            <mesh>
                <boxGeometry args={[1, 1, 10]} />
                <meshPhysicalMaterial color="orange" />
            </mesh>
        </Canvas>
    </div>
  );
}