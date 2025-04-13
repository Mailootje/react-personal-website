import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw, 
  Palette,
  Shuffle,
  Pipette,
  Download,
  Plus,
  Trash,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Color conversion utilities
const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToHsl = (r: number, g: number, b: number): { h: number, s: number, l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const hslToRgb = (h: number, s: number, l: number): { r: number, g: number, b: number } => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return black for bright colors, white for dark ones
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

// Generate a random color
const generateRandomColor = (): string => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
};

// Generate complementary color
const getComplementaryColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  
  // Complementary color is the inverted color
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
};

// Generate a color palette (analogous)
const generateAnalogousPalette = (baseHex: string, count: number = 5): string[] => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return Array(count).fill("#000000");
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const step = 30; // 30 degrees step for analogous colors
  
  const palette: string[] = [];
  const startHue = hsl.h - (step * Math.floor(count / 2));
  
  for (let i = 0; i < count; i++) {
    const newHue = (startHue + step * i + 360) % 360; // Ensure hue is between 0-360
    const { r, g, b } = hslToRgb(newHue, hsl.s, hsl.l);
    palette.push(rgbToHex(r, g, b));
  }
  
  return palette;
};

// Generate a monochromatic palette
const generateMonochromaticPalette = (baseHex: string, count: number = 5): string[] => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return Array(count).fill("#000000");
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const lightness = Math.max(10, Math.min(90, 20 + i * 70 / (count - 1)));
    const { r, g, b } = hslToRgb(hsl.h, hsl.s, lightness);
    palette.push(rgbToHex(r, g, b));
  }
  
  return palette;
};

// Generate a triadic palette
const generateTriadicPalette = (baseHex: string): string[] => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return Array(3).fill("#000000");
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette: string[] = [];
  
  for (let i = 0; i < 3; i++) {
    const newHue = (hsl.h + i * 120) % 360;
    const { r, g, b } = hslToRgb(newHue, hsl.s, hsl.l);
    palette.push(rgbToHex(r, g, b));
  }
  
  return palette;
};

