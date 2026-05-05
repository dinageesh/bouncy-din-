export enum PowerUpType {
  MULTIBALL = 'MULTIBALL',
  EXPAND_PADDLE = 'EXPAND_PADDLE',
  SLOW_MOTION = 'SLOW_MOTION',
  LASER = 'LASER'
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  color: string;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  trail: { x: number; y: number; opacity: number }[];
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}
