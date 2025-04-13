import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Game constants
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 25;

// Game states
enum GameState {
  READY = "READY",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER"
}

// Tetromino shapes
const TETROMINOES = [
  {
    // I-piece (cyan)
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00FFFF'
  },
  {
    // J-piece (blue)
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000FF'
  },
  {
    // L-piece (orange)
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF8000'
  },
  {
    // O-piece (yellow)
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00'
  },
  {
    // S-piece (green)
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00FF00'
  },
  {
    // T-piece (purple)
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#800080'
  },
  {
    // Z-piece (red)
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF0000'
  }
];

// Type definitions
interface Tetromino {
  shape: number[][];
  color: string;
  position: { x: number; y: number };
  rotation: number;
}

type GridCell = string | null;

// Helper functions
// Create a deep copy of a tetromino to avoid reference issues
const cloneTetromino = (tetromino: Tetromino): Tetromino => {
  return {
    shape: tetromino.shape.map(row => [...row]),
    color: tetromino.color,
    position: { ...tetromino.position },
    rotation: tetromino.rotation
  };
};

const randomTetromino = (): Tetromino => {
  const randIndex = Math.floor(Math.random() * TETROMINOES.length);
  const { shape, color } = TETROMINOES[randIndex];
  
  return {
    // Deep copy the shape array to avoid reference issues
    shape: shape.map(row => [...row]),
    color,
    position: { x: Math.floor(GRID_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0 },
    rotation: 0
  };
};

const createEmptyGrid = (): GridCell[][] => {
  return Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
};

const rotateMatrix = (matrix: number[][]): number[][] => {
  const N = matrix.length;
  const rotated = Array(N).fill(0).map(() => Array(N).fill(0));
  
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      rotated[x][N - 1 - y] = matrix[y][x];
    }
  }
  
  return rotated;
};

