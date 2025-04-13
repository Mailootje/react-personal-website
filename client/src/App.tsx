import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { IntroAnimation } from "@/components/IntroAnimation";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Photography from "@/pages/Photography";
import Apps from "@/pages/Apps";
import Downloads from "@/pages/Downloads";
import PasswordGenerator from "@/pages/apps/PasswordGenerator";
import LinkShortener from "@/pages/apps/LinkShortener";
import QRCodeGenerator from "@/pages/apps/QRCodeGenerator";
import EuroTruckSimulator2 from "@/pages/downloads/EuroTruckSimulator2";
import { motion, AnimatePresence } from "framer-motion";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/photography" component={Photography}/>
      <Route path="/apps" component={Apps}/>
      <Route path="/apps/password-generator" component={PasswordGenerator}/>
      <Route path="/apps/link-shortener" component={LinkShortener}/>
      <Route path="/apps/qr-code-generator" component={QRCodeGenerator}/>
      <Route path="/downloads" component={Downloads}/>
      <Route path="/downloads/euro-truck-simulator-2" component={EuroTruckSimulator2}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  
  // Check if this is the first visit to show intro animation
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
      setContentVisible(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setContentVisible(true);
    // Store in session storage so it doesn't show again during this session
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      
      <AnimatePresence>
        {contentVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Router />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
