import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Game constants
const CELL_SIZE = 20;
const GRID_WIDTH = 28;
const GRID_HEIGHT = 31;
const CANVAS_WIDTH = CELL_SIZE * GRID_WIDTH;
const CANVAS_HEIGHT = CELL_SIZE * GRID_HEIGHT;

// Game entities
enum EntityType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  PACMAN = 4,
  GHOST = 5
}

// Directions
enum Direction {
  NONE = 0,
  UP = 1,
  RIGHT = 2,
  DOWN = 3,
  LEFT = 4
}

// Game state
enum GameState {
  READY = "READY",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
  WIN = "WIN"
}

// Colors
const COLORS = {
  WALL: '#2121ff',
  EMPTY: '#000',
  DOT: '#ffb8ae',
  POWER_PELLET: '#ffb8ae',
  PACMAN: '#ffff00',
  BLINKY: '#ff0000', // Red ghost
  PINKY: '#ffb8ff',  // Pink ghost
  INKY: '#00ffff',   // Cyan ghost
  CLYDE: '#ffb851',  // Orange ghost
  FRIGHTENED: '#0000ff', // Blue ghost (frightened mode)
  TEXT: '#fff'
};

// Ghost names (for tracking)
enum GhostName {
  BLINKY = 'BLINKY',
  PINKY = 'PINKY',
  INKY = 'INKY',
  CLYDE = 'CLYDE'
}

// Interface for game entities
interface Entity {
  x: number;
  y: number;
  type: EntityType;
}

// Interface for Pacman
interface Pacman extends Entity {
  direction: Direction;
  nextDirection: Direction;
  mouthOpen: boolean;
  mouthAngle: number;
}

