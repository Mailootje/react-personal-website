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
  
  console.log(`Creating tetromino with index ${randIndex}, color: ${color}`);
  console.log("Shape:", JSON.stringify(shape));
  
  // Check if shape is valid
  if (!shape || !Array.isArray(shape) || shape.length === 0) {
    console.error("Invalid shape in tetromino:", shape);
    // Provide a default shape as fallback (I-piece)
    return {
      shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      color: '#00FFFF',
      position: { x: Math.floor(GRID_WIDTH / 2) - 2, y: 0 },
      rotation: 0
    };
  }
  
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
        if (shape[y][x] === 1) { // Explicitly check for active cells
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
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a border around the entire grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
    ctx.lineWidth = 1;
    
    // Draw grid
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 1; x < GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 1; y < GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw grid cell backgrounds
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        // Light background for grid cells
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
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
          
          // Add a highlight effect to make the pieces look better
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 10, CELL_SIZE - 10);
        }
      }
    }
    
    // Draw a ghost piece (shadow of where the piece will land)
    if (currentTetromino && gameState === GameState.PLAYING) {
      const ghostTetromino = cloneTetromino(currentTetromino);
      let ghostY = ghostTetromino.position.y;
      
      // Find the lowest position without collision
      while (!isColliding({
        ...ghostTetromino,
        position: { ...ghostTetromino.position, y: ghostY + 1 }
      })) {
        ghostY++;
      }
      
      ghostTetromino.position.y = ghostY;
      
      // Skip drawing ghost if it's at the same position as the current piece
      if (ghostY !== currentTetromino.position.y) {
        const { shape, position } = ghostTetromino;
        
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] === 1) { // Explicitly check for 1 (active cell)
              const pixelX = (position.x + x) * CELL_SIZE;
              const pixelY = (position.y + y) * CELL_SIZE;
              
              // Only draw if within grid boundaries and visible
              if (
                position.y + y >= 0 && 
                position.y + y < GRID_HEIGHT && 
                position.x + x >= 0 && 
                position.x + x < GRID_WIDTH
              ) {
                // Draw ghost piece with outlines only
                ctx.strokeStyle = '#777';
                ctx.strokeRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
                ctx.strokeRect(pixelX + 2, pixelY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
              }
            }
          }
        }
      }
    }
  }, [grid, currentTetromino, gameState, isColliding]);
  
  // Draw the current tetromino on the game board
  const drawCurrentTetromino = useCallback((tetrominoToDraw?: Tetromino) => {
    // Use provided tetromino or fall back to current state
    const tetromino = tetrominoToDraw || currentTetromino;
    
    console.log("drawCurrentTetromino called with tetromino:", tetromino);
    
    const canvas = canvasRef.current;
    if (!canvas || !tetromino) {
      console.log("Cannot draw tetromino: canvas or tetromino is null");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log("Cannot draw tetromino: ctx is null");
      return;
    }
    
    const { shape, color, position } = tetromino;
    
    console.log("Drawing tetromino:", {
      shape,
      color,
      position,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });
    
    // Set the fill color
    ctx.fillStyle = color;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] === 1) { // Explicitly check for 1 (active cell)
          const drawX = (position.x + x) * CELL_SIZE;
          const drawY = (position.y + y) * CELL_SIZE;
          
          console.log(`Drawing block at (${drawX}, ${drawY})`);
          
          // Only draw if within visible part of the grid
          if (position.y + y >= 0) {
            // Fill the cell with the tetromino color
            ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
            
            // Draw cell border with a more visible outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
            
            // Add a highlight effect to make the pieces look better
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(drawX + 1, drawY + 1, CELL_SIZE - 10, CELL_SIZE - 10);
            
            // Restore the color for the next block
            ctx.fillStyle = color;
          }
        }
      }
    }
  }, [currentTetromino]);

  // Draw the next piece preview
  const drawPreview = useCallback((tetrominoToDraw?: Tetromino) => {
    // Use provided tetromino or fall back to current state
    const tetromino = tetrominoToDraw || nextTetromino;
    
    const canvas = previewCanvasRef.current;
    if (!canvas || !tetromino) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 0.5;
    
    for (let x = 1; x < 4; x++) {
      ctx.beginPath();
      ctx.moveTo(x * PREVIEW_CELL_SIZE, 0);
      ctx.lineTo(x * PREVIEW_CELL_SIZE, 4 * PREVIEW_CELL_SIZE);
      ctx.stroke();
    }
    
    for (let y = 1; y < 4; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * PREVIEW_CELL_SIZE);
      ctx.lineTo(4 * PREVIEW_CELL_SIZE, y * PREVIEW_CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw next tetromino
    const { shape, color } = tetromino;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    
    ctx.fillStyle = color;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] === 1) { // Explicitly check for 1 (active cell)
          const drawX = (offsetX + x) * PREVIEW_CELL_SIZE;
          const drawY = (offsetY + y) * PREVIEW_CELL_SIZE;
          
          // Draw the block
          ctx.fillRect(drawX, drawY, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
          
          // Draw cell border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(drawX, drawY, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
          
          // Add a highlight effect
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(drawX + 1, drawY + 1, PREVIEW_CELL_SIZE - 10, PREVIEW_CELL_SIZE - 10);
          
          // Restore the color for the next block
          ctx.fillStyle = color;
        }
      }
    }
  }, [nextTetromino]);
  
  // Move the tetromino left, right, or down
  const moveTetromino = useCallback((direction: 'left' | 'right') => {
    console.log(`🎮 moveTetromino called, direction: ${direction}`);
    
    if (!currentTetromino) {
      console.error("❌ Cannot move: currentTetromino is null or undefined");
      return;
    }
    
    if (gameState !== GameState.PLAYING) {
      console.error(`❌ Cannot move: game state is ${gameState}, not PLAYING`);
      return;
    }
    
    const deltaX = direction === 'left' ? -1 : 1;
    console.log(`🎮 Moving ${direction}, delta: ${deltaX}`);
    console.log(`🎮 Current position: x=${currentTetromino.position.x}, y=${currentTetromino.position.y}`);
    
    try {
      // Create a deep copy of the tetromino with new position
      const newTetromino = cloneTetromino(currentTetromino);
      newTetromino.position.x += deltaX;
      console.log(`🎮 New position: x=${newTetromino.position.x}, y=${newTetromino.position.y}`);
      
      const collision = isColliding(newTetromino);
      console.log(`🎮 Collision check: ${collision}`);
      
      if (!collision) {
        console.log("🎮 No collision, updating tetromino position");
        setCurrentTetromino(newTetromino);
      } else {
        console.log("🎮 Collision detected, cannot move");
      }
    } catch (error) {
      console.error("❌ Error in moveTetromino:", error);
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
    if (!currentTetromino) {
      console.log("Cannot settle: no current tetromino");
      return;
    }
    
    console.log("Settling block at position:", currentTetromino.position);
    
    // Create a deep copy of the grid to avoid state mutation issues
    const newGrid = [...grid.map(row => [...row])];
    const { shape, color, position } = currentTetromino;
    
    // Add the current tetromino to the grid
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] === 1) { // Explicitly check for 1 (active cell)
          const gridY = position.y + y;
          const gridX = position.x + x;
          
          console.log(`Settling block at grid: [${gridX}, ${gridY}] with color: ${color}`);
          
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
    
    console.log("Completed lines:", completedLines);
    
    // Remove completed lines and add empty rows at the top
    if (completedLines.length > 0) {
      const removedLines = completedLines.length;
      
      // Sort the completed lines in descending order to avoid index shifting issues
      const sortedLines = [...completedLines].sort((a, b) => b - a);
      
      // Remove completed lines from highest row index to lowest
      for (const line of sortedLines) {
        newGrid.splice(line, 1);
        newGrid.unshift(Array(GRID_WIDTH).fill(null));
      }
      
      // Update score and lines
      const linePoints = [0, 100, 300, 500, 800]; // Points for clearing 0, 1, 2, 3, or 4 lines
      const newScore = score + linePoints[removedLines] * level;
      const newLines = lines + removedLines;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      console.log(`Cleared ${removedLines} lines, new score: ${newScore}, new level: ${newLevel}`);
      
      setScore(newScore);
      setLines(newLines);
      
      // Only update level if it changed
      if (newLevel !== level) {
        setLevel(newLevel);
      }
      
      // Update high score if needed
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('tetris-high-score', newScore.toString());
      }
      
      // Adjust drop speed based on level - this will be used by the next scheduled drop
      dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
    }
    
    // First update the grid
    setGrid(newGrid);
    
    // Then spawn a new tetromino
    // Separate this with setTimeout to ensure the grid is updated first
    setTimeout(() => {
      spawnTetromino();
    }, 0);
  }, [currentTetromino, grid, score, lines, level, highScore, spawnTetromino]);
  
  // Drop tetromino by one cell
  const dropTetromino = useCallback(() => {
    console.log("Drop tetromino called, current state:", gameState);
    console.log("Current tetromino:", currentTetromino);
    
    if (!currentTetromino) {
      console.error("⚠️ No current tetromino, cannot drop");
      return;
    }
    
    if (gameState !== GameState.PLAYING) {
      console.error("⚠️ Game not in PLAYING state, cannot drop, state is:", gameState);
      return;
    }
    
    console.log("Trying to drop tetromino from", currentTetromino.position);
    
    try {
      // Create a deep copy of the tetromino with new position
      const newTetromino = cloneTetromino(currentTetromino);
      newTetromino.position.y += 1;
      
      const collision = isColliding(newTetromino);
      console.log("Collision?", collision);
      
      if (!collision) {
        console.log("Moving tetromino down to", newTetromino.position);
        console.log("Before update, current tetromino:", currentTetromino);
        setCurrentTetromino(newTetromino);
        console.log("After update, setting to:", newTetromino);
      } else {
        console.log("Collision detected, settling block");
        // The tetromino cannot move down further, so lock it in place
        settleBlock();
      }
    } catch (error) {
      console.error("Error in dropTetromino:", error);
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
    
    // Reset everything first to ensure a clean state
    setGameState(GameState.PLAYING); // Set this first to update game state immediately
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    
    // Create initial tetrominos using randomTetromino to ensure proper deep copying
    const initialTetromino = randomTetromino();
    initialTetromino.position.y = 0; // Start at the top
    
    const initialNextTetromino = randomTetromino();
    
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
      clearTimeout(dropIntervalRef.current);
      dropIntervalRef.current = null;
    }
    
    // Immediately set the tetrominos - don't use setTimeout which can cause delays
    console.log("Setting initial tetrominos...");
    setCurrentTetromino(initialTetromino);
    setNextTetromino(initialNextTetromino);
    
    // Create new render loop instance - this ensures we capture the latest state
    const newRenderLoop = () => {
      // Log the actual current state from React state
      console.log("Render loop called, gameState:", gameState);
      console.log("Current tetromino in render loop:", currentTetromino);
      
      // Always draw the board
      drawBoard();
      
      // Draw the current tetromino - on the first frame use initialTetromino,
      // but then use the React state as it updates
      if (currentTetromino) {
        drawCurrentTetromino(currentTetromino);
      } else {
        // Fallback to initialTetromino only on first render
        drawCurrentTetromino(initialTetromino);
      }
      
      // Draw preview similarly
      if (nextTetromino) {
        drawPreview(nextTetromino);
      } else {
        drawPreview(initialNextTetromino);
      }
      
      // Continue animation loop
      gameLoopRef.current = requestAnimationFrame(newRenderLoop);
    };
    
    // Start the render loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    gameLoopRef.current = requestAnimationFrame(newRenderLoop);
    
    // Use a more reliable approach with setTimeout instead of setInterval
    // This ensures that each drop operation completes before scheduling the next one
    const scheduleDrop = () => {
      dropIntervalRef.current = window.setTimeout(() => {
        // Get the current game state directly, avoid capturing old state in closure
        const currentGameState = GameState.PLAYING; // Force it to be playing for this first drop
        console.log("Auto drop scheduled, current game state:", currentGameState);
        
        // Check game state before dropping
        if (currentGameState === GameState.PLAYING) {
          console.log("Dropping tetromino in auto drop");
          dropTetromino();
          // Schedule the next drop after this one completes
          scheduleDrop();
        } else {
          console.log("Not dropping tetromino, game state is not PLAYING");
        }
      }, dropTimeRef.current);
    };
    
    // Add a small delay before starting the first drop to ensure React state is updated
    setTimeout(() => {
      console.log("Starting game loop...");
      scheduleDrop();
    }, 300);
    
  }, [drawBoard, drawCurrentTetromino, drawPreview, dropTetromino, gameState]);
  
  // Create a recursive drop scheduler for reuse
  const createScheduleDrop = useCallback(() => {
    return function scheduleDrop() {
      dropIntervalRef.current = window.setTimeout(() => {
        console.log("Auto drop scheduled");
        // Only drop if the game is still playing
        if (gameState === GameState.PLAYING) {
          dropTetromino();
          // Schedule the next drop after this one completes
          scheduleDrop();
        }
      }, dropTimeRef.current);
    };
  }, [gameState, dropTetromino]);

  // Pause the game
  const pauseGame = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      
      if (dropIntervalRef.current) {
        clearTimeout(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    }
  }, [gameState]);
  
  // Resume the game
  const resumeGame = useCallback(() => {
    if (gameState === GameState.PAUSED) {
      // First update the state
      setGameState(GameState.PLAYING);
      
      // Restart the drop with our recursive scheduler
      if (!dropIntervalRef.current) {
        const scheduleDrop = createScheduleDrop();
        scheduleDrop();
      }
    }
  }, [gameState, createScheduleDrop]);
  
  // Game over check
  const checkGameOver = useCallback(() => {
    if (currentTetromino && isColliding(currentTetromino)) {
      console.log("GAME OVER: Tetromino is colliding at starting position");
      setGameState(GameState.GAME_OVER);
      
      // Clean up all game loops
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      
      if (dropIntervalRef.current) {
        clearTimeout(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    }
  }, [currentTetromino, isColliding]);
  
  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log("🎮 Key pressed:", event.key, "GameState:", gameState);
    
    if (gameState === GameState.PLAYING) {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          console.log("🎮 Moving LEFT");
          moveTetromino('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          console.log("🎮 Moving RIGHT");
          moveTetromino('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          console.log("🎮 Moving DOWN");
          dropTetromino();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          console.log("🎮 ROTATING");
          rotateTetromino();
          break;
        case ' ':
          event.preventDefault();
          console.log("🎮 HARD DROP");
          hardDrop();
          break;
        case 'Escape':
          event.preventDefault();
          console.log("🎮 PAUSE/RESUME");
          if (gameState === GameState.PLAYING) {
            pauseGame();
          } else if (gameState === GameState.PAUSED) {
            resumeGame();
          }
          break;
      }
    } else if (gameState === GameState.PAUSED && event.key === 'Escape') {
      console.log("🎮 RESUMING from paused state");
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
        gameLoopRef.current = null;
      }
      
      if (dropIntervalRef.current) {
        clearTimeout(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    };
  }, []);
  
  // Adjust drop speed when level changes
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      // Update drop time based on level
      dropTimeRef.current = Math.max(100, 1000 - (level - 1) * 100);
      
      // We don't need to restart the timeout here as it's handled by the recursive scheduleDrop function
      console.log(`Level changed to ${level}, drop time adjusted to ${dropTimeRef.current}ms`);
    }
  }, [level, gameState]);
  
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