/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { GameCanvas } from './components/game/GameCanvas';
import { HUD } from './components/HUD';
import { GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const handleStartGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setLives(3);
  }, []);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const handleLivesUpdate = useCallback((newLives: number) => {
    setLives(newLives);
  }, []);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  return (
    <main id="app-container" className="w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <div className="w-full h-full max-w-5xl max-h-[800px] relative shadow-2xl overflow-hidden md:rounded-3xl border border-slate-800">
        <GameCanvas 
          gameState={gameState}
          onScoreUpdate={handleScoreUpdate}
          onLivesUpdate={handleLivesUpdate}
          onGameStateChange={handleGameStateChange}
        />
        <HUD 
          score={score}
          lives={lives}
          gameState={gameState}
          onStart={handleStartGame}
        />
      </div>
    </main>
  );
}