// Interface for Ghost
interface Ghost extends Entity {
  name: GhostName;
  direction: Direction;
  frightened: boolean;
  eaten: boolean;
  frightenedTimer: number;
}

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [highScore, setHighScore] = useState<number>(0);
  
  // Game loop refs
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Game entities
  const [pacman, setPacman] = useState<Pacman>({
    x: 14,
    y: 23,
    type: EntityType.PACMAN,
    direction: Direction.NONE,
    nextDirection: Direction.NONE,
    mouthOpen: true,
    mouthAngle: 0.2
  });
  
  const [ghosts, setGhosts] = useState<Ghost[]>([
    {
      x: 14, y: 11, type: EntityType.GHOST, name: GhostName.BLINKY, 
      direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
    },
    {
      x: 12, y: 14, type: EntityType.GHOST, name: GhostName.PINKY, 
      direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
    },
    {
      x: 14, y: 14, type: EntityType.GHOST, name: GhostName.INKY, 
      direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
    },
    {
      x: 16, y: 14, type: EntityType.GHOST, name: GhostName.CLYDE, 
      direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
    }
  ]);
  
  // Level data (this is a simplified level layout)
  const [level1, setLevel1] = useState<number[][]>([
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]);
  
  // Count dots remaining
  const [dotsRemaining, setDotsRemaining] = useState<number>(0);
  
  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('pacman-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
    
    // Count initial dots
    let dots = 0;
    level1.forEach(row => {
      row.forEach(cell => {
        if (cell === EntityType.DOT || cell === EntityType.POWER_PELLET) {
          dots++;
        }
      });
    });
    setDotsRemaining(dots);
  }, []);
  
  // Update game logic - moving it here to avoid initialization issues
  const update = React.useCallback((deltaTime: number) => {
    // Double-check that game state is PLAYING
    if (gameState !== GameState.PLAYING) return;
    
    // Update Pacman animation (mouth opening/closing)
    setPacman(prevPacman => ({
      ...prevPacman,
      mouthOpen: !prevPacman.mouthOpen
    }));
    
    // Try to change Pacman's direction if there's a queued direction
    if (pacman.nextDirection !== Direction.NONE && pacman.nextDirection !== pacman.direction) {
      const newX = pacman.x;
      const newY = pacman.y;
      
      // Check if the direction change is valid (not hitting a wall)
      let canChangeDirection = false;
      
      switch (pacman.nextDirection) {
        case Direction.UP:
          canChangeDirection = newY > 0 && level1[newY - 1][newX] !== EntityType.WALL;
          break;
        case Direction.RIGHT:
          canChangeDirection = newX < GRID_WIDTH - 1 && level1[newY][newX + 1] !== EntityType.WALL;
          break;
        case Direction.DOWN:
          canChangeDirection = newY < GRID_HEIGHT - 1 && level1[newY + 1][newX] !== EntityType.WALL;
          break;
        case Direction.LEFT:
          canChangeDirection = newX > 0 && level1[newY][newX - 1] !== EntityType.WALL;
          break;
      }
      
      if (canChangeDirection) {
        setPacman(prevPacman => ({
          ...prevPacman,
          direction: prevPacman.nextDirection,
          nextDirection: Direction.NONE
        }));
      }
    }
    
    // Move Pacman based on current direction
    let newX = pacman.x;
    let newY = pacman.y;
    
    switch (pacman.direction) {
      case Direction.UP:
        newY--;
        break;
      case Direction.RIGHT:
        newX++;
        break;
      case Direction.DOWN:
        newY++;
        break;
      case Direction.LEFT:
        newX--;
        break;
    }
    
    // Check if the new position is valid (not a wall)
    if (
      pacman.direction !== Direction.NONE &&
      newY >= 0 && newY < GRID_HEIGHT &&
      newX >= 0 && newX < GRID_WIDTH &&
      level1[newY][newX] !== EntityType.WALL
    ) {
      // Update Pacman's position
      setPacman(prevPacman => ({
        ...prevPacman,
        x: newX,
        y: newY
      }));
      
      // Check if Pacman ate a dot or power pellet
      if (level1[newY][newX] === EntityType.DOT) {
        // Update score
        setScore(prevScore => prevScore + 10);
        
        // Remove the dot from the level
        const updatedLevel = [...level1];
        updatedLevel[newY][newX] = EntityType.EMPTY;
        setLevel1(updatedLevel);
        
        // Decrease dot count
        setDotsRemaining(prevDots => prevDots - 1);
      } else if (level1[newY][newX] === EntityType.POWER_PELLET) {
        // Update score
        setScore(prevScore => prevScore + 50);
        
        // Remove the power pellet from the level
        const updatedLevel = [...level1];
        updatedLevel[newY][newX] = EntityType.EMPTY;
        setLevel1(updatedLevel);
        
        // Set all ghosts to frightened mode
        setGhosts(prevGhosts => prevGhosts.map(ghost => ({
          ...ghost,
          frightened: true,
          frightenedTimer: 30 // ~10 seconds (assuming ~3 updates per second)
        })));
        
        // Decrease dot count
        setDotsRemaining(prevDots => prevDots - 1);
      }
    }
    
    // Move ghosts
    setGhosts(prevGhosts => {
      return prevGhosts.map(ghost => {
        // Skip if ghost is eaten and returning to home
        if (ghost.eaten) {
          return { ...ghost };
        }
        
        // Update frightened timer
        if (ghost.frightened) {
          if (ghost.frightenedTimer <= 0) {
            return { ...ghost, frightened: false, frightenedTimer: 0 };
          } else {
            return { ...ghost, frightenedTimer: ghost.frightenedTimer - 1 };
          }
        }
        
        // Determine ghost movement direction (simplified AI)
        // This is a very basic ghost AI. For a more authentic Pac-Man experience,
        // each ghost should have a unique behavior pattern.
        let directions: Direction[] = [];
        const isAtIntersection = (
          (level1[ghost.y - 1]?.[ghost.x] !== EntityType.WALL ? 1 : 0) +
          (level1[ghost.y + 1]?.[ghost.x] !== EntityType.WALL ? 1 : 0) +
          (level1[ghost.y]?.[ghost.x - 1] !== EntityType.WALL ? 1 : 0) +
          (level1[ghost.y]?.[ghost.x + 1] !== EntityType.WALL ? 1 : 0)
        ) > 2;
        
        // If at an intersection, consider changing direction
        if (isAtIntersection || ghost.direction === Direction.NONE) {
          // Add possible directions
          if (level1[ghost.y - 1]?.[ghost.x] !== EntityType.WALL) directions.push(Direction.UP);
          if (level1[ghost.y + 1]?.[ghost.x] !== EntityType.WALL) directions.push(Direction.DOWN);
          if (level1[ghost.y]?.[ghost.x - 1] !== EntityType.WALL) directions.push(Direction.LEFT);
          if (level1[ghost.y]?.[ghost.x + 1] !== EntityType.WALL) directions.push(Direction.RIGHT);
          
          // Remove opposite direction (don't go back)
          directions = directions.filter(d => {
            if (ghost.direction === Direction.UP && d === Direction.DOWN) return false;
            if (ghost.direction === Direction.DOWN && d === Direction.UP) return false;
            if (ghost.direction === Direction.LEFT && d === Direction.RIGHT) return false;
            if (ghost.direction === Direction.RIGHT && d === Direction.LEFT) return false;
            return true;
          });
          
          // If in frightened mode, move randomly
          if (ghost.frightened) {
            const randomIndex = Math.floor(Math.random() * directions.length);
            ghost.direction = directions[randomIndex] || ghost.direction;
          } else {
            // Otherwise, try to chase Pacman
            // Sort directions by distance to Pacman
            directions.sort((a, b) => {
              let newXA = ghost.x;
              let newYA = ghost.y;
              
              let newXB = ghost.x;
              let newYB = ghost.y;
              
              switch (a) {
                case Direction.UP: newYA--; break;
                case Direction.RIGHT: newXA++; break;
                case Direction.DOWN: newYA++; break;
                case Direction.LEFT: newXA--; break;
              }
              
              switch (b) {
                case Direction.UP: newYB--; break;
                case Direction.RIGHT: newXB++; break;
                case Direction.DOWN: newYB++; break;
                case Direction.LEFT: newXB--; break;
              }
              
              const distA = Math.sqrt((newXA - pacman.x) ** 2 + (newYA - pacman.y) ** 2);
              const distB = Math.sqrt((newXB - pacman.x) ** 2 + (newYB - pacman.y) ** 2);
              
              // Each ghost has slightly different behavior
              if (ghost.name === GhostName.BLINKY) {
                // Blinky directly chases Pacman
                return distA - distB;
              } else if (ghost.name === GhostName.PINKY) {
                // Pinky tries to ambush Pacman
                let targetX = pacman.x;
                let targetY = pacman.y;
                
                // Look 4 cells ahead of Pacman
                switch (pacman.direction) {
                  case Direction.UP: targetY -= 4; break;
                  case Direction.RIGHT: targetX += 4; break;
                  case Direction.DOWN: targetY += 4; break;
                  case Direction.LEFT: targetX -= 4; break;
                }
                
                const distAToTarget = Math.sqrt((newXA - targetX) ** 2 + (newYA - targetY) ** 2);
                const distBToTarget = Math.sqrt((newXB - targetX) ** 2 + (newYB - targetY) ** 2);
                
                return distAToTarget - distBToTarget;
              } else if (ghost.name === GhostName.INKY) {
                // Inky is somewhat unpredictable
                // Sometimes chase, sometimes scatter
                return Math.random() > 0.3 ? distA - distB : distB - distA;
              } else if (ghost.name === GhostName.CLYDE) {
                // Clyde is shy and stays away when close to Pacman
                const distToPacman = Math.sqrt((ghost.x - pacman.x) ** 2 + (ghost.y - pacman.y) ** 2);
                if (distToPacman < 8) {
                  // Run away when close
                  return distB - distA;
                }
                // Otherwise chase normally
                return distA - distB;
              }
              
              return distA - distB;
            });
            
            // Use the best direction
            ghost.direction = directions[0] || ghost.direction;
          }
        }
        
        // Move ghost
        let newX = ghost.x;
        let newY = ghost.y;
        
        switch (ghost.direction) {
          case Direction.UP: newY--; break;
          case Direction.RIGHT: newX++; break;
          case Direction.DOWN: newY++; break;
          case Direction.LEFT: newX--; break;
        }
        
        // Check if the new position is valid (not a wall)
        if (
          newY >= 0 && newY < GRID_HEIGHT &&
          newX >= 0 && newX < GRID_WIDTH &&
          level1[newY][newX] !== EntityType.WALL
        ) {
          return { ...ghost, x: newX, y: newY };
        }
        
        // If ghost can't move in its current direction, try another direction
        return { ...ghost, direction: Direction.NONE };
      });
    });
    
    // Check for collisions between Pacman and ghosts
    ghosts.forEach(ghost => {
      if (ghost.x === pacman.x && ghost.y === pacman.y) {
        if (ghost.frightened) {
          // Pacman eats ghost
          setScore(prevScore => prevScore + 200);
          
          // Set ghost to "eaten" state
          setGhosts(prevGhosts => prevGhosts.map(g => {
            if (g.name === ghost.name) {
              return { ...g, eaten: true, frightened: false };
            }
            return g;
          }));
        } else if (!ghost.eaten) {
          // Ghost catches Pacman
          setLives(prevLives => prevLives - 1);
          
          if (lives <= 1) {
            // Game over
            setGameState(GameState.GAME_OVER);
            
            // Check if this is a high score
            if (score > highScore) {
              setHighScore(score);
              localStorage.setItem('pacman-high-score', score.toString());
            }
          } else {
            // Reset positions for next life
            setPacman({
              x: 14,
              y: 23,
              type: EntityType.PACMAN,
              direction: Direction.NONE,
              nextDirection: Direction.NONE,
              mouthOpen: true,
              mouthAngle: 0.2
            });
            
            setGhosts([
              {
                x: 14, y: 11, type: EntityType.GHOST, name: GhostName.BLINKY, 
                direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
              },
              {
                x: 12, y: 14, type: EntityType.GHOST, name: GhostName.PINKY, 
                direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
              },
              {
                x: 14, y: 14, type: EntityType.GHOST, name: GhostName.INKY, 
                direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
              },
              {
                x: 16, y: 14, type: EntityType.GHOST, name: GhostName.CLYDE, 
                direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
              }
            ]);
          }
        }
      }
    });
    
    // Check if all dots have been eaten
    if (dotsRemaining <= 0) {
      setGameState(GameState.WIN);
      
      // Check if this is a high score
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('pacman-high-score', score.toString());
      }
    }
  }, [gameState, pacman, ghosts, level1, dotsRemaining, score, lives, highScore]);

  // Handle keyboard input with memoized callback
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    // Prevent default behavior for arrow keys, space, and other game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'p'].includes(e.key)) {
      e.preventDefault();
    }
    
    if (gameState === GameState.PLAYING) {
      let directionChanged = false;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setPacman(prev => {
            // Set both direction and nextDirection to immediately start moving
            if (prev.y > 0 && level1[prev.y - 1][prev.x] !== EntityType.WALL) {
              directionChanged = true;
              return { ...prev, direction: Direction.UP, nextDirection: Direction.UP };
            } else {
              return { ...prev, nextDirection: Direction.UP };
            }
          });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setPacman(prev => {
            if (prev.x < GRID_WIDTH - 1 && level1[prev.y][prev.x + 1] !== EntityType.WALL) {
              directionChanged = true;
              return { ...prev, direction: Direction.RIGHT, nextDirection: Direction.RIGHT };
            } else {
              return { ...prev, nextDirection: Direction.RIGHT };
            }
          });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setPacman(prev => {
            if (prev.y < GRID_HEIGHT - 1 && level1[prev.y + 1][prev.x] !== EntityType.WALL) {
              directionChanged = true;
              return { ...prev, direction: Direction.DOWN, nextDirection: Direction.DOWN };
            } else {
              return { ...prev, nextDirection: Direction.DOWN };
            }
          });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setPacman(prev => {
            if (prev.x > 0 && level1[prev.y][prev.x - 1] !== EntityType.WALL) {
              directionChanged = true;
              return { ...prev, direction: Direction.LEFT, nextDirection: Direction.LEFT };
            } else {
              return { ...prev, nextDirection: Direction.LEFT };
            }
          });
          break;
        case 'p':
        case 'P':
          setGameState(GameState.PAUSED);
          break;
      }
      
      // Force an immediate update if Pacman wasn't moving
      if (directionChanged && pacman.direction === Direction.NONE) {
        update(0);
      }
    } else if (gameState === GameState.PAUSED && (e.key === 'p' || e.key === 'P')) {
      setGameState(GameState.PLAYING);
    }
  }, [gameState, level1, pacman, update]);
  
  // Set up keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Handle touch controls
  const handleTouchControl = React.useCallback((direction: Direction) => {
    if (gameState === GameState.PLAYING) {
      // Immediately force the direction change and update
      setPacman(prev => {
        // Check if we can move in the requested direction right away
        switch (direction) {
          case Direction.UP:
            if (prev.y > 0 && level1[prev.y - 1][prev.x] !== EntityType.WALL) {
              return { ...prev, direction: Direction.UP, nextDirection: Direction.UP };
            }
            break;
          case Direction.RIGHT:
            if (prev.x < GRID_WIDTH - 1 && level1[prev.y][prev.x + 1] !== EntityType.WALL) {
              return { ...prev, direction: Direction.RIGHT, nextDirection: Direction.RIGHT };
            }
            break;
          case Direction.DOWN:
            if (prev.y < GRID_HEIGHT - 1 && level1[prev.y + 1][prev.x] !== EntityType.WALL) {
              return { ...prev, direction: Direction.DOWN, nextDirection: Direction.DOWN };
            }
            break;
          case Direction.LEFT:
            if (prev.x > 0 && level1[prev.y][prev.x - 1] !== EntityType.WALL) {
              return { ...prev, direction: Direction.LEFT, nextDirection: Direction.LEFT };
            }
            break;
        }
        
        // If we can't move in that direction right away, just queue it up
        return { ...prev, nextDirection: direction };
      });
      
      // Force an immediate update cycle if pacman is not currently moving
      if (pacman.direction === Direction.NONE) {
        // This will kickstart movement if pacman is currently static
        update(0);
      }
    }
  }, [gameState, level1, pacman.direction, update]);
  
  // Toggle pause
  const togglePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  };
  
  // Start a new game
  const startGame = () => {
    // Reset the game state
    setScore(0);
    setLives(3);
    
    // Reset Pacman position with RIGHT as initial direction
    // This ensures Pac-Man starts moving immediately
    setPacman({
      x: 14,
      y: 23,
      type: EntityType.PACMAN,
      direction: Direction.RIGHT, // Set an initial direction so it starts moving
      nextDirection: Direction.RIGHT,
      mouthOpen: true,
      mouthAngle: 0.2
    });
    
    // After making sure everything is reset, set game state to PLAYING
    setGameState(GameState.PLAYING);
    
    // Reset ghost positions
    setGhosts([
      {
        x: 14, y: 11, type: EntityType.GHOST, name: GhostName.BLINKY, 
        direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
      },
      {
        x: 12, y: 14, type: EntityType.GHOST, name: GhostName.PINKY, 
        direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
      },
      {
        x: 14, y: 14, type: EntityType.GHOST, name: GhostName.INKY, 
        direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
      },
      {
        x: 16, y: 14, type: EntityType.GHOST, name: GhostName.CLYDE, 
        direction: Direction.UP, frightened: false, eaten: false, frightenedTimer: 0
      }
    ]);
    
    // Count dots
    let dots = 0;
    level1.forEach(row => {
      row.forEach(cell => {
        if (cell === EntityType.DOT || cell === EntityType.POWER_PELLET) {
          dots++;
        }
      });
    });
    setDotsRemaining(dots);
    
    // Reset the game level
    setLevel1(prevLevel => [...prevLevel.map(row => [...row])]);
  };
  
  // Draw the game
  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the maze
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = level1[y][x];
        
        switch (cell) {
          case EntityType.WALL:
            ctx.fillStyle = COLORS.WALL;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            break;
          case EntityType.DOT:
            ctx.fillStyle = COLORS.DOT;
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              CELL_SIZE / 6,
              0,
              Math.PI * 2
            );
            ctx.fill();
            break;
          case EntityType.POWER_PELLET:
            ctx.fillStyle = COLORS.POWER_PELLET;
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
              CELL_SIZE / 3,
              0,
              Math.PI * 2
            );
            ctx.fill();
            break;
        }
      }
    }
    
    // Draw Pacman
    ctx.fillStyle = COLORS.PACMAN;
    ctx.beginPath();
    
    // Calculate Pacman mouth angle based on direction
    let startAngle = 0.2;
    let endAngle = 2 * Math.PI - 0.2;
    
    // Adjust angles based on direction
    switch (pacman.direction) {
      case Direction.RIGHT:
        startAngle = 0.2;
        endAngle = 2 * Math.PI - 0.2;
        break;
      case Direction.DOWN:
        startAngle = Math.PI / 2 + 0.2;
        endAngle = Math.PI / 2 - 0.2 + 2 * Math.PI;
        break;
      case Direction.LEFT:
        startAngle = Math.PI + 0.2;
        endAngle = Math.PI - 0.2 + 2 * Math.PI;
        break;
      case Direction.UP:
        startAngle = 3 * Math.PI / 2 + 0.2;
        endAngle = 3 * Math.PI / 2 - 0.2 + 2 * Math.PI;
        break;
    }
    
    // If mouth is closed (animation), adjust angles
    if (!pacman.mouthOpen) {
      startAngle = 0;
      endAngle = 2 * Math.PI;
    }
    
    ctx.arc(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2,
      startAngle,
      endAngle
    );
    ctx.lineTo(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2
    );
    ctx.fill();
    
    // Draw ghosts
    ghosts.forEach(ghost => {
      // Skip rendering if ghost is in the "eaten" state and returning to home
      if (ghost.eaten) return;
      
      // Determine ghost color
      let ghostColor;
      if (ghost.frightened) {
        ghostColor = COLORS.FRIGHTENED;
      } else {
        switch (ghost.name) {
          case GhostName.BLINKY: ghostColor = COLORS.BLINKY; break;
          case GhostName.PINKY: ghostColor = COLORS.PINKY; break;
          case GhostName.INKY: ghostColor = COLORS.INKY; break;
          case GhostName.CLYDE: ghostColor = COLORS.CLYDE; break;
        }
      }
      
      // Draw ghost body
      ctx.fillStyle = ghostColor;
      ctx.beginPath();
      
      // Draw the semi-circle top
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2,
        Math.PI,
        0
      );
      
      // Draw the wavy bottom
      const bottomY = ghost.y * CELL_SIZE + CELL_SIZE;
      ctx.lineTo(ghost.x * CELL_SIZE + CELL_SIZE, bottomY);
      
      // Create the wavy bottom effect with 3 waves
      const waveSections = 3;
      const waveWidth = CELL_SIZE / waveSections;
      
      for (let i = 0; i < waveSections; i++) {
        const startX = ghost.x * CELL_SIZE + CELL_SIZE - i * waveWidth;
        const middleX = startX - waveWidth / 2;
        const endX = startX - waveWidth;
        
        ctx.lineTo(middleX, bottomY - CELL_SIZE / 4);
        ctx.lineTo(endX, bottomY);
      }
      
      ctx.closePath();
      ctx.fill();
      
      // Draw ghost eyes
      ctx.fillStyle = 'white';
      
      // Left eye
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2.5,
        CELL_SIZE / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Right eye
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE * 2/3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2.5,
        CELL_SIZE / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Draw pupils (look in the direction the ghost is moving)
      ctx.fillStyle = 'black';
      
      // Calculate pupil positions based on ghost direction
      let leftPupilX = ghost.x * CELL_SIZE + CELL_SIZE / 3;
      let leftPupilY = ghost.y * CELL_SIZE + CELL_SIZE / 2.5;
      let rightPupilX = ghost.x * CELL_SIZE + CELL_SIZE * 2/3;
      let rightPupilY = ghost.y * CELL_SIZE + CELL_SIZE / 2.5;
      
      // Adjust pupils based on direction
      const pupilOffset = CELL_SIZE / 12;
      
      switch (ghost.direction) {
        case Direction.UP:
          leftPupilY -= pupilOffset;
          rightPupilY -= pupilOffset;
          break;
        case Direction.RIGHT:
          leftPupilX += pupilOffset;
          rightPupilX += pupilOffset;
          break;
        case Direction.DOWN:
          leftPupilY += pupilOffset;
          rightPupilY += pupilOffset;
          break;
        case Direction.LEFT:
          leftPupilX -= pupilOffset;
          rightPupilX -= pupilOffset;
          break;
      }
      
      // Left pupil
      ctx.beginPath();
      ctx.arc(
        leftPupilX,
        leftPupilY,
        CELL_SIZE / 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Right pupil
      ctx.beginPath();
      ctx.arc(
        rightPupilX,
        rightPupilY,
        CELL_SIZE / 12,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    
    // Draw overlay messages
    if (gameState === GameState.READY) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('READY!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText('Press Start to Play', canvas.width / 2, canvas.height / 2 + 20);
    } else if (gameState === GameState.PAUSED) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else if (gameState === GameState.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    } else if (gameState === GameState.WIN) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }, [canvasRef, gameState, level1, pacman, ghosts, score]);

  // Update game logic - already defined above
  
  // The update function is now declared above with useCallback
  
  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      // Calculate time since last frame
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Update game logic at a controlled rate (slower than animation frame rate)
      const updateInterval = 150; // milliseconds between updates
      if (deltaTime > updateInterval && gameState === GameState.PLAYING) {
        update(deltaTime);
      }
      
      // Always draw each frame
      draw();
      
      // Continue loop if game is still running
      if (gameState !== GameState.GAME_OVER && gameState !== GameState.WIN) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };
    
    // Start game loop only for drawing if in READY state
    if (gameState === GameState.READY) {
      // Just draw the initial state without updating
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    // Start the full game loop if PLAYING
    if (gameState === GameState.PLAYING) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    // Cleanup
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, draw, update]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12">
          <Container>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Pac-Man</h1>
              <p className="text-gray-600">
                The classic arcade game. Navigate the maze, eat all the dots, and avoid the ghosts!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* Score and lives display */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Score</div>
                      <div className="font-bold text-xl">{score}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Lives</div>
                      <div className="font-bold text-xl">{lives}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">High Score</div>
                      <div className="font-bold text-xl">{highScore}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    {/* Game canvas */}
                    <div className="relative border-2 border-gray-200 rounded-md overflow-hidden mb-6">
                      <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="bg-black"
                      />
                    </div>
                    
                    {/* Game controls */}
                    <div className="flex justify-center gap-4">
                      {gameState === GameState.READY && (
                        <Button onClick={startGame} className="px-8">
                          Start Game
                        </Button>
                      )}
                      
                      {gameState === GameState.PLAYING && (
                        <Button onClick={togglePause} variant="outline">
                          Pause
                        </Button>
                      )}
                      
                      {gameState === GameState.PAUSED && (
                        <Button onClick={togglePause}>
                          Resume
                        </Button>
                      )}
                      
                      {(gameState === GameState.GAME_OVER || gameState === GameState.WIN) && (
                        <Button onClick={startGame}>
                          Play Again
                        </Button>
                      )}
                    </div>
                    
                    {/* Mobile touch controls */}
                    <div className="md:hidden mt-6">
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
                        <li><span className="text-red-500">Blinky (Red)</span>: Directly chases Pac-Man</li>
                        <li><span className="text-pink-300">Pinky (Pink)</span>: Tries to ambush Pac-Man</li>
                        <li><span className="text-cyan-400">Inky (Cyan)</span>: Unpredictable movement</li>
                        <li><span className="text-orange-300">Clyde (Orange)</span>: Shy and keeps distance</li>
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