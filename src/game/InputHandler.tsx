import { useContext } from "react";
import { GameContext } from "../App";
import { updateCamera } from "@react-three/fiber/dist/declarations/src/core/utils";
import { useStore } from "zustand";



export default function InputHandler() {
    const gameState = useContext(GameContext);


    const handleKeyDown = (event: KeyboardEvent) => {
        if (!gameState) return;
        const { player } = gameState.getState();
        const updatePlayerAcceleration = useStore(gameState, (state) => state.updatePlayerAcceleration);

        switch (event.code) {
            case 'KeyW':
                player.isIdle = false;
                player.acceleration= [0, 0, -0.1];
                updatePlayerAcceleration(player.acceleration);
                break;
            case 'KeyS':
                player.isIdle = false;
                player.acceleration= [0, 0, 0.1];
                updatePlayerAcceleration(player.acceleration);
                break;
            case 'KeyA':
                player.isIdle = false;
                player.acceleration= [-0.1, 0, 0];
                updatePlayerAcceleration(player.acceleration); 
                break;
            case 'KeyD':
                player.isIdle = false;
                player.acceleration= [0.1, 0, 0];
                updatePlayerAcceleration(player.acceleration);
                break;
            default:
                break;
        }
    };

    return null;
}