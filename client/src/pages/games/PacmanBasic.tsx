import { useEffect, useState, useRef } from 'react';
import { Container } from '@/components/ui/container';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

// Simple 2D game constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// Game entities
enum EntityType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  PACMAN = 3,
  GHOST = 4,
  POWER_PELLET = 5
}

// Direction enum
enum Direction {
  UP = 'UP',
  RIGHT = 'RIGHT',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  NONE = 'NONE'
}

// Ghost colors
const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

// Game state
type GameState = {
  grid: number[][];
  pacman: {
    x: number;
    y: number;
    direction: Direction;
    nextDirection: Direction;
  };
  ghosts: {
    x: number;
    y: number;
    direction: Direction;
    color: string;
    isVulnerable: boolean;
  }[];
  score: number;
  lives: number;
  isGameOver: boolean;
  isPaused: boolean;
  isStarted: boolean;
  powerPelletActive: boolean;
  powerPelletTimer: number;
};

export default function PacmanBasic() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    pacman: {
      x: 10,
      y: 15,
      direction: Direction.NONE,
      nextDirection: Direction.NONE
    },
    ghosts: [
      { x: 9, y: 9, direction: Direction.RIGHT, color: GHOST_COLORS[0], isVulnerable: false },
      { x: 10, y: 9, direction: Direction.LEFT, color: GHOST_COLORS[1], isVulnerable: false },
      { x: 11, y: 9, direction: Direction.UP, color: GHOST_COLORS[2], isVulnerable: false },
      { x: 8, y: 9, direction: Direction.DOWN, color: GHOST_COLORS[3], isVulnerable: false }
    ],
    score: 0,
    lives: 3,
    isGameOver: false,
    isPaused: false,
    isStarted: false,
    powerPelletActive: false,
    powerPelletTimer: 0
  });
  
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  
  // Initialize grid with walls, dots, and power pellets
  const initializeGrid = () => {
    const grid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(EntityType.EMPTY));
    
    // Create outer walls
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[0][i] = EntityType.WALL;
      grid[GRID_SIZE - 1][i] = EntityType.WALL;
      grid[i][0] = EntityType.WALL;
      grid[i][GRID_SIZE - 1] = EntityType.WALL;
    }
    
    // Add some inner walls
    for (let i = 3; i < 8; i++) {
      grid[3][i] = EntityType.WALL;
      grid[16][i] = EntityType.WALL;
    }
    
    for (let i = 12; i < 17; i++) {
      grid[3][i] = EntityType.WALL;
      grid[16][i] = EntityType.WALL;
    }
    
    for (let i = 5; i < 15; i++) {
      grid[8][i] = EntityType.WALL;
      grid[11][i] = EntityType.WALL;
    }
    
    // Add dots
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] === EntityType.EMPTY) {
          grid[y][x] = EntityType.DOT;
        }
      }
    }
    
    // Add power pellets in the corners
    grid[1][1] = EntityType.POWER_PELLET;
    grid[1][GRID_SIZE - 2] = EntityType.POWER_PELLET;
    grid[GRID_SIZE - 2][1] = EntityType.POWER_PELLET;
    grid[GRID_SIZE - 2][GRID_SIZE - 2] = EntityType.POWER_PELLET;
    
    // Clear the starting positions
    grid[9][9] = EntityType.EMPTY;
    grid[10][9] = EntityType.EMPTY;
    grid[11][9] = EntityType.EMPTY;
    grid[8][9] = EntityType.EMPTY;
    grid[10][15] = EntityType.EMPTY;
    
    return grid;
  };
  
  // Initialize the game
  const initializeGame = () => {
    setGameState(prev => ({
      ...prev,
      grid: initializeGrid(),
      pacman: {
        x: 10,
        y: 15,
        direction: Direction.NONE,
        nextDirection: Direction.NONE
      },
      ghosts: [
        { x: 9, y: 9, direction: Direction.RIGHT, color: GHOST_COLORS[0], isVulnerable: false },
        { x: 10, y: 9, direction: Direction.LEFT, color: GHOST_COLORS[1], isVulnerable: false },
        { x: 11, y: 9, direction: Direction.UP, color: GHOST_COLORS[2], isVulnerable: false },
        { x: 8, y: 9, direction: Direction.DOWN, color: GHOST_COLORS[3], isVulnerable: false }
      ],
      score: 0,
      lives: 3,
      isGameOver: false,
      isPaused: false,
      isStarted: true,
      powerPelletActive: false,
      powerPelletTimer: 0
    }));
  };
  
  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('pacman-basic-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);
  
  // Start the game
  const startGame = () => {
    initializeGame();
  };
  
  // Draw the game
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = gameState.grid[y][x];
        
        if (cell === EntityType.WALL) {
          ctx.fillStyle = '#2222AA';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (cell === EntityType.DOT) {
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 10,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (cell === EntityType.POWER_PELLET) {
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
    
    // Draw Pacman
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    
    const pacX = gameState.pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const pacY = gameState.pacman.y * CELL_SIZE + CELL_SIZE / 2;
    const pacRadius = CELL_SIZE / 2 - 2;
    
    let startAngle = 0.2;
    let endAngle = 2 * Math.PI - 0.2;
    
    // Adjust mouth angle based on direction
    if (gameState.pacman.direction === Direction.RIGHT) {
      startAngle = 0.2;
      endAngle = 2 * Math.PI - 0.2;
    } else if (gameState.pacman.direction === Direction.LEFT) {
      startAngle = Math.PI + 0.2;
      endAngle = Math.PI - 0.2;
    } else if (gameState.pacman.direction === Direction.UP) {
      startAngle = Math.PI * 1.5 + 0.2;
      endAngle = Math.PI * 1.5 - 0.2;
    } else if (gameState.pacman.direction === Direction.DOWN) {
      startAngle = Math.PI * 0.5 + 0.2;
      endAngle = Math.PI * 0.5 - 0.2;
    }
    
    ctx.arc(pacX, pacY, pacRadius, startAngle, endAngle);
    ctx.lineTo(pacX, pacY);
    ctx.fill();
    
    // Draw ghosts
    gameState.ghosts.forEach(ghost => {
      ctx.fillStyle = ghost.isVulnerable ? '#0000FF' : ghost.color;
      
      const ghostX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
      const ghostY = ghost.y * CELL_SIZE + CELL_SIZE / 2;
      const ghostRadius = CELL_SIZE / 2 - 2;
      
      // Draw ghost body (circle for simplicity)
      ctx.beginPath();
      ctx.arc(ghostX, ghostY, ghostRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw eyes
      ctx.fillStyle = '#FFFFFF';
      
      // Left eye
      ctx.beginPath();
      ctx.arc(ghostX - ghostRadius / 3, ghostY - ghostRadius / 3, ghostRadius / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye
      ctx.beginPath();
      ctx.arc(ghostX + ghostRadius / 3, ghostY - ghostRadius / 3, ghostRadius / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye pupils
      ctx.fillStyle = '#000000';
      
      let pupilOffsetX = 0;
      let pupilOffsetY = 0;
      
      // Adjust pupil position based on direction
      if (ghost.direction === Direction.LEFT) pupilOffsetX = -1;
      else if (ghost.direction === Direction.RIGHT) pupilOffsetX = 1;
      else if (ghost.direction === Direction.UP) pupilOffsetY = -1;
      else if (ghost.direction === Direction.DOWN) pupilOffsetY = 1;
      
      // Left pupil
      ctx.beginPath();
      ctx.arc(
        ghostX - ghostRadius / 3 + pupilOffsetX * 2,
        ghostY - ghostRadius / 3 + pupilOffsetY * 2,
        ghostRadius / 8,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Right pupil
      ctx.beginPath();
      ctx.arc(
        ghostX + ghostRadius / 3 + pupilOffsetX * 2,
        ghostY - ghostRadius / 3 + pupilOffsetY * 2,
        ghostRadius / 8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  };
  
  // Move Pacman logic
  const movePacman = () => {
    const { pacman, grid } = gameState;
    
    // Check if next direction is valid
    if (pacman.nextDirection !== Direction.NONE) {
      let newX = pacman.x;
      let newY = pacman.y;
      
      if (pacman.nextDirection === Direction.UP) newY--;
      else if (pacman.nextDirection === Direction.RIGHT) newX++;
      else if (pacman.nextDirection === Direction.DOWN) newY++;
      else if (pacman.nextDirection === Direction.LEFT) newX--;
      
      // If the next direction is valid, change direction
      if (
        newX >= 0 && newX < GRID_SIZE &&
        newY >= 0 && newY < GRID_SIZE &&
        grid[newY][newX] !== EntityType.WALL
      ) {
        pacman.direction = pacman.nextDirection;
        pacman.nextDirection = Direction.NONE;
      }
    }
    
    // Move pacman in current direction
    let newX = pacman.x;
    let newY = pacman.y;
    
    if (pacman.direction === Direction.UP) newY--;
    else if (pacman.direction === Direction.RIGHT) newX++;
    else if (pacman.direction === Direction.DOWN) newY++;
    else if (pacman.direction === Direction.LEFT) newX--;
    
    // Check if the new position is valid
    if (
      newX >= 0 && newX < GRID_SIZE &&
      newY >= 0 && newY < GRID_SIZE &&
      grid[newY][newX] !== EntityType.WALL
    ) {
      // Update Pacman position
      pacman.x = newX;
      pacman.y = newY;
      
      // Check if Pacman eats a dot
      if (grid[newY][newX] === EntityType.DOT) {
        grid[newY][newX] = EntityType.EMPTY;
        setGameState(prev => ({
          ...prev,
          score: prev.score + 10,
          grid
        }));
      }
      
      // Check if Pacman eats a power pellet
      if (grid[newY][newX] === EntityType.POWER_PELLET) {
        grid[newY][newX] = EntityType.EMPTY;
        setGameState(prev => ({
          ...prev,
          score: prev.score + 50,
          grid,
          powerPelletActive: true,
          powerPelletTimer: 30, // Power pellet lasts for 30 frames
          ghosts: prev.ghosts.map(ghost => ({
            ...ghost,
            isVulnerable: true
          }))
        }));
      }
    }
    
    return { newPacman: pacman, newGrid: grid };
  };
  
  // Move ghosts logic
  const moveGhosts = () => {
    const { ghosts, grid, pacman, powerPelletActive } = gameState;
    
    const newGhosts = ghosts.map(ghost => {
      // Decide new direction
      const possibleDirections = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
      const validDirections = possibleDirections.filter(dir => {
        let newX = ghost.x;
        let newY = ghost.y;
        
        if (dir === Direction.UP) newY--;
        else if (dir === Direction.RIGHT) newX++;
        else if (dir === Direction.DOWN) newY++;
        else if (dir === Direction.LEFT) newX--;
        
        return (
          newX >= 0 && newX < GRID_SIZE &&
          newY >= 0 && newY < GRID_SIZE &&
          grid[newY][newX] !== EntityType.WALL
        );
      });
      
      // Choose a direction
      let newDirection = ghost.direction;
      
      if (validDirections.length > 0) {
        if (powerPelletActive) {
          // In vulnerable mode, try to move away from Pacman
          const directionDistances = validDirections.map(dir => {
            let newX = ghost.x;
            let newY = ghost.y;
            
            if (dir === Direction.UP) newY--;
            else if (dir === Direction.RIGHT) newX++;
            else if (dir === Direction.DOWN) newY++;
            else if (dir === Direction.LEFT) newX--;
            
            // Calculate distance
            return {
              direction: dir,
              distance: Math.sqrt(
                Math.pow(newX - pacman.x, 2) + Math.pow(newY - pacman.y, 2)
              )
            };
          });
          
          // Sort by distance (descending)
          directionDistances.sort((a, b) => b.distance - a.distance);
          
          // Choose the direction that takes the ghost furthest from Pacman
          newDirection = directionDistances[0].direction;
        } else {
          // In normal mode, try to move toward Pacman
          const directionDistances = validDirections.map(dir => {
            let newX = ghost.x;
            let newY = ghost.y;
            
            if (dir === Direction.UP) newY--;
            else if (dir === Direction.RIGHT) newX++;
            else if (dir === Direction.DOWN) newY++;
            else if (dir === Direction.LEFT) newX--;
            
            // Calculate distance
            return {
              direction: dir,
              distance: Math.sqrt(
                Math.pow(newX - pacman.x, 2) + Math.pow(newY - pacman.y, 2)
              )
            };
          });
          
          // Sort by distance (ascending)
          directionDistances.sort((a, b) => a.distance - b.distance);
          
          // Choose the direction that takes the ghost closer to Pacman
          newDirection = directionDistances[0].direction;
        }
      }
      
      // Move ghost
      let newX = ghost.x;
      let newY = ghost.y;
      
      if (newDirection === Direction.UP) newY--;
      else if (newDirection === Direction.RIGHT) newX++;
      else if (newDirection === Direction.DOWN) newY++;
      else if (newDirection === Direction.LEFT) newX--;
      
      return {
        ...ghost,
        x: newX,
        y: newY,
        direction: newDirection
      };
    });
    
    return newGhosts;
  };
  
  // Check for collisions between Pacman and ghosts
  const checkCollisions = () => {
    const { pacman, ghosts, powerPelletActive } = gameState;
    
    let newLives = gameState.lives;
    let newScore = gameState.score;
    let newGhosts = [...ghosts];
    
    // Check collisions with ghosts
    ghosts.forEach((ghost, index) => {
      if (pacman.x === ghost.x && pacman.y === ghost.y) {
        if (powerPelletActive && ghost.isVulnerable) {
          // Pacman eats the ghost
          newScore += 200;
          
          // Reset ghost position
          newGhosts[index] = {
            ...ghost,
            x: 9 + index,
            y: 9,
            isVulnerable: false
          };
        } else if (!ghost.isVulnerable) {
          // Ghost catches Pacman
          newLives--;
          
          if (newLives > 0) {
            // Reset Pacman position
            pacman.x = 10;
            pacman.y = 15;
            pacman.direction = Direction.NONE;
            pacman.nextDirection = Direction.NONE;
          }
        }
      }
    });
    
    return { newLives, newScore, newGhosts, pacman };
  };
  
  // Check if game is over
  const checkGameOver = () => {
    const { lives, grid } = gameState;
    
    if (lives <= 0) {
      return true;
    }
    
    // Check if all dots and power pellets are eaten
    let dotsRemaining = 0;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] === EntityType.DOT || grid[y][x] === EntityType.POWER_PELLET) {
          dotsRemaining++;
        }
      }
    }
    
    return dotsRemaining === 0;
  };
  
  // Game loop
  const gameLoop = () => {
    if (gameState.isPaused || !gameState.isStarted || gameState.isGameOver) {
      return;
    }
    
    // Move Pacman
    const { newPacman, newGrid } = movePacman();
    
    // Move ghosts
    const newGhosts = moveGhosts();
    
    // Update game state
    setGameState(prev => {
      const nextState = {
        ...prev,
        pacman: newPacman,
        grid: newGrid,
        ghosts: newGhosts
      };
      
      // Decrease power pellet timer
      if (prev.powerPelletActive) {
        if (prev.powerPelletTimer > 0) {
          nextState.powerPelletTimer = prev.powerPelletTimer - 1;
        } else {
          nextState.powerPelletActive = false;
          nextState.ghosts = nextState.ghosts.map(ghost => ({
            ...ghost,
            isVulnerable: false
          }));
        }
      }
      
      // Check collisions
      const { newLives, newScore, newGhosts: collidedGhosts, pacman } = checkCollisions();
      
      nextState.lives = newLives;
      nextState.score = newScore;
      nextState.ghosts = collidedGhosts;
      nextState.pacman = pacman;
      
      // Check game over
      const isGameOver = checkGameOver();
      
      if (isGameOver) {
        nextState.isGameOver = true;
        
        // Update high score
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('pacman-basic-high-score', newScore.toString());
        }
      }
      
      return nextState;
    });
    
    // Draw the game
    drawGame();
    
    // Continue the game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isStarted || gameState.isGameOver) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setGameState(prev => ({
            ...prev,
            pacman: {
              ...prev.pacman,
              nextDirection: Direction.UP
            }
          }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setGameState(prev => ({
            ...prev,
            pacman: {
              ...prev.pacman,
              nextDirection: Direction.RIGHT
            }
          }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setGameState(prev => ({
            ...prev,
            pacman: {
              ...prev.pacman,
              nextDirection: Direction.DOWN
            }
          }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setGameState(prev => ({
            ...prev,
            pacman: {
              ...prev.pacman,
              nextDirection: Direction.LEFT
            }
          }));
          break;
        case 'p':
        case 'P':
          setGameState(prev => ({
            ...prev,
            isPaused: !prev.isPaused
          }));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isStarted, gameState.isGameOver]);
  
  // Handle touch controls
  const handleTouchControl = (direction: Direction) => {
    if (!gameState.isStarted || gameState.isGameOver) {
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      pacman: {
        ...prev.pacman,
        nextDirection: direction
      }
    }));
  };
  
  // Initialize game loop
  useEffect(() => {
    if (gameState.isStarted && !gameState.isPaused && !gameState.isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameState.isStarted && !gameState.isGameOver) {
      drawGame();
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    gameState.isStarted,
    gameState.isPaused,
    gameState.isGameOver,
    gameState.powerPelletActive,
    gameState.powerPelletTimer
  ]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12">
          <Container>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Pacman Basic</h1>
              <p className="text-gray-600">
                A simplified version of the classic arcade game.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Score</div>
                      <div className="font-bold text-xl">{gameState.score}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Lives</div>
                      <div className="font-bold text-xl">{gameState.lives}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">High Score</div>
                      <div className="font-bold text-xl">{highScore}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative border-2 border-gray-200 rounded-md overflow-hidden mb-6 bg-black">
                      {!gameState.isStarted ? (
                        <div 
                          className="w-full h-[400px] flex items-center justify-center bg-black"
                        >
                          <div className="text-center">
                            <div className="text-yellow-400 text-4xl font-bold mb-4">
                              {gameState.isGameOver ? 'GAME OVER' : 'PAC-MAN'}
                            </div>
                            <div className="text-white mb-6">
                              {gameState.isGameOver ? `Final Score: ${gameState.score}` : 'Ready to play?'}
                            </div>
                            <Button onClick={startGame} className="px-8">
                              {gameState.isGameOver ? 'Play Again' : 'Start Game'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <canvas
                          ref={canvasRef}
                          width={CANVAS_SIZE}
                          height={CANVAS_SIZE}
                          className="block mx-auto"
                        />
                      )}
                    </div>
                    
                    {/* Game controls - mobile-friendly buttons */}
                    <div className="md:hidden">
                      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                        <div></div>
                        <button
                          className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                          onClick={() => handleTouchControl(Direction.UP)}
                        >
                          <span className="text-xl">↑</span>
                        </button>
                        <div></div>
                        
                        <button
                          className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                          onClick={() => handleTouchControl(Direction.LEFT)}
                        >
                          <span className="text-xl">←</span>
                        </button>
                        
                        <button
                          className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                          onClick={() => handleTouchControl(Direction.DOWN)}
                        >
                          <span className="text-xl">↓</span>
                        </button>
                        
                        <button
                          className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                          onClick={() => handleTouchControl(Direction.RIGHT)}
                        >
                          <span className="text-xl">→</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Game controls */}
                    <div className="flex justify-center gap-4 mt-4">
                      {gameState.isStarted && !gameState.isGameOver && (
                        <Button 
                          onClick={() => setGameState(prev => ({...prev, isPaused: !prev.isPaused}))} 
                          variant="outline"
                        >
                          {gameState.isPaused ? 'Resume Game' : 'Pause Game'}
                        </Button>
                      )}
                      {gameState.isStarted && (
                        <Button 
                          onClick={() => {
                            if (gameLoopRef.current) {
                              cancelAnimationFrame(gameLoopRef.current);
                            }
                            setGameState(prev => ({
                              ...prev,
                              isStarted: false,
                              isGameOver: true
                            }));
                          }} 
                          variant="outline"
                        >
                          End Game
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4">How to Play</h3>
                  
                  <div className="space-y-4">
                    <p>
                      Pac-Man is one of the most iconic arcade games of all time. Navigate through the
                      maze, eat all the dots, and avoid the ghosts to clear each level.
                    </p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Controls</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Arrow Up / W: Move up</li>
                        <li>Arrow Right / D: Move right</li>
                        <li>Arrow Down / S: Move down</li>
                        <li>Arrow Left / A: Move left</li>
                        <li>P: Pause/Resume game</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Scoring</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Small Dot: 10 points</li>
                        <li>Power Pellet: 50 points</li>
                        <li>Ghost: 200 points</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Power Pellets</h4>
                      <p>
                        Eating a power pellet allows Pac-Man to eat the ghosts for a limited time. 
                        Ghosts turn blue when they are vulnerable.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">The Ghosts</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><span style={{color: GHOST_COLORS[0]}}>Blinky (Red)</span>: Directly chases Pac-Man</li>
                        <li><span style={{color: GHOST_COLORS[1]}}>Pinky (Pink)</span>: Tries to ambush Pac-Man</li>
                        <li><span style={{color: GHOST_COLORS[2]}}>Inky (Cyan)</span>: Unpredictable movement</li>
                        <li><span style={{color: GHOST_COLORS[3]}}>Clyde (Orange)</span>: Shy and keeps distance</li>
                      </ul>
                    </div>
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