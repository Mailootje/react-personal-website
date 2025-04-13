import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";

export default function AnimationGuide() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        <Container maxWidth="xl">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Experience the Animation</h1>
            
            <div className="mb-8">
              <p className="text-lg mb-4">
                I've created a special interactive animation experience inspired by superpower.com.
                This animation utilizes scroll-driven visuals to create a unique journey.
              </p>
              
              <h2 className="text-2xl font-semibold mt-8 mb-4">What to expect:</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  A series of visual transitions that respond to your scrolling
                </li>
                <li>
                  Smooth animations including color transformations and zoom effects
                </li>
                <li>
                  A light-speed effect with colorful lines radiating from center
                </li>
                <li>
                  Interactive elements that reveal as you progress through the experience
                </li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
                <h3 className="font-bold text-xl mb-2 text-amber-600">Silhouette View</h3>
                <p>A beautiful amber-colored profile silhouette against a gradient background.</p>
              </div>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="font-bold text-xl mb-2 text-cyan-600">Light Effects</h3>
                <p>Colorful light streaks radiating outward in a hypnotic pattern.</p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                <h3 className="font-bold text-xl mb-2 text-purple-600">Circular Finale</h3>
                <p>A beautiful multi-colored circular design that transitions to the content.</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-none">
                <Link href="/experience">
                  Start the Animated Experience
                </Link>
              </Button>
            </div>
            
            <div className="mt-12 p-6 border border-yellow-500/30 bg-yellow-500/10 rounded-lg">
              <h3 className="text-xl font-bold mb-2 text-yellow-600">For the best experience:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use a modern browser (Chrome, Firefox, Safari, Edge)</li>
                <li>View on a desktop or laptop for the full effect</li>
                <li>Scroll slowly to appreciate each transition</li>
                <li>Make sure JavaScript is enabled</li>
              </ul>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}