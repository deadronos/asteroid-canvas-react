import { Canvas, ReactThreeFiber } from '@react-three/fiber';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import PlayerShip from './PlayerShip';
import Asteroid from './Asteroid';
import { GameContext } from '../App';
import HUD from './Hud';
import InputHandler from './InputHandler';
import '../styles.css';
import Systems from './Systems';
import * as THREE from 'three';


export default function Game() {
  const gameState = useContext(GameContext);
  const orbitControlsRef = React.useRef<OrbitControls>(null);

  if (!gameState) {
    return <div>Loading...</div>;
  }
  

  return (
    <div className="game-container">
        <HUD />
            <Canvas className="3d-scene" shadows={true} >            
                {/* 3D content goes here */}
                <OrbitControls ref={orbitControlsRef} makeDefault />
                <InputHandler />
                <Systems orbitControlsRef={orbitControlsRef} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <axesHelper args={[5]} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
                <PlayerShip />
            </Canvas>
    </div>
  );
}