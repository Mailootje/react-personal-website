import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { PacmanGame } from 'pacman-react';

export default function Pacman() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);

  // Initialize high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('pacman-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Update high score when game is over
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('pacman-high-score', score.toString());
    }
  }, [gameOver, score, highScore]);

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const handleLivesUpdate = (newLives: number) => {
    setLives(newLives);
  };

  const handleGameOver = (finalScore: number) => {
    setGameOver(true);
    setGameActive(false);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('pacman-high-score', finalScore.toString());
    }
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
  };

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
                    {/* Game container */}
                    <div className="relative border-2 border-gray-200 rounded-md overflow-hidden mb-6 bg-black">
                      {gameActive && (
                        <PacmanGame
                          width={560}
                          height={620}
                          onScoreUpdate={handleScoreUpdate}
                          onLivesUpdate={handleLivesUpdate}
                          onGameOver={handleGameOver}
                        />
                      )}
                      {!gameActive && (
                        <div 
                          className="w-full h-[620px] flex items-center justify-center bg-black"
                        >
                          <div className="text-center">
                            <div className="text-yellow-400 text-4xl font-bold mb-4">
                              {gameOver ? 'GAME OVER' : 'PAC-MAN'}
                            </div>
                            <div className="text-white mb-6">
                              {gameOver ? `Final Score: ${score}` : 'Ready to play?'}
                            </div>
                            <Button onClick={startGame} className="px-8">
                              {gameOver ? 'Play Again' : 'Start Game'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Game controls */}
                    <div className="flex justify-center gap-4">
                      {gameActive && (
                        <Button onClick={() => setGameActive(false)} variant="outline">
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
                        <li>Arrow Up: Move up</li>
                        <li>Arrow Right: Move right</li>
                        <li>Arrow Down: Move down</li>
                        <li>Arrow Left: Move left</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Scoring</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Small Dot: 10 points</li>
                        <li>Power Pellet: 50 points</li>
                        <li>Ghost: 200-1600 points</li>
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

                    <div>
                      <h4 className="font-semibold mb-2">Tips</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Learn the patterns of each ghost</li>
                        <li>Use power pellets strategically to clear areas</li>
                        <li>Time your movements carefully at intersections</li>
                        <li>Focus on clearing one section of the maze at a time</li>
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