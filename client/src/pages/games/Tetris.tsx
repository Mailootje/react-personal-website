import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Tetris from 'react-tetris';
import './Tetris.css';

export default function TetrisGame() {
  // Prevent arrow keys from scrolling the page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys, space, and other game control keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'p', 'z', 'x', 'c'].includes(e.key)) {
        e.preventDefault();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
                  <Tetris
                    keyboardControls={{
                      down: 'MOVE_DOWN',
                      left: 'MOVE_LEFT',
                      right: 'MOVE_RIGHT',
                      space: 'HARD_DROP',
                      z: 'FLIP_COUNTERCLOCKWISE',
                      x: 'FLIP_CLOCKWISE',
                      up: 'FLIP_CLOCKWISE',
                      p: 'TOGGLE_PAUSE',
                      c: 'HOLD',
                      shift: 'HOLD',
                      a: 'MOVE_LEFT',
                      s: 'MOVE_DOWN',
                      d: 'MOVE_RIGHT',
                      w: 'FLIP_CLOCKWISE'
                    }}
                  >
                    {({
                      Gameboard,
                      PieceQueue,
                      points,
                      linesCleared,
                      state,
                      controller
                    }) => (
                      <div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-gray-100 p-3 rounded-md text-center">
                            <div className="text-sm text-gray-500 mb-1">Score</div>
                            <div className="font-bold text-xl">{points * 100}</div>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-md text-center">
                            <div className="text-sm text-gray-500 mb-1">Lines</div>
                            <div className="font-bold text-xl">{linesCleared}</div>
                          </div>
                          <div className="bg-gray-100 p-3 rounded-md text-center">
                            <div className="text-sm text-gray-500 mb-1">Level</div>
                            <div className="font-bold text-xl">{Math.floor(linesCleared / 10) + 1}</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="relative border-2 border-gray-200 rounded-md overflow-hidden bg-gray-50">
                            <Gameboard />
                          </div>
                          
                          <div className="flex flex-col gap-6 items-center md:items-start">
                            <div>
                              <h3 className="font-bold text-lg mb-2">Next Piece</h3>
                              <div className="border-2 border-gray-200 rounded-md overflow-hidden bg-gray-50">
                                <PieceQueue />
                              </div>
                            </div>
                            
                            {state === 'PAUSED' && (
                              <Button 
                                onClick={controller.pause} 
                                className="w-full"
                              >
                                Resume Game
                              </Button>
                            )}
                            
                            {state === 'PLAYING' && (
                              <Button 
                                onClick={controller.pause} 
                                variant="outline" 
                                className="w-full"
                              >
                                Pause Game
                              </Button>
                            )}
                            
                            {state === 'LOST' && (
                              <div className="text-center w-full">
                                <p className="text-red-500 font-bold mb-2">Game Over!</p>
                                <Button 
                                  onClick={controller.restart} 
                                  className="w-full"
                                >
                                  Play Again
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Tetris>
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
                      <h4 className="font-semibold mb-2">Controls</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Arrow Left / A: Move tetromino left</li>
                        <li>Arrow Right / D: Move tetromino right</li>
                        <li>Arrow Down / S: Drop tetromino by one row</li>
                        <li>Arrow Up / W: Rotate tetromino</li>
                        <li>Spacebar: Hard drop (instantly drop to bottom)</li>
                        <li>P: Pause/Resume game</li>
                        <li>Z: Rotate counter-clockwise</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Special Features</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Ghost Piece:</strong> Shows where your piece will land</li>
                        <li><strong>Next Queue:</strong> See upcoming pieces</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Tips</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Plan ahead using the next piece queue</li>
                        <li>Leave a column open for I-pieces (Tetris clears)</li>
                        <li>Keep the stack as low as possible</li>
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