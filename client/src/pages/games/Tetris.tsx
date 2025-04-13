import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Constants
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 20;

// Tetromino shapes represented as 4x4 grid with 1s where the shape is
const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#00DFFC" // Cyan
  },
  J: {
    shape: [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#0341AE" // Blue
  },
  L: {
    shape: [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#FF971C" // Orange
  },
  O: {
    shape: [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#FFD500" // Yellow
  },
  S: {
    shape: [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#59B101" // Green
  },
  T: {
    shape: [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#9900FA" // Purple
  },
  Z: {
    shape: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "#FF2128" // Red
  }
};

// Game states
enum GameState {
  READY = "READY",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER"
}

// Tetromino type definition
interface Tetromino {
  shape: number[][];
  color: string;
  position: { x: number; y: number };
  rotation: number;
}

// Helper functions for grid manipulation
// Type for grid cells - can be null or a color string
type GridCell = string | null;

const createEmptyGrid = (): GridCell[][] => 
  Array.from({ length: GRID_HEIGHT }, () => 
    Array.from({ length: GRID_WIDTH }, () => null)
  );

const createEmptyPreviewGrid = () => 
  Array.from({ length: 4 }, () => 
    Array.from({ length: 4 }, () => null)
  );

const rotateMatrix = (matrix: number[][]) => {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      result[j][N - 1 - i] = matrix[i][j];
    }
  }
  
  return result;
};

const randomTetromino = (): Tetromino => {
  const tetrominoNames = Object.keys(TETROMINOS) as Array<keyof typeof TETROMINOS>;
  const randomName = tetrominoNames[Math.floor(Math.random() * tetrominoNames.length)];
  const tetromino = TETROMINOS[randomName];
  
  return {
    shape: [...tetromino.shape], // Clone the shape
    color: tetromino.color,
    position: { x: Math.floor(GRID_WIDTH / 2) - 2, y: 0 },
    rotation: 0
  };
};

export default function Tetris() {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  
  // Game elements
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino | null>(null);
  const [nextTetromino, setNextTetromino] = useState<Tetromino | null>(null);
  
  // Game loop ref
  const gameLoopRef = useRef<number | null>(null);
  const dropIntervalRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dropTimeRef = useRef<number>(1000); // Initial drop time in ms
  
  // Draw the game board
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (!canvas || !context) return;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    context.strokeStyle = '#ddd';
    context.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 0; i <= GRID_WIDTH; i++) {
      context.beginPath();
      context.moveTo(i * CELL_SIZE, 0);
      context.lineTo(i * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
      context.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= GRID_HEIGHT; i++) {
      context.beginPath();
      context.moveTo(0, i * CELL_SIZE);
      context.lineTo(GRID_WIDTH * CELL_SIZE, i * CELL_SIZE);
      context.stroke();
    }
    
    // Draw the settled blocks
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cellColor = grid[y][x];
        if (cellColor) {
          context.fillStyle = cellColor;
          context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          
          // Draw block border
          context.strokeStyle = '#000';
          context.lineWidth = 1;
          context.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          
          // Draw inner highlight
          context.strokeStyle = '#fff';
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x * CELL_SIZE + 1, y * CELL_SIZE + CELL_SIZE - 1);
          context.lineTo(x * CELL_SIZE + 1, y * CELL_SIZE + 1);
          context.lineTo(x * CELL_SIZE + CELL_SIZE - 1, y * CELL_SIZE + 1);
          context.stroke();
        }
      }
    }
    
    // Draw the current tetromino
    if (currentTetromino) {
      const { shape, color, position } = currentTetromino;
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const posX = (position.x + x) * CELL_SIZE;
            const posY = (position.y + y) * CELL_SIZE;
            
            context.fillStyle = color;
            context.fillRect(posX, posY, CELL_SIZE, CELL_SIZE);
            
            // Draw block border
            context.strokeStyle = '#000';
            context.lineWidth = 1;
            context.strokeRect(posX, posY, CELL_SIZE, CELL_SIZE);
            
            // Draw inner highlight
            context.strokeStyle = '#fff';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(posX + 1, posY + CELL_SIZE - 1);
            context.lineTo(posX + 1, posY + 1);
            context.lineTo(posX + CELL_SIZE - 1, posY + 1);
            context.stroke();
          }
        }
      }
    }
  }, [grid, currentTetromino]);
  
  // Draw the next tetromino preview
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (!canvas || !context || !nextTetromino) return;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    context.fillStyle = '#f8f9fa';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    context.strokeStyle = '#ddd';
    context.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 0; i <= 4; i++) {
      context.beginPath();
      context.moveTo(i * PREVIEW_CELL_SIZE, 0);
      context.lineTo(i * PREVIEW_CELL_SIZE, 4 * PREVIEW_CELL_SIZE);
      context.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      context.beginPath();
      context.moveTo(0, i * PREVIEW_CELL_SIZE);
      context.lineTo(4 * PREVIEW_CELL_SIZE, i * PREVIEW_CELL_SIZE);
      context.stroke();
    }
    
    // Draw the next tetromino
    const { shape, color } = nextTetromino;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const posX = x * PREVIEW_CELL_SIZE;
          const posY = y * PREVIEW_CELL_SIZE;
          
          context.fillStyle = color;
          context.fillRect(posX, posY, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
          
          // Draw block border
          context.strokeStyle = '#000';
          context.lineWidth = 1;
          context.strokeRect(posX, posY, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
          
          // Draw inner highlight
          context.strokeStyle = '#fff';
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(posX + 1, posY + PREVIEW_CELL_SIZE - 1);
          context.lineTo(posX + 1, posY + 1);
          context.lineTo(posX + PREVIEW_CELL_SIZE - 1, posY + 1);
          context.stroke();
        }
      }
    }
  }, [nextTetromino]);
  
  // Check for collisions
  const isColliding = useCallback((tetromino: Tetromino, position = { x: 0, y: 0 }) => {
    const { shape } = tetromino;
    const { x: posX, y: posY } = tetromino.position;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = posX + x + position.x;
          const newY = posY + y + position.y;
          
          // Check if out of bounds
          if (
            newX < 0 || 
            newX >= GRID_WIDTH || 
            newY >= GRID_HEIGHT
          ) {
            return true;
          }
          
          // Check if colliding with settled blocks
          if (newY >= 0 && grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    
    return false;
  }, [grid]);
  
  // Rotate tetromino
  const rotateTetromino = useCallback(() => {
    if (!currentTetromino) return;
    
    const rotatedShape = rotateMatrix(currentTetromino.shape);
    const newTetromino = {
      ...currentTetromino,
      shape: rotatedShape,
      rotation: (currentTetromino.rotation + 1) % 4
    };
    
    // Check if the rotation causes a collision
    if (!isColliding(newTetromino)) {
      setCurrentTetromino(newTetromino);
    } else {
      // Try wall kick (move left or right if necessary)
      const wallKickOffsets = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -2, y: 0 }
      ];
      
      for (const offset of wallKickOffsets) {
        const kickedTetromino = {
          ...newTetromino,
          position: {
            x: newTetromino.position.x + offset.x,
            y: newTetromino.position.y
          }
        };
        
        if (!isColliding(kickedTetromino)) {
          setCurrentTetromino(kickedTetromino);
          return;
        }
      }
    }
  }, [currentTetromino, isColliding]);
  
  // Move tetromino horizontally
  const moveTetromino = useCallback((direction: 'left' | 'right') => {
    if (!currentTetromino || gameState !== GameState.PLAYING) return;
    
    const positionChange = direction === 'left' ? -1 : 1;
    const newPosition = {
      ...currentTetromino.position,
      x: currentTetromino.position.x + positionChange
    };
    
    const newTetromino = {
      ...currentTetromino,
      position: newPosition
    };
    
    if (!isColliding(newTetromino)) {
      setCurrentTetromino(newTetromino);
    }
  }, [currentTetromino, gameState, isColliding]);
  
  // Drop tetromino by one cell
  const dropTetromino = useCallback(() => {
    if (!currentTetromino || gameState !== GameState.PLAYING) return;
    
    const newPosition = {
      ...currentTetromino.position,
      y: currentTetromino.position.y + 1
    };
    
    const newTetromino = {
      ...currentTetromino,
      position: newPosition
    };
    
    if (!isColliding(newTetromino)) {
      setCurrentTetromino(newTetromino);
    } else {
      // The tetromino cannot move down further, so lock it in place
      settleBlock();
    }
  }, [currentTetromino, gameState, isColliding]);
  
  // Hard drop (instantly drop to bottom)
  const hardDrop = useCallback(() => {
    if (!currentTetromino || gameState !== GameState.PLAYING) return;
    
    let newY = currentTetromino.position.y;
    
    // Find the lowest position without collision
    while (!isColliding({
      ...currentTetromino,
      position: { ...currentTetromino.position, y: newY + 1 }
    })) {
      newY++;
    }
    
    setCurrentTetromino({
      ...currentTetromino,
      position: { ...currentTetromino.position, y: newY }
    });
    
    // Immediately settle the block
    settleBlock();
  }, [currentTetromino, gameState, isColliding]);
  
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
  }, [currentTetromino, grid, score, lines, level, highScore]);
  
  // Spawn a new tetromino
  const spawnTetromino = useCallback(() => {
    // Use the next tetromino as the current one
    if (nextTetromino) {
      setCurrentTetromino({
        ...nextTetromino,
        position: { x: Math.floor(GRID_WIDTH / 2) - 2, y: 0 }
      });
    } else {
      setCurrentTetromino(randomTetromino());
    }
    
    // Generate a new next tetromino
    setNextTetromino(randomTetromino());
  }, [nextTetromino]);
  
  // Initialize the game
  const initGame = useCallback(() => {
    // Reset game state
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameState(GameState.PLAYING);
    
    // Spawn initial tetrominos
    const initialTetromino = randomTetromino();
    const initialNextTetromino = randomTetromino();
    
    setCurrentTetromino(initialTetromino);
    setNextTetromino(initialNextTetromino);
    
    // Reset drop time
    dropTimeRef.current = 1000;
    lastTimeRef.current = 0;
    
    // Start the game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    if (dropIntervalRef.current) {
      clearInterval(dropIntervalRef.current);
    }
    
    // Set up auto-drop interval - using a closure to capture current state
    // We don't need to check gameState here since we just set it and 
    // the interval will be cleared when the game state changes
    dropIntervalRef.current = window.setInterval(dropTetromino, dropTimeRef.current);
    
    // Start the render loop
    const renderLoop = () => {
      drawBoard();
      drawPreview();
      gameLoopRef.current = requestAnimationFrame(renderLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(renderLoop);
  }, [drawBoard, drawPreview, dropTetromino, gameState]);
  
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
                      <Badge variant="outline" className="mr-2">Keyboard Controls</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">Move Left</div>
                        <div className="text-sm text-gray-500">Arrow Left / A</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">Move Right</div>
                        <div className="text-sm text-gray-500">Arrow Right / D</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">Move Down</div>
                        <div className="text-sm text-gray-500">Arrow Down / S</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">Rotate</div>
                        <div className="text-sm text-gray-500">Arrow Up / W</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">Hard Drop</div>
                        <div className="text-sm text-gray-500">Spacebar</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="font-medium">Pause/Resume</div>
                        <div className="text-sm text-gray-500">Escape Key</div>
                      </div>
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