export default function Tetris() {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [grid, setGrid] = useState<GridCell[][]>(createEmptyGrid());
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [lines, setLines] = useState<number>(0);
  
  // Tetromino state
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino | null>(null);
  const [nextTetromino, setNextTetromino] = useState<Tetromino | null>(null);
  
  // Canvas references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game loop and timing references
  const gameLoopRef = useRef<number | null>(null);
  const dropIntervalRef = useRef<number | null>(null);
  const dropTimeRef = useRef<number>(1000);
  const lastTimeRef = useRef<number>(0);
  
  // Check if a tetromino is colliding with walls, floor, or locked cells
  const isColliding = useCallback((tetromino: Tetromino): boolean => {
    if (!tetromino) {
      console.error("isColliding called with null tetromino");
      return false;
    }
    
    const { shape, position } = tetromino;
    
    console.log("Checking collision for tetromino at", position);
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const gridY = position.y + y;
          const gridX = position.x + x;
          
          // Check if out of bounds
          if (gridY >= GRID_HEIGHT || gridX < 0 || gridX >= GRID_WIDTH) {
            console.log(`Collision: Out of bounds at [${gridX}, ${gridY}]`);
            return true;
          }
          
          // Check if colliding with locked cells (only check if not above the grid)
          if (gridY >= 0 && grid[gridY] && grid[gridY][gridX] !== null) {
            console.log(`Collision: Locked cell at [${gridX}, ${gridY}]`);
            return true;
          }
        }
      }
    }
    
    console.log("No collision detected");
    return false;
  }, [grid]);
  
  // Draw the game board
  const drawBoard = useCallback(() => {
    console.log("Drawing board, currentTetromino:", currentTetromino);
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas ref is null");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw locked cells
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[y][x] !== null) {
          ctx.fillStyle = grid[y][x] as string;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          
          // Draw cell border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
    
    // Create a test tetromino if none exists
    const tetrominoToDraw = currentTetromino || {
      shape: TETROMINOES[0].shape,
      color: TETROMINOES[0].color,
      position: { x: Math.floor(GRID_WIDTH / 2) - 2, y: 5 },
      rotation: 0
    };
    
    // Draw current tetromino
    console.log("Drawing tetromino:", tetrominoToDraw);
    const { shape, color, position } = tetrominoToDraw;
    
    ctx.fillStyle = color;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const drawX = (position.x + x) * CELL_SIZE;
          const drawY = (position.y + y) * CELL_SIZE;
          console.log(`Drawing block at (${drawX}, ${drawY})`);
          
          ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
          
          // Draw cell border with a more visible outline
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }, [grid, currentTetromino]);
  
  // Draw the next piece preview
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !nextTetromino) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= 4; x++) {
      ctx.beginPath();
      ctx.moveTo(x * PREVIEW_CELL_SIZE, 0);
      ctx.lineTo(x * PREVIEW_CELL_SIZE, 4 * PREVIEW_CELL_SIZE);
      ctx.stroke();
    }
    
    for (let y = 0; y <= 4; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * PREVIEW_CELL_SIZE);
      ctx.lineTo(4 * PREVIEW_CELL_SIZE, y * PREVIEW_CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw next tetromino
    const { shape, color } = nextTetromino;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    
    ctx.fillStyle = color;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          ctx.fillRect(
            (offsetX + x) * PREVIEW_CELL_SIZE,
            (offsetY + y) * PREVIEW_CELL_SIZE,
            PREVIEW_CELL_SIZE,
            PREVIEW_CELL_SIZE
          );
          
          // Draw cell border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            (offsetX + x) * PREVIEW_CELL_SIZE,
            (offsetY + y) * PREVIEW_CELL_SIZE,
            PREVIEW_CELL_SIZE,
            PREVIEW_CELL_SIZE
          );
        }
      }
    }
  }, [nextTetromino]);
  
  // Move the tetromino left, right, or down
  const moveTetromino = useCallback((direction: 'left' | 'right') => {
    if (!currentTetromino || gameState !== GameState.PLAYING) return;
    
    const deltaX = direction === 'left' ? -1 : 1;
    
    // Create a deep copy of the tetromino with new position
    const newTetromino = cloneTetromino(currentTetromino);
    newTetromino.position.x += deltaX;
    
    if (!isColliding(newTetromino)) {
      setCurrentTetromino(newTetromino);
    }
  }, [currentTetromino, gameState, isColliding]);
  
  // Rotate the tetromino
  const rotateTetromino = useCallback(() => {
    if (!currentTetromino || gameState !== GameState.PLAYING) return;
    
    // Create a deep copy of the tetromino
    const newTetromino = cloneTetromino(currentTetromino);
    
    // Create a new rotated shape using the rotateMatrix function
    const rotatedShape = rotateMatrix(currentTetromino.shape.map(row => [...row]));
    
    // Update the shape and rotation in the copied tetromino
    newTetromino.shape = rotatedShape;
    newTetromino.rotation = (currentTetromino.rotation + 1) % 4;
    
    // Try to rotate in place
    if (!isColliding(newTetromino)) {
      setCurrentTetromino(newTetromino);
      return;
    }
    
    // Wall kick - try shifting the tetromino to fit after rotation
    for (let offset of [-1, 1, -2, 2]) {
      // Create a new tetromino with the offset position
      const kickedTetromino = cloneTetromino(newTetromino);
      kickedTetromino.position.x += offset;
      
      if (!isColliding(kickedTetromino)) {
        setCurrentTetromino(kickedTetromino);
        return;
      }
    }
  }, [currentTetromino, gameState, isColliding]);
  
  // Spawn a new tetromino
  const spawnTetromino = useCallback(() => {
    console.log("Spawning new tetromino");
    
    // Use the next tetromino as the current one
    if (nextTetromino) {
      console.log("Using next tetromino as current");
      // Make a deep copy to avoid reference issues
      const newTetromino = cloneTetromino({
        ...nextTetromino,
        position: { 
          x: Math.floor(GRID_WIDTH / 2) - Math.floor(nextTetromino.shape[0].length / 2), 
          y: 0 
        }
      });
      console.log("New current tetromino:", newTetromino);
      setCurrentTetromino(newTetromino);
    } else {
      console.log("No next tetromino, creating random one");
      const randomTet = randomTetromino();
      console.log("New random tetromino:", randomTet);
      setCurrentTetromino(randomTet);
    }
    
    // Generate a new next tetromino
    const newNextTet = randomTetromino();
    console.log("New next tetromino:", newNextTet);
    setNextTetromino(newNextTet);
  }, [nextTetromino]);
  
  // Lock the current tetromino in place
  const settleBlock = useCallback(() => {
    if (!currentTetromino) return;
    
    const newGrid = [...grid.map(row => [...row])];
    const { shape, color, position } = currentTetromino;
    
    // Add the current tetromino to the grid
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const gridY = position.y + y;
          const gridX = position.x + x;
          
          // Check if the position is within the grid
          if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
            newGrid[gridY][gridX] = color as GridCell;
          }
        }
      }
    }
    
    // Check for completed lines
    const completedLines = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      if (newGrid[y].every(cell => cell !== null)) {
        completedLines.push(y);
      }
    }
    
    // Remove completed lines and add empty rows at the top
    if (completedLines.length > 0) {
      const removedLines = completedLines.length;
      
      // Remove completed lines
      for (const line of completedLines) {
        newGrid.splice(line, 1);
        newGrid.unshift(Array(GRID_WIDTH).fill(null));
      }
      
      // Update score and lines
      const linePoints = [0, 100, 300, 500, 800]; // Points for clearing 0, 1, 2, 3, or 4 lines
      const newScore = score + linePoints[removedLines] * level;
      const newLines = lines + removedLines;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      setScore(newScore);
      setLines(newLines);
      setLevel(newLevel);
      
      // Update high score if needed
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('tetris-high-score', newScore.toString());
      }
      
      // Adjust drop speed based on level
      dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
    }
    
    setGrid(newGrid);
    spawnTetromino();
  }, [currentTetromino, grid, score, lines, level, highScore, spawnTetromino]);
  
  // Drop tetromino by one cell
  const dropTetromino = useCallback(() => {
    console.log("Drop tetromino called, current state:", gameState);
    console.log("Current tetromino:", currentTetromino);
    
    if (!currentTetromino) {
      console.log("No current tetromino, cannot drop");
      return;
    }
    
    if (gameState !== GameState.PLAYING) {
      console.log("Game not in PLAYING state, cannot drop");
      return;
    }
    
    console.log("Trying to drop tetromino from", currentTetromino.position);
    
    // Create a deep copy of the tetromino with new position
    const newTetromino = cloneTetromino(currentTetromino);
    newTetromino.position.y += 1;
    
    const collision = isColliding(newTetromino);
    console.log("Collision?", collision);
    
    if (!collision) {
      console.log("Moving tetromino down to", newTetromino.position);
      setCurrentTetromino(newTetromino);
    } else {
      console.log("Collision detected, settling block");
      // The tetromino cannot move down further, so lock it in place
      settleBlock();
    }
  }, [currentTetromino, gameState, isColliding, settleBlock]);
  
  // Hard drop (instantly drop to bottom)
  const hardDrop = useCallback(() => {
    if (!currentTetromino || gameState !== GameState.PLAYING) return;
    
    // Create a deep copy of the tetromino
    const newTetromino = cloneTetromino(currentTetromino);
    let newY = newTetromino.position.y;
    
    // Find the lowest position without collision
    while (!isColliding({
      ...newTetromino,
      position: { ...newTetromino.position, y: newY + 1 }
    })) {
      newY++;
    }
    
    newTetromino.position.y = newY;
    setCurrentTetromino(newTetromino);
    
    // Immediately settle the block
    settleBlock();
  }, [currentTetromino, gameState, isColliding, settleBlock]);
  
  // Initialize the game
  const initGame = useCallback(() => {
    console.log("Initializing game...");
    
    // Reset game state
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    
    // Create initial tetrominos using our helper function for proper deep copying
    const initialTetromino = {
      shape: [...TETROMINOES[0].shape.map(row => [...row])], // I-piece with deep copied shape
      color: TETROMINOES[0].color,
      position: { x: Math.floor(GRID_WIDTH / 2) - 2, y: 0 },
      rotation: 0
    };
    
    const randomIndex = Math.floor(Math.random() * TETROMINOES.length);
    const initialNextTetromino = {
      shape: [...TETROMINOES[randomIndex].shape.map(row => [...row])], // Deep copied shape
      color: TETROMINOES[randomIndex].color,
      position: { x: 0, y: 0 },
      rotation: 0
    };
    
    console.log("Created initial tetromino:", initialTetromino);
    console.log("Created initial next tetromino:", initialNextTetromino);
    
    // Reset drop time
    dropTimeRef.current = 1000;
    lastTimeRef.current = 0;
    
    // Clean up any existing game loops
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    if (dropIntervalRef.current) {
      clearInterval(dropIntervalRef.current);
      dropIntervalRef.current = null;
    }
    
    // Set the tetrominos and game state - must be done before setting up intervals
    setCurrentTetromino(initialTetromino);
    setNextTetromino(initialNextTetromino);
    setGameState(GameState.PLAYING);
    
    // Start the render loop first to show the initial state
    const renderLoop = () => {
      drawBoard();
      drawPreview();
      gameLoopRef.current = requestAnimationFrame(renderLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(renderLoop);
    
    // Store the initial tetromino locally for the timeout to use
    const activeTetromino = initialTetromino;
    
    // Add a delay before starting the drop interval to ensure state is updated
    setTimeout(() => {
      console.log("Setting up drop interval...");
      
      // Use the local variable instead of state which may not be updated yet
      console.log("Initial tetromino for interval:", activeTetromino);
      
      // Set up auto-drop interval using direct function instead of dropTetromino
      dropIntervalRef.current = window.setInterval(() => {
        // This will use the latest state from closure, not the stale one
        dropTetromino();
      }, dropTimeRef.current);
    }, 500); // Longer delay to ensure React state updates
    
  }, [drawBoard, drawPreview, dropTetromino]);
  
  // Pause the game
  const pauseGame = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    }
  }, [gameState]);
  
  // Resume the game
  const resumeGame = useCallback(() => {
    if (gameState === GameState.PAUSED) {
      // First update the state
      setGameState(GameState.PLAYING);
      
      // Restart the drop interval with just the function reference
      if (!dropIntervalRef.current) {
        dropIntervalRef.current = window.setInterval(dropTetromino, dropTimeRef.current);
      }
    }
  }, [gameState, dropTetromino]);
  
  // Game over check
  const checkGameOver = useCallback(() => {
    if (currentTetromino && isColliding(currentTetromino)) {
      setGameState(GameState.GAME_OVER);
      
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    }
  }, [currentTetromino, isColliding]);
  
  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameState === GameState.PLAYING) {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          moveTetromino('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          moveTetromino('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          dropTetromino();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          rotateTetromino();
          break;
        case ' ':
          event.preventDefault();
          hardDrop();
          break;
        case 'Escape':
          event.preventDefault();
          if (gameState === GameState.PLAYING) {
            pauseGame();
          } else if (gameState === GameState.PAUSED) {
            resumeGame();
          }
          break;
      }
    } else if (gameState === GameState.PAUSED && event.key === 'Escape') {
      resumeGame();
    }
  }, [gameState, moveTetromino, dropTetromino, rotateTetromino, hardDrop, pauseGame, resumeGame]);
  
  // Handle touch input for mobile devices
  const handleTouchInput = useCallback((action: 'left' | 'right' | 'down' | 'rotate' | 'drop') => {
    if (gameState !== GameState.PLAYING) return;
    
    switch (action) {
      case 'left':
        moveTetromino('left');
        break;
      case 'right':
        moveTetromino('right');
        break;
      case 'down':
        dropTetromino();
        break;
      case 'rotate':
        rotateTetromino();
        break;
      case 'drop':
        hardDrop();
        break;
    }
  }, [gameState, moveTetromino, dropTetromino, rotateTetromino, hardDrop]);
  
  // Setup event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Game loop to check for game over
  useEffect(() => {
    if (gameState === GameState.PLAYING && currentTetromino) {
      checkGameOver();
    }
  }, [gameState, currentTetromino, checkGameOver]);
  
  // Load high score from localStorage on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('tetris-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
      }
    };
  }, []);
  
  // Adjust drop interval when level changes
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
      }
      
      // Use simple interval with just the function reference
      dropIntervalRef.current = window.setInterval(dropTetromino, dropTimeRef.current);
    }
    
    return () => {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
      }
    };
  }, [level, gameState, dropTetromino]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12">
          <Container>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Tetris</h1>
              <p className="text-gray-600">
                The classic block-stacking game. Arrange the falling tetrominos to create complete lines.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* Score and level display */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Score</div>
                      <div className="font-bold text-xl">{score}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Level</div>
                      <div className="font-bold text-xl">{level}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Lines</div>
                      <div className="font-bold text-xl">{lines}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Main game canvas */}
                    <div className="relative border-2 border-gray-200 rounded-md overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        width={GRID_WIDTH * CELL_SIZE}
                        height={GRID_HEIGHT * CELL_SIZE}
                        className="bg-gray-50"
                        style={{ width: '300px', height: '600px' }}
                      />
                      
                      {gameState === GameState.READY && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                          <div className="text-center p-6">
                            <h3 className="text-2xl font-bold mb-4">Tetris</h3>
                            <p className="mb-6">Arrange falling blocks to create complete horizontal lines.</p>
                            <Button onClick={() => {
                              console.log("Start button clicked");
                              initGame();
                            }} size="lg">
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
                    
                    {/* Next piece preview and controls (for larger screens) */}
                    <div className="hidden md:block space-y-6">
                      <div>
                        <h3 className="font-bold text-lg mb-2">Next Piece</h3>
                        <div className="border-2 border-gray-200 rounded-md overflow-hidden bg-gray-50">
                          <canvas
                            ref={previewCanvasRef}
                            width={4 * PREVIEW_CELL_SIZE}
                            height={4 * PREVIEW_CELL_SIZE}
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg mb-2">High Score</h3>
                        <div className="bg-gray-100 p-3 rounded-md text-center">
                          <div className="font-bold text-xl">{highScore}</div>
                        </div>
                      </div>
                      
                      {gameState === GameState.PLAYING && (
                        <Button onClick={pauseGame} variant="outline" className="w-full">
                          Pause Game
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile controls */}
                  <div className="md:hidden mt-6">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg mb-2">Next Piece</h3>
                      <div className="border-2 border-gray-200 rounded-md overflow-hidden bg-gray-50 inline-block">
                        <canvas
                          ref={previewCanvasRef}
                          width={4 * PREVIEW_CELL_SIZE}
                          height={4 * PREVIEW_CELL_SIZE}
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
                      <div></div>
                      <button
                        className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                        onClick={() => handleTouchInput('rotate')}
                      >
                        <span className="text-xl">↻</span>
                      </button>
                      <div></div>
                      <button
                        className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                        onClick={() => handleTouchInput('drop')}
                      >
                        <span className="text-xl">⤓</span>
                      </button>
                      <div></div>
                      
                      <button
                        className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                        onClick={() => handleTouchInput('left')}
                      >
                        <span className="text-xl">←</span>
                      </button>
                      
                      <button
                        className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                        onClick={() => handleTouchInput('down')}
                      >
                        <span className="text-xl">↓</span>
                      </button>
                      
                      <button
                        className="p-4 bg-gray-200 rounded-md active:bg-gray-300"
                        onClick={() => handleTouchInput('right')}
                      >
                        <span className="text-xl">→</span>
                      </button>
                      
                      <div></div>
                    </div>
                    
                    {gameState === GameState.PLAYING && (
                      <Button onClick={pauseGame} variant="outline" className="w-full mt-4">
                        Pause Game
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4">How to Play</h3>
                  
                  <div className="space-y-4">
                    <p>
                      Tetris is a classic tile-matching puzzle game. The goal is to manipulate falling
                      tetrominos to create complete horizontal lines, which then disappear and award points.
                    </p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Scoring</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>1 line: 100 × level</li>
                        <li>2 lines: 300 × level</li>
                        <li>3 lines: 500 × level</li>
                        <li>4 lines (Tetris): 800 × level</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Levels</h4>
                      <p>
                        You advance to the next level after clearing 10 lines. Each level increases the
                        falling speed of the tetrominos.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Controls</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Arrow Left / A: Move tetromino left</li>
                        <li>Arrow Right / D: Move tetromino right</li>
                        <li>Arrow Down / S: Drop tetromino by one row</li>
                        <li>Arrow Up / W: Rotate tetromino</li>
                        <li>Spacebar: Hard drop (instantly drop to bottom)</li>
                        <li>Escape: Pause/Resume game</li>
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