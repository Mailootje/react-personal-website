import { useEffect, useState, useRef, useCallback } from "react";
import { Container } from "@/components/ui/container";
import SectionHeading from "@/components/SectionHeading";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Snake game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MAX_SPEED = 50;

// Direction constants
enum Direction {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

// Game state
enum GameState {
  READY = "READY",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
}

// Cell types
interface Cell {
  x: number;
  y: number;
}

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [level, setLevel] = useState(1);
  
  // Game state references (used in callbacks)
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const levelRef = useRef(level);
  
  // Snake state (using refs to avoid re-renders during gameplay)
  const snake = useRef<Cell[]>([]);
  const food = useRef<Cell>({ x: 0, y: 0 });
  const direction = useRef<Direction>(Direction.RIGHT);
  const nextDirection = useRef<Direction>(Direction.RIGHT);
  const speed = useRef(INITIAL_SPEED);
  
  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
    scoreRef.current = score;
    levelRef.current = level;
  }, [gameState, score, level]);
  
  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);
  
  // Initialize game
  const initGame = useCallback(() => {
    // Reset snake
    snake.current = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      snake.current.unshift({
        x: Math.floor(GRID_SIZE / 2) - i,
        y: Math.floor(GRID_SIZE / 2),
      });
    }
    
    // Reset direction
    direction.current = Direction.RIGHT;
    nextDirection.current = Direction.RIGHT;
    
    // Reset speed
    speed.current = INITIAL_SPEED;
    
    // Reset score
    setScore(0);
    setLevel(1);
    
    // Generate food
    generateFood();
    
    // Set game state
    setGameState(GameState.PLAYING);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
  }, []);
  
  // Generate food at random position
  const generateFood = () => {
    let newFood: Cell;
    let foodOnSnake = true;
    
    // Generate food until it's not on the snake
    while (foodOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      
      foodOnSnake = snake.current.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      
      if (!foodOnSnake) {
        food.current = newFood;
      }
    }
  };
  
  // Move snake
  const moveSnake = () => {
    // Update direction
    direction.current = nextDirection.current;
    
    // Calculate new head position
    const head = { ...snake.current[0] };
    
    switch (direction.current) {
      case Direction.UP:
        head.y -= 1;
        break;
      case Direction.DOWN:
        head.y += 1;
        break;
      case Direction.LEFT:
        head.x -= 1;
        break;
      case Direction.RIGHT:
        head.x += 1;
        break;
    }
    
    // Check if snake hit the wall
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      gameOver();
      return;
    }
    
    // Check if snake hit itself
    if (
      snake.current.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      gameOver();
      return;
    }
    
    // Add new head
    snake.current.unshift(head);
    
    // Check if snake ate food
    if (head.x === food.current.x && head.y === food.current.y) {
      // Increase score
      const newScore = scoreRef.current + 10;
      setScore(newScore);
      
      // Update high score if needed
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('snakeHighScore', newScore.toString());
      }
      
      // Increase level every 50 points
      if (newScore % 50 === 0) {
        const newLevel = levelRef.current + 1;
        setLevel(newLevel);
        
        // Increase speed
        speed.current = Math.max(MAX_SPEED, speed.current - SPEED_INCREMENT);
      }
      
      // Generate new food
      generateFood();
    } else {
      // Remove tail if snake didn't eat food
      snake.current.pop();
    }
  };
  
  // Game over
  const gameOver = () => {
    setGameState(GameState.GAME_OVER);
  };
  
  // Game loop time tracker
  const lastFrameTimeRef = useRef<number>(0);
  
  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    
    // Get time elapsed since last frame
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const elapsed = timestamp - lastFrameTimeRef.current;
    
    // Move snake if enough time has passed
    if (elapsed > speed.current) {
      lastFrameTimeRef.current = timestamp;
      moveSnake();
      drawGame();
    }
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
  }, []);
  
  // Draw game on canvas
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    ctx.fillStyle = "#4F46E5"; // Primary color
    snake.current.forEach((segment, index) => {
      // Head has a different color
      if (index === 0) {
        ctx.fillStyle = "#312E81"; // Darker blue
      } else {
        // Gradient effect for the body
        const alpha = 1 - (index / snake.current.length) * 0.6;
        ctx.fillStyle = `rgba(79, 70, 229, ${alpha})`;
      }
      
      ctx.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      
      // Add border to cells
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });
    
    // Draw food
    ctx.fillStyle = "#EF4444"; // Red
    ctx.beginPath();
    ctx.arc(
      food.current.x * CELL_SIZE + CELL_SIZE / 2,
      food.current.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Add shine to food
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      food.current.x * CELL_SIZE + CELL_SIZE / 3,
      food.current.y * CELL_SIZE + CELL_SIZE / 3,
      CELL_SIZE / 6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw grid (optional) - disabled for better performance
    /* 
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
    */
  }, []);
  
  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    
    const currentDir = direction.current;
    
    switch (event.key) {
      case "ArrowUp":
      case "w":
      case "W":
        if (currentDir !== Direction.DOWN) {
          nextDirection.current = Direction.UP;
        }
        break;
      case "ArrowDown":
      case "s":
      case "S":
        if (currentDir !== Direction.UP) {
          nextDirection.current = Direction.DOWN;
        }
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        if (currentDir !== Direction.RIGHT) {
          nextDirection.current = Direction.LEFT;
        }
        break;
      case "ArrowRight":
      case "d":
      case "D":
        if (currentDir !== Direction.LEFT) {
          nextDirection.current = Direction.RIGHT;
        }
        break;
      case "Escape":
        // Toggle pause
        setGameState(prev => 
          prev === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING
        );
        break;
    }
  }, []);
  
  // Handle touch controls for mobile
  const handleTouchInput = useCallback((dir: Direction) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    
    const currentDir = direction.current;
    
    switch (dir) {
      case Direction.UP:
        if (currentDir !== Direction.DOWN) {
          nextDirection.current = Direction.UP;
        }
        break;
      case Direction.DOWN:
        if (currentDir !== Direction.UP) {
          nextDirection.current = Direction.DOWN;
        }
        break;
      case Direction.LEFT:
        if (currentDir !== Direction.RIGHT) {
          nextDirection.current = Direction.LEFT;
        }
        break;
      case Direction.RIGHT:
        if (currentDir !== Direction.LEFT) {
          nextDirection.current = Direction.RIGHT;
        }
        break;
    }
  }, []);
  
  // Setup keyboard and touch event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    
    // Initial draw
    drawGame();
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, drawGame]);
  
  // Resume game from pause
  const resumeGame = () => {
    if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
      requestAnimationFrame(gameLoop);
    }
  };
  
  // Handle game state changes
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      // Start game loop when playing
      requestAnimationFrame(gameLoop);
    }
  }, [gameState, gameLoop]);
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-16 bg-gray-50">
          <Container maxWidth="xl">
            <div className="mb-8">
              <Link href="/games">
                <span className="text-primary hover:underline inline-flex items-center">
                  <span className="mr-2">←</span>
                  Back to Games
                </span>
              </Link>
            </div>
            
            <SectionHeading 
              subtitle="Classic Arcade" 
              title="Snake Game"
              center
            />
            
            <div className="mt-8 flex flex-col items-center">
              <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-sm text-gray-500">Score</div>
                      <div className="text-2xl font-bold">{score}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">High Score</div>
                      <div className="text-2xl font-bold">{highScore}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Level</div>
                    <Badge variant="outline" className="px-3 py-1">
                      {level}
                    </Badge>
                  </div>
                </div>
                
                <div className="relative border-2 border-gray-200 rounded-md overflow-hidden mb-6">
                  <canvas
                    ref={canvasRef}
                    width={GRID_SIZE * CELL_SIZE}
                    height={GRID_SIZE * CELL_SIZE}
                    className="bg-gray-50"
                  />
                  
                  {gameState === GameState.READY && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                      <div className="text-center p-6">
                        <h3 className="text-2xl font-bold mb-4">Snake Game</h3>
                        <p className="mb-6">Eat food to grow longer, but don't hit the walls or yourself!</p>
                        <Button onClick={initGame} size="lg">
                          Start Game
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {gameState === GameState.PAUSED && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                      <div className="text-center p-6">
                        <h3 className="text-2xl font-bold mb-4">Game Paused</h3>
                        <Button onClick={resumeGame} size="lg">
                          Resume
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {gameState === GameState.GAME_OVER && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                      <div className="text-center p-6">
                        <h3 className="text-2xl font-bold mb-2">Game Over</h3>
                        <p className="mb-4">Your score: {score}</p>
                        {score === highScore && score > 0 && (
                          <p className="text-yellow-400 font-bold mb-4">New High Score!</p>
                        )}
                        <Button onClick={initGame} size="lg">
                          Play Again
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mobile controls */}
                <div className="md:hidden mt-4">
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    <div></div>
                    <button
                      className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                      onClick={() => handleTouchInput(Direction.UP)}
                    >
                      <span className="text-xl">↑</span>
                    </button>
                    <div></div>
                    
                    <button
                      className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                      onClick={() => handleTouchInput(Direction.LEFT)}
                    >
                      <span className="text-xl">←</span>
                    </button>
                    
                    <button
                      className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                      onClick={() => handleTouchInput(Direction.DOWN)}
                    >
                      <span className="text-xl">↓</span>
                    </button>
                    
                    <button
                      className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                      onClick={() => handleTouchInput(Direction.RIGHT)}
                    >
                      <span className="text-xl">→</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-bold text-lg mb-2">Controls</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="font-medium">Move Up</div>
                      <div className="text-sm text-gray-500">Arrow Up / W</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="font-medium">Move Down</div>
                      <div className="text-sm text-gray-500">Arrow Down / S</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="font-medium">Move Left</div>
                      <div className="text-sm text-gray-500">Arrow Left / A</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="font-medium">Move Right</div>
                      <div className="text-sm text-gray-500">Arrow Right / D</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 p-3 rounded border">
                    <div className="font-medium">Pause/Resume</div>
                    <div className="text-sm text-gray-500">Escape Key</div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}