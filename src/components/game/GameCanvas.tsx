import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ball, Brick, Particle, GameState, PowerUp, PowerUpType } from '../../types';
import { 
  PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS, 
  BRICK_ROWS, BRICK_COLS, BRICK_GAP,
  INITIAL_BALL_SPEED, COLORS, SHAKE_INTENSITY,
  POWER_UP_WIDTH, POWER_UP_HEIGHT, POWER_UP_SPEED
} from '../../constants';
import confetti from 'canvas-confetti';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onGameStateChange: (state: GameState) => void;
  gameState: GameState;
  level: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  onScoreUpdate, onLivesUpdate, onGameStateChange, gameState, level
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const paddleXRef = useRef(0);
  const paddleWidthRef = useRef(PADDLE_WIDTH);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const shakeRef = useRef(0);
  const frameRef = useRef(0);
  const isLaunchedRef = useRef(false);
  const currentSpeedRef = useRef(INITIAL_BALL_SPEED);

  const initBricks = useCallback((containerWidth: number) => {
    const bricks: Brick[] = [];
    const currentCols = BRICK_COLS;
    const currentRows = BRICK_ROWS + Math.min(level - 1, 3);
    const brickWidth = (containerWidth - (currentCols + 1) * BRICK_GAP) / currentCols;
    const brickHeight = 24;

    for (let r = 0; r < currentRows; r++) {
      for (let c = 0; c < currentCols; c++) {
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
  }, [level]);

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

  const spawnBall = (x: number, y: number, vx: number = 0, vy: number = 0) => {
    const newBall: Ball = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx,
      vy,
      radius: BALL_RADIUS,
      color: COLORS.BALL,
      trail: []
    };
    ballsRef.current.push(newBall);
    return newBall;
  };

  const launchBall = () => {
    if (isLaunchedRef.current || ballsRef.current.length === 0) return;
    isLaunchedRef.current = true;
    const ball = ballsRef.current[0];
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6 - Math.PI / 2;
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
    paddleWidthRef.current = PADDLE_WIDTH;
    bricksRef.current = initBricks(offsetWidth);
    ballsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    spawnBall(offsetWidth / 2, offsetHeight - 40 - PADDLE_HEIGHT - BALL_RADIUS);
    isLaunchedRef.current = false;
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

    // Update PowerUps
    powerUpsRef.current = powerUpsRef.current.filter(pu => {
      pu.y += POWER_UP_SPEED;
      
      // Collection
      const paddleY = height - 40 - PADDLE_HEIGHT;
      if (
        pu.y + POWER_UP_HEIGHT > paddleY &&
        pu.y < paddleY + PADDLE_HEIGHT &&
        pu.x + POWER_UP_WIDTH > paddleXRef.current &&
        pu.x < paddleXRef.current + paddleWidthRef.current
      ) {
        // Activate PowerUp
        switch (pu.type) {
          case PowerUpType.MULTIBALL:
            ballsRef.current.slice().forEach(b => {
              spawnBall(b.x, b.y, b.vx * -0.8, b.vy);
              spawnBall(b.x, b.y, b.vx, b.vy * -0.8);
            });
            break;
          case PowerUpType.EXPAND_PADDLE:
            paddleWidthRef.current = Math.min(width * 0.4, paddleWidthRef.current + 40);
            setTimeout(() => { paddleWidthRef.current = Math.max(PADDLE_WIDTH, paddleWidthRef.current - 40); }, 10000);
            break;
          case PowerUpType.SLOW_MOTION:
            currentSpeedRef.current *= 0.5;
            setTimeout(() => { currentSpeedRef.current *= 2; }, 5000);
            break;
        }
        createParticles(pu.x + POWER_UP_WIDTH/2, pu.y + POWER_UP_HEIGHT/2, pu.color, 15);
        shakeRef.current = 5;
        return false;
      }

      return pu.y < height;
    });

    // Update Balls
    ballsRef.current.forEach((ball, bIndex) => {
      if (!isLaunchedRef.current) {
        ball.x = paddleXRef.current + paddleWidthRef.current / 2;
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
        shakeRef.current = 2;
        createParticles(ball.x, ball.y, ball.color, 3);
      } else if (ball.x + ball.radius > width) {
        ball.x = width - ball.radius;
        ball.vx *= -1;
        shakeRef.current = 2;
        createParticles(ball.x, ball.y, ball.color, 3);
      }

      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -1;
        shakeRef.current = 2;
        createParticles(ball.x, ball.y, ball.color, 3);
      }

      // Paddle Collision
      const paddleY = height - 40 - PADDLE_HEIGHT;
      if (
        ball.vy > 0 &&
        ball.y + ball.radius > paddleY &&
        ball.y + ball.radius < paddleY + PADDLE_HEIGHT &&
        ball.x > paddleXRef.current &&
        ball.x < paddleXRef.current + paddleWidthRef.current
      ) {
        const hitPos = (ball.x - (paddleXRef.current + paddleWidthRef.current / 2)) / (paddleWidthRef.current / 2);
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
            ball.x += ball.vx > 0 ? 2 : -2;
          } else {
            ball.vy *= -1;
            ball.y += ball.vy > 0 ? 2 : -2;
          }

          brick.hp -= 1;
          scoreRef.current += 10;
          onScoreUpdate(scoreRef.current);
          shakeRef.current = 6;
          createParticles(ball.x, ball.y, brick.color, 10);
          
          // Spawn PowerUp
          if (Math.random() < 0.15) {
            const types = [PowerUpType.MULTIBALL, PowerUpType.EXPAND_PADDLE, PowerUpType.SLOW_MOTION];
            const type = types[Math.floor(Math.random() * types.length)];
            powerUpsRef.current.push({
              id: Math.random().toString(),
              x: brick.x + brick.width / 2 - POWER_UP_WIDTH / 2,
              y: brick.y,
              type,
              color: COLORS.POWER_UPS[type as keyof typeof COLORS.POWER_UPS]
            });
          }

          // Speed up slightly
          currentSpeedRef.current = Math.min(INITIAL_BALL_SPEED * 3, currentSpeedRef.current + 0.05);
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

      // Bottom Collision
      if (ball.y + ball.radius > height) {
        ballsRef.current.splice(bIndex, 1);
        if (ballsRef.current.length === 0) {
          livesRef.current -= 1;
          onLivesUpdate(livesRef.current);
          if (livesRef.current <= 0) {
            onGameStateChange(GameState.GAMEOVER);
          } else {
            spawnBall(width / 2, height - 40 - PADDLE_HEIGHT - ball.radius);
            isLaunchedRef.current = false;
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

    // Bricks
    bricksRef.current.forEach(brick => {
      ctx.fillStyle = brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 2);
    });

    // Power Ups
    powerUpsRef.current.forEach(pu => {
      ctx.fillStyle = pu.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = pu.color;
      ctx.beginPath();
      ctx.roundRect(pu.x, pu.y, POWER_UP_WIDTH, POWER_UP_HEIGHT, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Icon simplified
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '16px bold sans-serif';
      ctx.fillText(pu.type[0], pu.x + POWER_UP_WIDTH/2, pu.y + POWER_UP_HEIGHT/2 + 6);
    });

    // Paddle
    const gradient = ctx.createLinearGradient(paddleXRef.current, 0, paddleXRef.current + paddleWidthRef.current, 0);
    gradient.addColorStop(0, COLORS.PADDLE);
    gradient.addColorStop(0.5, '#60a5fa');
    gradient.addColorStop(1, COLORS.PADDLE);
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.PADDLE;
    ctx.beginPath();
    ctx.roundRect(paddleXRef.current, height - 40 - PADDLE_HEIGHT, paddleWidthRef.current, PADDLE_HEIGHT, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Balls
    ballsRef.current.forEach(ball => {
      ball.trail.forEach((t, i) => {
        ctx.globalAlpha = t.opacity;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * (1 - i / ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = ball.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Particles
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
      update(canvasRef.current);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) draw(ctx);
    }
    frameRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [loop]);

  useEffect(() => {
    const handleMove = (x: number) => {
       if (!containerRef.current) return;
       const rect = containerRef.current.getBoundingClientRect();
       paddleXRef.current = Math.max(0, Math.min(rect.width - paddleWidthRef.current, x - paddleWidthRef.current / 2));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      handleMove(e.clientX - containerRef.current.getBoundingClientRect().left);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX - containerRef.current.getBoundingClientRect().left);
    };

    const handleClick = () => {
      if (gameState === GameState.PLAYING && !isLaunchedRef.current) launchBall();
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
        bricksRef.current = initBricks(offsetWidth);
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
