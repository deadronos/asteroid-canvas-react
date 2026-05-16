import { useWorld } from 'koota/react';
import Game from './game/Game';
import { WorldProvider } from 'koota/react';


const world=useWorld();

export default function App() {
  return (
    <WorldProvider world={world}>
      <Game />
    </WorldProvider>
  );
}