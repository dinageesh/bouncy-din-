import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Play, RefreshCw, Trophy } from 'lucide-react';
import { GameState } from '../types';

interface HUDProps {
  score: number;
  lives: number;
  gameState: GameState;
  onStart: () => void;
}

export const HUD: React.FC<HUDProps> = ({ score, lives, gameState, onStart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 overflow-hidden">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-start gap-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-slate-900/40 backdrop-blur-md border-l-4 border-blue-500 rounded-r-2xl p-4 flex flex-col min-w-[140px] shadow-lg"
        >
          <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Score</span>
          <span className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
            {score.toLocaleString().padStart(6, '0')}
          </span>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex gap-3 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 shadow-lg"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < lives ? 1 : 0.7,
                opacity: i < lives ? 1 : 0.2,
                rotate: i < lives ? 0 : -20
              }}
              className="relative"
            >
              <Heart 
                className={`w-7 h-7 ${i < lives ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-600'}`} 
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Center Overlays */}
      <AnimatePresence mode="wait">
        {gameState === GameState.MENU && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -40 }}
            className="pointer-events-auto flex flex-col items-center gap-12 max-w-md w-full"
          >
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Trophy className="w-20 h-20 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)] mb-4" />
              </motion.div>
              <h1 className="text-7xl font-black text-white text-center tracking-[-0.05em] leading-[0.8] italic uppercase select-none">
                Bouncy<br/>
                <span className="text-blue-500 text-glow">Blast</span>
              </h1>
              <div className="h-px w-32 bg-slate-700 mt-6" />
              <p className="text-slate-400 text-center text-sm font-bold uppercase tracking-[0.2em] mt-2"> 
                Arcade Protocol v1.0 
              </p>
            </div>
            
            <button
              id="start-button-menu"
              onClick={onStart}
              className="group relative flex items-center justify-center gap-4 bg-white text-slate-950 font-black py-5 px-14 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <Play className="w-6 h-6 fill-current" />
              <span className="text-xl uppercase tracking-widest">Initialization</span>
              <div className="absolute inset-0 bg-blue-500 translate-y-[100%] group-hover:translate-y-[0] transition-transform duration-300 -z-10" />
            </button>
          </motion.div>
        )}

        {/* Launch Hint */}
        {gameState === GameState.PLAYING && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.6 }}
             className="flex flex-col items-center gap-2"
           >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-full"
              >
                <span className="text-white font-black uppercase tracking-[0.2em] text-xs">
                  Click to Launch Ball
                </span>
              </motion.div>
           </motion.div>
        )}

        {gameState === GameState.GAMEOVER && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-2xl border-2 border-red-500/50 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8"
          >
            <h2 className="text-7xl font-black text-red-500 uppercase tracking-tighter italic leading-none">Terminated</h2>
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-500 uppercase text-[10px] font-black tracking-[0.4em]">Final Data Score</span>
              <span className="text-6xl font-black text-white tracking-tight tabular-nums">{score}</span>
            </div>
            <button
              id="restart-button-gameover"
              onClick={onStart}
              className="group flex items-center gap-3 bg-red-500 hover:bg-red-400 text-white font-black py-5 px-12 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-500/20"
            >
              <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-lg uppercase tracking-widest">Reboot</span>
            </button>
          </motion.div>
        )}

        {gameState === GameState.LEVEL_COMPLETE && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-2xl border-2 border-emerald-500/50 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8"
          >
            <h2 className="text-7xl font-black text-emerald-400 uppercase tracking-tighter italic leading-none">Victory</h2>
            <div className="flex flex-col items-center gap-1">
              <span className="text-slate-500 uppercase text-[10px] font-black tracking-[0.4em]">Total Extraction Score</span>
              <span className="text-6xl font-black text-white tracking-tight tabular-nums">{score}</span>
            </div>
            <button
              id="next-level-button"
              onClick={onStart}
              className="flex items-center gap-4 bg-emerald-500 text-emerald-950 font-black py-5 px-14 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
            >
              <Play className="w-6 h-6 fill-current" />
              <span className="text-xl uppercase tracking-[0.2em]">Next Layer</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div className="w-full flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-slate-600 text-[10px] uppercase font-black tracking-[0.4em]">System Status: Nominal</span>
          <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
               animate={{ x: [-100, 100] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="h-full w-1/2 bg-blue-500/50" 
             />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
           <span className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em]">Subsurface Grid Enabled</span>
           <span className="text-slate-700 text-[9px] font-medium tracking-widest uppercase">2026-X.ARCADE.CORE</span>
        </div>
      </div>
    </div>
  );
};
