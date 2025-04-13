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
  
  // Game loop time tracker
  const lastFrameTimeRef = useRef<number>(0);
  
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
  
  // Draw game on canvas
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Make sure canvas dimensions are set
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    // Clear canvas and fill with dark background
    ctx.fillStyle = "#111111"; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = "#1F2937"; // Dark gray grid lines
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw a border around the game area
    ctx.strokeStyle = "#4B5563"; // Medium gray border
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    
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
      
      // Draw segment with slightly rounded corners
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const size = CELL_SIZE - 1; // Slightly smaller to see grid
      const radius = 3; // Rounded corner radius
      
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + size - radius, y);
      ctx.arcTo(x + size, y, x + size, y + radius, radius);
      ctx.lineTo(x + size, y + size - radius);
      ctx.arcTo(x + size, y + size, x + size - radius, y + size, radius);
      ctx.lineTo(x + radius, y + size);
      ctx.arcTo(x, y + size, x, y + size - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.fill();
      
      // Add border to segments
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    // Draw food
    ctx.fillStyle = "#EF4444"; // Red
    ctx.beginPath();
    ctx.arc(
      food.current.x * CELL_SIZE + CELL_SIZE / 2,
      food.current.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 1, // Slightly smaller to see grid
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
  }, []);
  
  // Generate food at random position
  const generateFood = () => {
    // Safety check to prevent infinite loops if snake fills the grid
    if (snake.current.length >= GRID_SIZE * GRID_SIZE - 1) {
      // Game is won - can't place more food
      gameOver();
      return;
    }
    
    // Create a grid to track available cells
    const grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(true));
    
    // Mark cells occupied by the snake
    for (const segment of snake.current) {
      if (segment.x >= 0 && segment.x < GRID_SIZE && segment.y >= 0 && segment.y < GRID_SIZE) {
        grid[segment.y][segment.x] = false;
      }
    }
    
    // Collect all available cells
    const availableCells: Cell[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x]) {
          availableCells.push({ x, y });
        }
      }
    }
    
    // If there are no available cells, end the game
    if (availableCells.length === 0) {
      gameOver();
      return;
    }
    
    // Select a random available cell for food
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    food.current = availableCells[randomIndex];
  };
  
  // Game over
  const gameOver = () => {
    setGameState(GameState.GAME_OVER);
  };
  
  // Move snake
  const moveSnake = () => {
    // Update direction
    direction.current = nextDirection.current;
    
    // Calculate new head position
    const head = { ...snake.current[0] };
    const oldHead = { ...head }; // Store original head for collision detection
    
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
    
    // Check for self-collision
    // Check all segments except the tail (since it will be removed unless food is eaten)
    let selfCollision = false;
    // Skip index 0 (current head)
    for (let i = 1; i < snake.current.length - 1; i++) {
      const segment = snake.current[i];
      if (head.x === segment.x && head.y === segment.y) {
        selfCollision = true;
        break;
      }
    }
    
    if (selfCollision) {
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
  }, [drawGame]);
  
  // Initialize game
  const initGame = useCallback(() => {
    // Complete reset of the game state
    snake.current = [];
    
    // Position the snake in the middle of the grid, moving to the right
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    
    // Create the initial snake segments
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      snake.current.push({
        x: centerX - i,
        y: centerY,
      });
    }
    
    // Reset direction (starting with RIGHT)
    direction.current = Direction.RIGHT;
    nextDirection.current = Direction.RIGHT;
    
    // Reset game speed
    speed.current = INITIAL_SPEED;
    
    // Reset score and level
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    levelRef.current = 1;
    
    // Generate food away from the snake
    food.current = { x: 0, y: 0 }; // Temporary value
    generateFood();
    
    // Draw initial state
    drawGame();
    
    // Reset time tracker
    lastFrameTimeRef.current = 0;
    
    // Clear any existing game loops before starting a new one
    // Transition to PLAYING state with proper delays to ensure initialization is complete
    setTimeout(() => {
      setGameState(GameState.PLAYING);
      
      // Start game loop with a delay to ensure state is properly updated
      setTimeout(() => {
        // Make absolutely sure we have clean state
        gameStateRef.current = GameState.PLAYING;
        requestAnimationFrame(gameLoop);
      }, 200);
    }, 100);
  }, [drawGame, gameLoop]);
  
  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    
    // Prevent default scrolling behavior for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
      event.preventDefault();
    }
    
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
  
  // Resume game from pause
  const resumeGame = () => {
    if (gameState === GameState.PAUSED) {
      // Reset time tracker
      lastFrameTimeRef.current = 0;
      
      // Set game state to playing
      setGameState(GameState.PLAYING);
      
      // Start game loop with a small delay
      setTimeout(() => {
        requestAnimationFrame(gameLoop);
      }, 50);
    }
  };
  
  // Setup keyboard and touch event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    
    // Initial draw
    drawGame();
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, drawGame]);
  
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
        <section className="py-16 bg-black">
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
              isDark={true}
            />
            
            <div className="mt-8 flex flex-col items-center">
              <div className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-sm text-gray-400">Score</div>
                      <div className="text-2xl font-bold text-white">{score}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">High Score</div>
                      <div className="text-2xl font-bold text-white">{highScore}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400">Level</div>
                    <Badge variant="outline" className="px-3 py-1 border-gray-600 text-white">
                      {level}
                    </Badge>
                  </div>
                </div>
                
                <div className="relative border-2 border-gray-700 rounded-md overflow-hidden mb-6">
                  {/* Game canvas with responsive container */}
                  <div className="w-full aspect-square max-w-[400px] mx-auto">
                    <canvas
                      ref={canvasRef}
                      width={GRID_SIZE * CELL_SIZE}
                      height={GRID_SIZE * CELL_SIZE}
                      className="bg-gray-900 w-full h-full border border-gray-700"
                    />
                  </div>
                  
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
                      className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white border border-gray-700"
                      onClick={() => handleTouchInput(Direction.UP)}
                    >
                      <span className="text-xl">↑</span>
                    </button>
                    <div></div>
                    
                    <button
                      className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white border border-gray-700"
                      onClick={() => handleTouchInput(Direction.LEFT)}
                    >
                      <span className="text-xl">←</span>
                    </button>
                    
                    <button
                      className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white border border-gray-700"
                      onClick={() => handleTouchInput(Direction.DOWN)}
                    >
                      <span className="text-xl">↓</span>
                    </button>
                    
                    <button
                      className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white border border-gray-700"
                      onClick={() => handleTouchInput(Direction.RIGHT)}
                    >
                      <span className="text-xl">→</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-bold text-lg mb-2 text-white">Controls</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <div className="font-medium text-white">Move Up</div>
                      <div className="text-sm text-gray-400">Arrow Up / W</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <div className="font-medium text-white">Move Down</div>
                      <div className="text-sm text-gray-400">Arrow Down / S</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <div className="font-medium text-white">Move Left</div>
                      <div className="text-sm text-gray-400">Arrow Left / A</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <div className="font-medium text-white">Move Right</div>
                      <div className="text-sm text-gray-400">Arrow Right / D</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-800 p-3 rounded border border-gray-700">
                    <div className="font-medium text-white">Pause/Resume</div>
                    <div className="text-sm text-gray-400">Escape Key</div>
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