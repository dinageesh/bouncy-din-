/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/game/GameCanvas';
import { HUD } from './components/HUD';
import { GameState } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('bouncy-blast-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const handleStartGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setLives(3);
    setLevel(1);
  }, []);

  const handleNextLevel = useCallback(() => {
    setGameState(GameState.PLAYING);
    setLevel(prev => prev + 1);
  }, []);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('bouncy-blast-highscore', newScore.toString());
    }
  }, [highScore]);

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
          level={level}
          onScoreUpdate={handleScoreUpdate}
          onLivesUpdate={handleLivesUpdate}
          onGameStateChange={handleGameStateChange}
        />
        <HUD 
          score={score}
          highScore={highScore}
          lives={lives}
          level={level}
          gameState={gameState}
          onStart={handleStartGame}
          onNextLevel={handleNextLevel}
        />
      </div>
    </main>
  );
}

