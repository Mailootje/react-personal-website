declare module 'pacman-react' {
  export interface PacmanGameProps {
    width?: number;
    height?: number;
    onScoreUpdate?: (score: number) => void;
    onLivesUpdate?: (lives: number) => void;
    onGameOver?: (finalScore: number) => void;
  }
  
  export const PacmanGame: React.FC<PacmanGameProps>;
}