import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ball, Brick, Particle, GameState } from '../../types';
import { 
  PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS, 
  BRICK_ROWS, BRICK_COLS, BRICK_GAP,
  INITIAL_BALL_SPEED, COLORS, SHAKE_INTENSITY 
} from '../../constants';
import confetti from 'canvas-confetti';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  gameState: GameState;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  onScoreUpdate, onLivesUpdate, onGameStateChange, gameState 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const paddleXRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const shakeRef = useRef(0);
  const frameRef = useRef(0);
  const isLaunchedRef = useRef(false);
  const currentSpeedRef = useRef(INITIAL_BALL_SPEED);

  const initBricks = useCallback((containerWidth: number) => {
    const bricks: Brick[] = [];
    const brickWidth = (containerWidth - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
    const brickHeight = 24;

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          id: `brick-${r}-${c}`,
          x: BRICK_GAP + c * (brickWidth + BRICK_GAP),
          y: BRICK_GAP + 80 + r * (brickHeight + BRICK_GAP),
          width: brickWidth,
          height: brickHeight,
          hp: 1,
          maxHp: 1,
          color: COLORS.BRICKS[r % COLORS.BRICKS.length]
        });
      }
    }
    return bricks;
  }, []);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: Math.random() * 0.4 + 0.3,
        color,
        size: Math.random() * 4 + 1
      });
    }
  };

  const spawnBall = (x: number, y: number) => {
    isLaunchedRef.current = false;
    currentSpeedRef.current = INITIAL_BALL_SPEED;
    ballsRef.current = [{
      id: Math.random().toString(36).substr(2, 9),
      x,
      y: y - 10,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: COLORS.BALL,
      trail: []
    }];
  };

  const launchBall = () => {
    if (isLaunchedRef.current || ballsRef.current.length === 0) return;
    isLaunchedRef.current = true;
    const ball = ballsRef.current[0];
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6 - Math.PI / 2; // Upwards
    ball.vx = Math.cos(angle) * currentSpeedRef.current;
    ball.vy = Math.sin(angle) * currentSpeedRef.current;
  };

  const resetGame = useCallback(() => {
    if (!containerRef.current) return;
    const { offsetWidth, offsetHeight } = containerRef.current;
    
    scoreRef.current = 0;
    livesRef.current = 3;
    onScoreUpdate(0);
    onLivesUpdate(3);
    
    paddleXRef.current = (offsetWidth - PADDLE_WIDTH) / 2;
    bricksRef.current = initBricks(offsetWidth);
    ballsRef.current = [];
    particlesRef.current = [];
    spawnBall(offsetWidth / 2, offsetHeight - 40 - PADDLE_HEIGHT);
  }, [initBricks, onScoreUpdate, onLivesUpdate]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && ballsRef.current.length === 0) {
      resetGame();
    }
  }, [gameState, resetGame]);

  const update = useCallback((canvas: HTMLCanvasElement) => {
    if (gameState !== GameState.PLAYING) return;

    const { width, height } = canvas;

    // Update Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      return p.life > 0;
    });

    // Update Balls
    ballsRef.current.forEach((ball, bIndex) => {
      if (!isLaunchedRef.current) {
        ball.x = paddleXRef.current + PADDLE_WIDTH / 2;
        ball.y = height - 40 - PADDLE_HEIGHT - ball.radius;
        return;
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Update Trail
      ball.trail.unshift({ x: ball.x, y: ball.y, opacity: 0.6 });
      if (ball.trail.length > 12) ball.trail.pop();
      ball.trail.forEach(t => t.opacity *= 0.85);

      // Wall Collision
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -1;
        shakeRef.current = 3;
        createParticles(ball.x, ball.y, ball.color, 3);
      } else if (ball.x + ball.radius > width) {
        ball.x = width - ball.radius;
        ball.vx *= -1;
        shakeRef.current = 3;
        createParticles(ball.x, ball.y, ball.color, 3);
      }

      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -1;
        shakeRef.current = 3;
        createParticles(ball.x, ball.y, ball.color, 3);
      }

      // Paddle Collision
      const paddleY = height - 40 - PADDLE_HEIGHT;
      if (
        ball.vy > 0 &&
        ball.y + ball.radius > paddleY &&
        ball.y + ball.radius < paddleY + PADDLE_HEIGHT &&
        ball.x > paddleXRef.current &&
        ball.x < paddleXRef.current + PADDLE_WIDTH
      ) {
        const hitPos = (ball.x - (paddleXRef.current + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const angle = hitPos * (Math.PI / 2.5) - Math.PI / 2;
        
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.y = paddleY - ball.radius;
        
        shakeRef.current = 4;
        createParticles(ball.x, ball.y, COLORS.PADDLE, 5);
      }

      // Brick Collision
      bricksRef.current.forEach((brick) => {
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          const dx = ball.x - (brick.x + brick.width / 2);
          const dy = ball.y - (brick.y + brick.height / 2);
          
          if (Math.abs(dx / brick.width) > Math.abs(dy / brick.height)) {
            ball.vx *= -1;
            ball.x += ball.vx > 0 ? 1 : -1;
          } else {
            ball.vy *= -1;
            ball.y += ball.vy > 0 ? 1 : -1;
          }

          brick.hp -= 1;
          scoreRef.current += 10;
          onScoreUpdate(scoreRef.current);
          shakeRef.current = 6;
          createParticles(ball.x, ball.y, brick.color, 10);
          
          // Speed up slightly
          currentSpeedRef.current = Math.min(INITIAL_BALL_SPEED * 2.5, currentSpeedRef.current + 0.1);
          const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          const ratio = currentSpeedRef.current / currentSpeed;
          ball.vx *= ratio;
          ball.vy *= ratio;

          if (bricksRef.current.filter(b => b.hp > 0).length === 0) {
             onGameStateChange(GameState.LEVEL_COMPLETE);
             confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
             });
          }
        }
      });

      bricksRef.current = bricksRef.current.filter(b => b.hp > 0);

      // Bottom Collision (Miss)
      if (ball.y + ball.radius > height) {
        ballsRef.current.splice(bIndex, 1);
        if (ballsRef.current.length === 0) {
          livesRef.current -= 1;
          onLivesUpdate(livesRef.current);
          if (livesRef.current <= 0) {
            onGameStateChange(GameState.GAMEOVER);
          } else {
            spawnBall(width / 2, height - 40 - PADDLE_HEIGHT);
          }
        }
      }
    });

    if (shakeRef.current > 0) {
      shakeRef.current -= 0.5;
    }
  }, [gameState, onScoreUpdate, onLivesUpdate, onGameStateChange]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    ctx.save();
    if (shakeRef.current > 0) {
      const sx = (Math.random() - 0.5) * shakeRef.current * SHAKE_INTENSITY;
      const sy = (Math.random() - 0.5) * shakeRef.current * SHAKE_INTENSITY;
      ctx.translate(sx, sy);
    }

    // Draw Bricks
    bricksRef.current.forEach(brick => {
      ctx.fillStyle = brick.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Gloss effect
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 2);
    });

    // Draw Paddle
    const gradient = ctx.createLinearGradient(paddleXRef.current, 0, paddleXRef.current + PADDLE_WIDTH, 0);
    gradient.addColorStop(0, COLORS.PADDLE);
    gradient.addColorStop(0.5, '#60a5fa');
    gradient.addColorStop(1, COLORS.PADDLE);
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.PADDLE;
    ctx.beginPath();
    ctx.roundRect(paddleXRef.current, height - 40 - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Balls & Trails
    ballsRef.current.forEach(ball => {
      // Trail
      ball.trail.forEach((t, i) => {
        ctx.globalAlpha = t.opacity;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * (1 - i / ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Ball
      ctx.fillStyle = ball.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }, []);

  const loop = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        update(canvasRef.current);
        draw(ctx);
      }
    }
    frameRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [loop]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      paddleXRef.current = Math.max(0, Math.min(rect.width - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      paddleXRef.current = Math.max(0, Math.min(rect.width - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    };

    const handleClick = () => {
      if (gameState === GameState.PLAYING && !isLaunchedRef.current) {
        launchBall();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchstart', handleClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleClick);
    };
  }, [gameState]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        canvasRef.current.width = offsetWidth;
        canvasRef.current.height = offsetHeight;
        if (bricksRef.current.length === 0) {
           bricksRef.current = initBricks(offsetWidth);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initBricks]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden cursor-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
