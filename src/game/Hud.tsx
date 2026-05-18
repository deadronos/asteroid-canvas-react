import { useContext } from "react";
import { GameContext } from "../App";
import { useStore } from "zustand";





export default function HUD() {
    const gameState = useContext(GameContext);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    const score = useStore(gameState, (state) => state.score);
    const player = useStore(gameState, (state) => state.player);

    return (
        <div className="hud">
            <p>Score: {score}</p>
            <p>Health: {player.health.current}%</p>
        </div>
    );
}