export default function ColorPicker() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("picker");
  const [hexColor, setHexColor] = useState<string>("#3B82F6");
  const [rgbColor, setRgbColor] = useState<{ r: number, g: number, b: number }>({ r: 59, g: 130, b: 246 });
  const [hslColor, setHslColor] = useState<{ h: number, s: number, l: number }>({ h: 217, s: 91, l: 60 });
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [palette, setPalette] = useState<string[]>([]);
  const [paletteType, setPaletteType] = useState<string>("analogous");
  const [paletteCount, setPaletteCount] = useState<number>(5);
  const [copied, setCopied] = useState<string | null>(null);
  const [contrastText, setContrastText] = useState<string>("#FFFFFF");
  
  // Load saved colors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("savedColors");
    if (stored) {
      try {
        setSavedColors(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading saved colors:", e);
      }
    }
  }, []);
  
  // Update color values when hex changes
  useEffect(() => {
    const rgb = hexToRgb(hexColor);
    if (rgb) {
      setRgbColor(rgb);
      setHslColor(rgbToHsl(rgb.r, rgb.g, rgb.b));
      setContrastText(getContrastColor(hexColor));
      updatePalette(hexColor);
    }
  }, [hexColor, paletteType, paletteCount]);
  
  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure the value starts with #
    if (!value.startsWith("#")) {
      value = "#" + value;
    }
    
    // Validate hex color format
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
      setHexColor(value);
    } else if (value === "#") {
      setHexColor("#");
    } else if (value.length <= 7) {
      setHexColor(value);
    }
  };
  
  // Handle RGB input changes
  const handleRgbChange = (component: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgbColor, [component]: value };
    setRgbColor(newRgb);
    setHexColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };
  
  // Handle HSL input changes
  const handleHslChange = (component: "h" | "s" | "l", value: number) => {
    const newHsl = { ...hslColor, [component]: value };
    setHslColor(newHsl);
    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgbColor(rgb);
    setHexColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };
  
  // Generate random color
  const randomizeColor = () => {
    setHexColor(generateRandomColor());
  };
  
  // Save current color
  const saveCurrentColor = () => {
    if (!savedColors.includes(hexColor)) {
      const newSavedColors = [...savedColors, hexColor];
      setSavedColors(newSavedColors);
      localStorage.setItem("savedColors", JSON.stringify(newSavedColors));
      toast({
        title: "Color Saved",
        description: `${hexColor} has been added to your saved colors`,
      });
    } else {
      toast({
        title: "Color Already Saved",
        description: `${hexColor} is already in your saved colors`,
        variant: "destructive",
      });
    }
  };
  
  // Remove a saved color
  const removeSavedColor = (colorToRemove: string) => {
    const newSavedColors = savedColors.filter(color => color !== colorToRemove);
    setSavedColors(newSavedColors);
    localStorage.setItem("savedColors", JSON.stringify(newSavedColors));
  };
  
  // Update the palette based on the base color and palette type
  const updatePalette = (baseColor: string) => {
    switch (paletteType) {
      case "analogous":
        setPalette(generateAnalogousPalette(baseColor, paletteCount));
        break;
      case "monochromatic":
        setPalette(generateMonochromaticPalette(baseColor, paletteCount));
        break;
      case "triadic":
        setPalette(generateTriadicPalette(baseColor));
        break;
      default:
        setPalette(generateAnalogousPalette(baseColor, paletteCount));
    }
  };
  
  // Copy color to clipboard
  const copyToClipboard = (text: string, type: string = "hex") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      toast({
        title: "Copied!",
        description: `${type.toUpperCase()} color copied to clipboard`,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(null), 2000);
    });
  };
  
  // Download palette as image
  const downloadPalette = () => {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const tileSize = 100;
    const padding = 10;
    canvas.width = palette.length * tileSize + (palette.length + 1) * padding;
    canvas.height = tileSize + padding * 2;
    
    // Draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw color tiles
    palette.forEach((color, index) => {
      const x = padding + index * (tileSize + padding);
      const y = padding;
      
      // Draw color swatch
      ctx.fillStyle = color;
      ctx.fillRect(x, y, tileSize, tileSize);
      
      // Draw color value
      ctx.fillStyle = getContrastColor(color);
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(color, x + tileSize / 2, y + tileSize / 2);
    });
    
    // Convert canvas to image and download
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "color-palette.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Use eyedropper to pick a color if available
  const useEyeDropper = async () => {
    // @ts-ignore: EyeDropper API is not yet in TypeScript definitions
    if (typeof window.EyeDropper !== "undefined") {
      try {
        // @ts-ignore
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        setHexColor(result.sRGBHex);
      } catch (e) {
        console.error("Error using eyedropper:", e);
      }
    } else {
      toast({
        title: "Not Supported",
        description: "The EyeDropper API is not supported in your browser",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="lg">
            <div className="mb-8">
              <div 
                onClick={() => window.location.href = "/apps"}
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Apps
              </div>
            </div>
            
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Color Picker & Palette Generator</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose colors and create beautiful color schemes
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                  <TabsTrigger value="picker" className="flex items-center">
                    <Pipette className="h-4 w-4 mr-2" />
                    Color Picker
                  </TabsTrigger>
                  <TabsTrigger value="palette" className="flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    Palette Generator
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="picker" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Picker</CardTitle>
                      <CardDescription>
                        Choose a color and view its values in different formats
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Color Preview */}
                      <div className="flex flex-col md:flex-row gap-6">
                        <div 
                          className="w-full md:w-1/3 aspect-square rounded-md shadow-md flex items-center justify-center"
                          style={{ backgroundColor: hexColor, color: contrastText }}
                        >
                          <div className="text-center">
                            <h3 className="text-xl font-bold" style={{ color: contrastText }}>
                              {hexColor}
                            </h3>
                            <p style={{ color: contrastText }}>
                              RGB({rgbColor.r}, {rgbColor.g}, {rgbColor.b})
                            </p>
                            <p style={{ color: contrastText }}>
                              HSL({hslColor.h}°, {hslColor.s}%, {hslColor.l}%)
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          {/* HEX Color Input */}
                          <div className="space-y-2">
                            <Label htmlFor="hex-color">Hex Color</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="hex-color"
                                value={hexColor}
                                onChange={handleHexChange}
                                className="font-mono"
                              />
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => copyToClipboard(hexColor, "hex")}
                              >
                                {copied === hexColor ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* RGB Color Input */}
                          <div className="space-y-2">
                            <Label>RGB Color</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor="color-r" className="text-xs">Red</Label>
                                <div className="flex space-x-2">
                                  <Input
                                    id="color-r"
                                    type="number"
                                    min="0"
                                    max="255"
                                    value={rgbColor.r}
                                    onChange={(e) => handleRgbChange("r", parseInt(e.target.value) || 0)}
                                    className="font-mono"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="color-g" className="text-xs">Green</Label>
                                <Input
                                  id="color-g"
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={rgbColor.g}
                                  onChange={(e) => handleRgbChange("g", parseInt(e.target.value) || 0)}
                                  className="font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="color-b" className="text-xs">Blue</Label>
                                <Input
                                  id="color-b"
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={rgbColor.b}
                                  onChange={(e) => handleRgbChange("b", parseInt(e.target.value) || 0)}
                                  className="font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(`rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`, "rgb")}
                              >
                                {copied === `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` ? (
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                Copy RGB
                              </Button>
                            </div>
                          </div>
                          
                          {/* HSL Color Input */}
                          <div className="space-y-2">
                            <Label>HSL Color</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor="color-h" className="text-xs">Hue</Label>
                                <Input
                                  id="color-h"
                                  type="number"
                                  min="0"
                                  max="360"
                                  value={hslColor.h}
                                  onChange={(e) => handleHslChange("h", parseInt(e.target.value) || 0)}
                                  className="font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="color-s" className="text-xs">Saturation</Label>
                                <Input
                                  id="color-s"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={hslColor.s}
                                  onChange={(e) => handleHslChange("s", parseInt(e.target.value) || 0)}
                                  className="font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="color-l" className="text-xs">Lightness</Label>
                                <Input
                                  id="color-l"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={hslColor.l}
                                  onChange={(e) => handleHslChange("l", parseInt(e.target.value) || 0)}
                                  className="font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(`hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`, "hsl")}
                              >
                                {copied === `hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)` ? (
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                Copy HSL
                              </Button>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              onClick={randomizeColor}
                            >
                              <Shuffle className="h-4 w-4 mr-2" />
                              Random Color
                            </Button>
                            
                            <Button 
                              onClick={saveCurrentColor}
                              variant="default"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Color
                            </Button>
                            
                            {/* Show EyeDropper only if browser supports it */}
                            {typeof window !== 'undefined' && 'EyeDropper' in window && (
                              <Button
                                variant="outline"
                                onClick={useEyeDropper}
                              >
                                <Pipette className="h-4 w-4 mr-2" />
                                Pick from Screen
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Saved Colors */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Saved Colors</h3>
                        
                        {savedColors.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {savedColors.map((color, index) => (
                              <div 
                                key={index} 
                                className="group relative"
                              >
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-md border border-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setHexColor(color)}
                                  title={color}
                                />
                                <button
                                  type="button"
                                  className="absolute -top-2 -right-2 bg-background text-red-500 rounded-full p-0.5 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeSavedColor(color)}
                                >
                                  <Trash className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            No colors saved yet. Click "Save Color" to add colors to your collection.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="palette" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Palette Generator</CardTitle>
                      <CardDescription>
                        Create harmonious color palettes based on color theory
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Base Color Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="base-color">Base Color</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="base-color"
                              value={hexColor}
                              onChange={handleHexChange}
                              className="font-mono"
                            />
                            <div 
                              className="w-10 h-10 rounded-md border border-border"
                              style={{ backgroundColor: hexColor }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="palette-type">Palette Type</Label>
                          <select
                            id="palette-type"
                            value={paletteType}
                            onChange={(e) => setPaletteType(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <option value="analogous">Analogous</option>
                            <option value="monochromatic">Monochromatic</option>
                            <option value="triadic">Triadic</option>
                          </select>
                        </div>
                        
                        {paletteType !== "triadic" && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="palette-count">Number of Colors</Label>
                              <span className="text-sm text-muted-foreground">{paletteCount}</span>
                            </div>
                            <Slider
                              id="palette-count"
                              min={3}
                              max={9}
                              step={1}
                              value={[paletteCount]}
                              onValueChange={(value) => setPaletteCount(value[0])}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Color Palette Display */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">
                            {paletteType === "analogous" ? "Analogous" : 
                             paletteType === "monochromatic" ? "Monochromatic" : 
                             "Triadic"} Palette
                          </h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={downloadPalette}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {palette.map((color, index) => (
                            <div 
                              key={index}
                              className="relative group aspect-square p-4 rounded-md shadow-sm border border-border transition-transform hover:scale-105"
                              style={{ backgroundColor: color }}
                            >
                              <div 
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-md"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(color)}
                                  className="bg-background/80 hover:bg-background"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setHexColor(color)}
                                  className="bg-background/80 hover:bg-background"
                                >
                                  <Pipette className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (!savedColors.includes(color)) {
                                      const newSavedColors = [...savedColors, color];
                                      setSavedColors(newSavedColors);
                                      localStorage.setItem("savedColors", JSON.stringify(newSavedColors));
                                    }
                                  }}
                                  className="bg-background/80 hover:bg-background"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div
                                className="absolute bottom-2 left-2 text-xs font-mono"
                                style={{ color: getContrastColor(color) }}
                              >
                                {color}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Color Harmonies */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Other Color Harmonies</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Complementary Color */}
                          <div className="space-y-2">
                            <Label>Complementary Color</Label>
                            <div className="flex">
                              <div
                                className="w-1/2 h-16 flex items-center justify-center"
                                style={{ backgroundColor: hexColor, color: getContrastColor(hexColor) }}
                              >
                                <span className="text-sm font-mono">{hexColor}</span>
                              </div>
                              <div
                                className="w-1/2 h-16 flex items-center justify-center"
                                style={{ 
                                  backgroundColor: getComplementaryColor(hexColor), 
                                  color: getContrastColor(getComplementaryColor(hexColor)) 
                                }}
                              >
                                <span className="text-sm font-mono">{getComplementaryColor(hexColor)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Monochromatic Shades */}
                          <div className="space-y-2">
                            <Label>Lightness Variations</Label>
                            <div className="flex">
                              {generateMonochromaticPalette(hexColor, 5).map((color, index) => (
                                <div
                                  key={index}
                                  className="flex-1 h-16"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}