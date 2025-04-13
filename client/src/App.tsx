import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import { VideoBackground } from "@/components/VideoBackground";
import { TestComponent } from "@/components/TestComponent";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Photography from "@/pages/Photography";
import Apps from "@/pages/Apps";
import Downloads from "@/pages/Downloads";
import Games from "@/pages/Games";
import PasswordGenerator from "@/pages/apps/PasswordGenerator";
import LinkShortener from "@/pages/apps/LinkShortener";
import QRCodeGenerator from "@/pages/apps/QRCodeGenerator";
import WeatherDashboard from "@/pages/apps/WeatherDashboard";
import OnlineCodeEditor from "@/pages/apps/OnlineCodeEditor";
import ImageConverter from "@/pages/apps/ImageConverter";
import HeaderChecker from "./pages/apps/HeaderChecker";
import FaviconGenerator from "@/pages/apps/FaviconGenerator";
import IpLocationLookup from "@/pages/apps/IpLocationLookup";
import UnitConverter from "@/pages/apps/UnitConverter";
import TimestampConverter from "@/pages/apps/TimestampConverter";
import JsonFormatter from "@/pages/apps/JsonFormatter";
import ColorPicker from "@/pages/apps/ColorPicker";
import HashGenerator from "@/pages/apps/HashGenerator";
import RandomGenerator from "@/pages/apps/RandomGenerator";
import VideoChat from "@/pages/apps/VideoChat";
import Snake from "@/pages/games/Snake";
import Tetris from "@/pages/games/Tetris";
import PacmanNew from "@/pages/games/PacmanNew";
import PacmanSimple from "@/pages/games/PacmanSimple";
import PacmanBasic from "@/pages/games/PacmanBasic";
import EuroTruckSimulator2 from "@/pages/downloads/EuroTruckSimulator2";
import AmericanTruckSimulator from "@/pages/downloads/AmericanTruckSimulator";
import SchoolPitch from "@/pages/personal/school/Pitch";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/photography" component={Photography}/>
      <Route path="/apps" component={Apps}/>
      <Route path="/apps/password-generator" component={PasswordGenerator}/>
      <Route path="/apps/link-shortener" component={LinkShortener}/>
      <Route path="/apps/qr-code-generator" component={QRCodeGenerator}/>
      <Route path="/apps/weather-dashboard" component={WeatherDashboard}/>
      <Route path="/apps/online-code-editor" component={OnlineCodeEditor}/>
      <Route path="/apps/image-converter" component={ImageConverter}/>
      <Route path="/apps/header-checker" component={HeaderChecker}/>
      <Route path="/apps/favicon-generator" component={FaviconGenerator}/>
      <Route path="/apps/ip-location-lookup" component={IpLocationLookup}/>
      <Route path="/apps/unit-converter" component={UnitConverter}/>
      <Route path="/apps/timestamp-converter" component={TimestampConverter}/>
      <Route path="/apps/json-formatter" component={JsonFormatter}/>
      <Route path="/apps/color-picker" component={ColorPicker}/>
      <Route path="/apps/hash-generator" component={HashGenerator}/>
      <Route path="/apps/random-generator" component={RandomGenerator}/>
      <Route path="/apps/video-chat" component={VideoChat}/>
      <Route path="/downloads" component={Downloads}/>
      <Route path="/downloads/euro-truck-simulator-2" component={EuroTruckSimulator2}/>
      <Route path="/downloads/american-truck-simulator" component={AmericanTruckSimulator}/>
      <Route path="/games" component={Games}/>
      <Route path="/games/snake" component={Snake}/>
      <Route path="/games/tetris" component={Tetris}/>
      <Route path="/games/pacman" component={PacmanBasic}/>
      <Route path="/games/pacman-simple" component={PacmanSimple}/>
      <Route path="/personal/school/pitch" component={SchoolPitch}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  try {
    return (
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <div className="app-container">
            <Router />
            <Toaster />
          </div>
        </QueryClientProvider>
      </DarkModeProvider>
    );
  } catch (error) {
    console.error("App: Error rendering App:", error);
    return <div style={{ color: "white" }}>Error rendering application: {String(error)}</div>;
  }
}

export default App;
