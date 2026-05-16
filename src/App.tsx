import { useWorld } from 'koota/react';
import Game from './game/Game';
import { WorldProvider } from 'koota/react';
import { createWorld } from 'koota';


const world=createWorld();

export default function App() {
  return (
    <WorldProvider world={world}>
      <Game className="root" />
    </WorldProvider>
  );
}