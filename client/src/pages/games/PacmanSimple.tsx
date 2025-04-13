import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function PacmanSimple() {
  const [score, setScore] = useState(0);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12">
          <Container>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Pac-Man Simple Test</h1>
              <p className="text-gray-600">
                A simple test page for Pac-Man
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-100 p-3 rounded-md text-center">
                      <div className="text-sm text-gray-500 mb-1">Score</div>
                      <div className="font-bold text-xl">{score}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative border-2 border-gray-200 rounded-md overflow-hidden mb-6 bg-black">
                      <div 
                        className="w-full h-[620px] flex items-center justify-center bg-black"
                      >
                        <div className="text-center">
                          <div className="text-yellow-400 text-4xl font-bold mb-4">
                            PAC-MAN SIMPLE TEST
                          </div>
                          <div className="text-white mb-6">
                            This is a simple test page
                          </div>
                          <Button onClick={() => setScore(score + 10)} className="px-8">
                            Increase Score
                          </Button>
                        </div>
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
                      This is a simple test page for Pac-Man.
                    </p>
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