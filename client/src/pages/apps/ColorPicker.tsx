import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Copy, Check, Shuffle, Plus, Trash, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface SavedColor {
  id: string;
  name: string;
  hex: string;
  rgb: RGB;
  hsl: HSL;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  type: "analogous" | "monochromatic" | "complementary" | "triadic" | "tetradic" | "custom";
}

export default function ColorPicker() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("picker");
  const [currentColor, setCurrentColor] = useState("#4f46e5");
  const [colorName, setColorName] = useState("");
  const [rgb, setRgb] = useState<RGB>({ r: 79, g: 70, b: 229 });
  const [hsl, setHsl] = useState<HSL>({ h: 244, s: 76, l: 59 });
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [currentPalette, setCurrentPalette] = useState<string[]>([]);
  const [paletteName, setPaletteName] = useState("");
  const [paletteType, setPaletteType] = useState<ColorPalette["type"]>("custom");
  const [copied, setCopied] = useState(false);
  
  // Convert HEX to RGB
  const hexToRgb = (hex: string): RGB => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to HEX
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): HSL => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): RGB => {
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

  // Update values when color changes
  useEffect(() => {
    const newRgb = hexToRgb(currentColor);
    setRgb(newRgb);
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  }, [currentColor]);

  // Handle RGB change
  const handleRgbChange = (key: keyof RGB, value: number) => {
    const newRgb = { ...rgb, [key]: value };
    setRgb(newRgb);
    setCurrentColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  // Handle HSL change
  const handleHslChange = (key: keyof HSL, value: number) => {
    const newHsl = { ...hsl, [key]: value };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    setCurrentColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  // Generate a random color
  const generateRandomColor = () => {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setCurrentColor(randomColor);
  };

  // Save current color
  const saveColor = () => {
    if (savedColors.some(color => color.hex.toLowerCase() === currentColor.toLowerCase())) {
      toast({
        title: "Color already saved",
        description: "This color is already in your saved colors",
      });
      return;
    }

    const name = colorName.trim() || `Color ${savedColors.length + 1}`;
    const newColor: SavedColor = {
      id: Date.now().toString(),
      name,
      hex: currentColor,
      rgb,
      hsl,
    };

    setSavedColors([...savedColors, newColor]);
    setColorName("");
    
    toast({
      title: "Color saved",
      description: `${name} has been added to your saved colors`,
    });
  };

  // Remove a saved color
  const removeColor = (id: string) => {
    setSavedColors(savedColors.filter(color => color.id !== id));
  };

  // Copy color to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${text} copied to clipboard`,
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Generate palette based on current color
  const generatePalette = (type: ColorPalette["type"]) => {
    setPaletteType(type);
    
    // Start with the current color
    const baseHsl = hsl;
    let palette: string[] = [];
    
    switch (type) {
      case "analogous":
        // Colors adjacent on the color wheel
        palette = [
          currentColor,
          rgbToHex(...Object.values(hslToRgb((baseHsl.h - 30 + 360) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 30) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h - 60 + 360) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 60) % 360, baseHsl.s, baseHsl.l))),
        ];
        break;
        
      case "monochromatic":
        // Variations of the same hue
        palette = [
          currentColor,
          rgbToHex(...Object.values(hslToRgb(baseHsl.h, baseHsl.s, Math.max(baseHsl.l - 30, 10)))),
          rgbToHex(...Object.values(hslToRgb(baseHsl.h, baseHsl.s, Math.min(baseHsl.l + 30, 90)))),
          rgbToHex(...Object.values(hslToRgb(baseHsl.h, Math.max(baseHsl.s - 30, 10), baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb(baseHsl.h, Math.min(baseHsl.s + 30, 100), baseHsl.l))),
        ];
        break;
        
      case "complementary":
        // Colors opposite on the color wheel
        palette = [
          currentColor,
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb(baseHsl.h, Math.max(baseHsl.s - 20, 10), Math.max(baseHsl.l - 20, 10)))),
          rgbToHex(...Object.values(hslToRgb(baseHsl.h, Math.min(baseHsl.s + 20, 100), Math.min(baseHsl.l + 20, 90)))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 180) % 360, Math.max(baseHsl.s - 20, 10), Math.max(baseHsl.l - 20, 10)))),
        ];
        break;
        
      case "triadic":
        // Three colors equally spaced on the color wheel
        palette = [
          currentColor,
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 120) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 240) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 60) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 300) % 360, baseHsl.s, baseHsl.l))),
        ];
        break;
        
      case "tetradic":
        // Four colors arranged into two complementary pairs
        palette = [
          currentColor,
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 90) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 270) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 45) % 360, baseHsl.s, baseHsl.l))),
        ];
        break;
        
      case "custom":
        if (currentPalette.length > 0) {
          return; // Don't overwrite existing custom palette
        }
        // Default to complementary if custom is empty
        palette = [
          currentColor,
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 90) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 270) % 360, baseHsl.s, baseHsl.l))),
          rgbToHex(...Object.values(hslToRgb((baseHsl.h + 45) % 360, baseHsl.s, baseHsl.l))),
        ];
        break;
    }
    
    setCurrentPalette(palette);
  };

  // Add color to custom palette
  const addColorToPalette = () => {
    if (currentPalette.length >= 10) {
      toast({
        title: "Palette full",
        description: "You can only have up to 10 colors in a palette",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPalette.includes(currentColor)) {
      toast({
        title: "Color already in palette",
        description: "This color is already in your current palette",
      });
      return;
    }
    
    setCurrentPalette([...currentPalette, currentColor]);
    setPaletteType("custom");
  };

  // Remove color from palette
  const removeColorFromPalette = (colorHex: string) => {
    setCurrentPalette(currentPalette.filter(c => c !== colorHex));
  };

  // Save current palette
  const savePalette = () => {
    if (currentPalette.length < 2) {
      toast({
        title: "Not enough colors",
        description: "A palette must have at least 2 colors",
        variant: "destructive",
      });
      return;
    }

    const name = paletteName.trim() || `Palette ${colorPalettes.length + 1}`;
    const newPalette: ColorPalette = {
      id: Date.now().toString(),
      name,
      colors: [...currentPalette],
      type: paletteType,
    };

    setColorPalettes([...colorPalettes, newPalette]);
    setPaletteName("");
    
    toast({
      title: "Palette saved",
      description: `${name} has been added to your saved palettes`,
    });
  };

  // Load a saved palette
  const loadPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette.colors);
    setPaletteType(palette.type);
    setPaletteName(palette.name);
  };

  // Delete a saved palette
  const deletePalette = (id: string) => {
    setColorPalettes(colorPalettes.filter(p => p.id !== id));
  };

  // Get a readable contrast color (black or white) based on background
  const getContrastColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    // Calculate relative luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
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
                Select colors and create beautiful color palettes for your design projects
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Tabs 
                defaultValue="picker" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-4 w-full max-w-md mx-auto">
                  <TabsTrigger value="picker">
                    Color Picker
                  </TabsTrigger>
                  <TabsTrigger value="palette">
                    Palette Generator
                  </TabsTrigger>
                  <TabsTrigger value="saved">
                    Saved Colors
                  </TabsTrigger>
                </TabsList>

                {/* Color Picker Tab */}
                <TabsContent value="picker" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Color picker section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Select Color</CardTitle>
                        <CardDescription>
                          Pick a color or enter color values
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Color preview */}
                        <div 
                          className="h-40 rounded-md border flex items-center justify-center"
                          style={{ 
                            backgroundColor: currentColor,
                            color: getContrastColor(currentColor)
                          }}
                        >
                          <div className="text-center p-4">
                            <div className="text-2xl font-bold mb-2">{currentColor}</div>
                            <div className="text-sm">
                              RGB: {rgb.r}, {rgb.g}, {rgb.b}
                            </div>
                            <div className="text-sm">
                              HSL: {hsl.h}°, {hsl.s}%, {hsl.l}%
                            </div>
                          </div>
                        </div>

                        {/* Color input */}
                        <div className="space-y-4">
                          <div className="flex space-x-2">
                            <Input
                              type="color"
                              value={currentColor}
                              onChange={(e) => setCurrentColor(e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={currentColor}
                              onChange={(e) => setCurrentColor(e.target.value)}
                              placeholder="#RRGGBB"
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={generateRandomColor}
                              title="Generate random color"
                            >
                              <Shuffle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(currentColor)}
                              title="Copy to clipboard"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* RGB Sliders */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">RGB</h3>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-sm">Red: {rgb.r}</label>
                              </div>
                              <Slider
                                value={[rgb.r]}
                                min={0}
                                max={255}
                                step={1}
                                onValueChange={(value) => handleRgbChange("r", value[0])}
                                className="[&>[role=slider]]:bg-red-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-sm">Green: {rgb.g}</label>
                              </div>
                              <Slider
                                value={[rgb.g]}
                                min={0}
                                max={255}
                                step={1}
                                onValueChange={(value) => handleRgbChange("g", value[0])}
                                className="[&>[role=slider]]:bg-green-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-sm">Blue: {rgb.b}</label>
                              </div>
                              <Slider
                                value={[rgb.b]}
                                min={0}
                                max={255}
                                step={1}
                                onValueChange={(value) => handleRgbChange("b", value[0])}
                                className="[&>[role=slider]]:bg-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* HSL Sliders */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">HSL</h3>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-sm">Hue: {hsl.h}°</label>
                              </div>
                              <div 
                                className="h-4 rounded-full mb-2"
                                style={{
                                  background: `linear-gradient(to right, 
                                    hsl(0, ${hsl.s}%, ${hsl.l}%), 
                                    hsl(60, ${hsl.s}%, ${hsl.l}%), 
                                    hsl(120, ${hsl.s}%, ${hsl.l}%), 
                                    hsl(180, ${hsl.s}%, ${hsl.l}%), 
                                    hsl(240, ${hsl.s}%, ${hsl.l}%), 
                                    hsl(300, ${hsl.s}%, ${hsl.l}%), 
                                    hsl(360, ${hsl.s}%, ${hsl.l}%))`
                                }}
                              ></div>
                              <Slider
                                value={[hsl.h]}
                                min={0}
                                max={360}
                                step={1}
                                onValueChange={(value) => handleHslChange("h", value[0])}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-sm">Saturation: {hsl.s}%</label>
                              </div>
                              <div 
                                className="h-4 rounded-full mb-2"
                                style={{
                                  background: `linear-gradient(to right, 
                                    hsl(${hsl.h}, 0%, ${hsl.l}%), 
                                    hsl(${hsl.h}, 100%, ${hsl.l}%))`
                                }}
                              ></div>
                              <Slider
                                value={[hsl.s]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => handleHslChange("s", value[0])}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-sm">Lightness: {hsl.l}%</label>
                              </div>
                              <div 
                                className="h-4 rounded-full mb-2"
                                style={{
                                  background: `linear-gradient(to right, 
                                    hsl(${hsl.h}, ${hsl.s}%, 0%), 
                                    hsl(${hsl.h}, ${hsl.s}%, 50%), 
                                    hsl(${hsl.h}, ${hsl.s}%, 100%))`
                                }}
                              ></div>
                              <Slider
                                value={[hsl.l]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => handleHslChange("l", value[0])}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Save Color */}
                        <div className="pt-4 space-y-4">
                          <div className="flex space-x-2">
                            <Input
                              type="text"
                              value={colorName}
                              onChange={(e) => setColorName(e.target.value)}
                              placeholder="Color name (optional)"
                              className="flex-1"
                            />
                            <Button onClick={saveColor}>
                              Save Color
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Color information section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Color Information</CardTitle>
                        <CardDescription>
                          Detailed color values and formats
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Format</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">HEX</TableCell>
                              <TableCell>{currentColor}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(currentColor)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">RGB</TableCell>
                              <TableCell>rgb({rgb.r}, {rgb.g}, {rgb.b})</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">HSL</TableCell>
                              <TableCell>hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">RGBA</TableCell>
                              <TableCell>rgba({rgb.r}, {rgb.g}, {rgb.b}, 1)</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">HSLA</TableCell>
                              <TableCell>hsla({hsl.h}, {hsl.s}%, {hsl.l}%, 1)</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <div className="pt-4">
                          <h3 className="text-sm font-medium mb-4">Color Preview</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs mb-2">Light Background</h4>
                              <div className="bg-white p-4 rounded-md border">
                                <div className="h-8 w-full rounded-md" style={{ backgroundColor: currentColor }}></div>
                                <div className="mt-2 text-sm" style={{ color: currentColor }}>Text Color</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs mb-2">Dark Background</h4>
                              <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
                                <div className="h-8 w-full rounded-md" style={{ backgroundColor: currentColor }}></div>
                                <div className="mt-2 text-sm" style={{ color: currentColor }}>Text Color</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Palette Generator Tab */}
                <TabsContent value="palette" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current color and palette options */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Create Palette</CardTitle>
                        <CardDescription>
                          Generate or build a color palette
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Selected color preview */}
                        <div className="flex items-center space-x-4">
                          <div 
                            className="h-12 w-12 rounded-md border"
                            style={{ backgroundColor: currentColor }}
                          ></div>
                          <div>
                            <h3 className="text-sm font-medium">Current Color</h3>
                            <p className="text-xs text-muted-foreground">{currentColor}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addColorToPalette}
                            className="ml-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Palette
                          </Button>
                        </div>

                        {/* Palette generation options */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Generate Palette</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePalette("analogous")}
                            >
                              Analogous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePalette("complementary")}
                            >
                              Complementary
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePalette("monochromatic")}
                            >
                              Monochromatic
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePalette("triadic")}
                            >
                              Triadic
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePalette("tetradic")}
                            >
                              Tetradic
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPalette([]);
                                setPaletteType("custom");
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>

                        {/* Save palette */}
                        <div className="pt-4 space-y-4">
                          <h3 className="text-sm font-medium">Save Palette</h3>
                          <div className="flex space-x-2">
                            <Input
                              type="text"
                              value={paletteName}
                              onChange={(e) => setPaletteName(e.target.value)}
                              placeholder="Palette name (optional)"
                              className="flex-1"
                            />
                            <Button onClick={savePalette}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </div>

                        {/* Saved palettes */}
                        {colorPalettes.length > 0 && (
                          <div className="pt-4 space-y-4">
                            <h3 className="text-sm font-medium">Saved Palettes</h3>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                              {colorPalettes.map((palette) => (
                                <div 
                                  key={palette.id}
                                  className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium">{palette.name}</h4>
                                    <div className="space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => loadPalette(palette)}
                                        title="Load palette"
                                      >
                                        <ArrowLeft className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deletePalette(palette.id)}
                                        title="Delete palette"
                                      >
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex">
                                    {palette.colors.map((color, i) => (
                                      <div
                                        key={i}
                                        className="h-6 flex-1"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      ></div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {palette.type.charAt(0).toUpperCase() + palette.type.slice(1)} • {palette.colors.length} colors
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Current palette display */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Palette</CardTitle>
                        <CardDescription>
                          {paletteType.charAt(0).toUpperCase() + paletteType.slice(1)} palette with {currentPalette.length} colors
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {currentPalette.length > 0 ? (
                          <div className="space-y-6">
                            {/* Palette preview */}
                            <div className="flex h-20 rounded-md overflow-hidden border">
                              {currentPalette.map((color, i) => (
                                <div
                                  key={i}
                                  className="flex-1"
                                  style={{ backgroundColor: color }}
                                ></div>
                              ))}
                            </div>

                            {/* Individual colors */}
                            <div className="space-y-3">
                              {currentPalette.map((color, i) => {
                                const contrastColor = getContrastColor(color);
                                return (
                                  <div 
                                    key={i}
                                    className="flex items-center p-3 rounded-md"
                                    style={{ 
                                      backgroundColor: color,
                                      color: contrastColor
                                    }}
                                  >
                                    <div className="font-mono">{color}</div>
                                    <div className="ml-auto flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(color)}
                                        style={{ color: contrastColor }}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      {paletteType === "custom" && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeColorFromPalette(color)}
                                          style={{ color: contrastColor }}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* CSS code */}
                            <div className="p-4 border rounded-md bg-muted/50">
                              <h3 className="text-sm font-medium mb-2">CSS Variables</h3>
                              <pre className="text-xs whitespace-pre-wrap font-mono">
{`:root {
${currentPalette.map((color, i) => `  --color-${i + 1}: ${color};`).join('\n')}
}`}
                              </pre>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => copyToClipboard(`:root {\n${currentPalette.map((color, i) => `  --color-${i + 1}: ${color};`).join('\n')}\n}`)}
                              >
                                <Copy className="h-3 w-3 mr-2" />
                                Copy CSS
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <p>No colors in current palette</p>
                            <p className="text-sm mt-2">Generate a palette or add colors individually</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Saved Colors Tab */}
                <TabsContent value="saved" className="space-y-6">
                  {savedColors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedColors.map((color) => (
                        <motion.div 
                          key={color.id}
                          whileHover={{ y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card>
                            <div
                              className="h-32 rounded-t-lg flex items-center justify-center"
                              style={{ 
                                backgroundColor: color.hex,
                                color: getContrastColor(color.hex)
                              }}
                            >
                              <div className="text-center p-4">
                                <div className="text-xl font-bold mb-1">{color.name}</div>
                                <div className="text-sm">{color.hex}</div>
                              </div>
                            </div>
                            <CardContent className="pt-4">
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">RGB</span>
                                  <span className="text-xs font-mono">
                                    ({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">HSL</span>
                                  <span className="text-xs font-mono">
                                    ({color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%)
                                  </span>
                                </div>
                                <div className="flex justify-end space-x-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentColor(color.hex);
                                      setActiveTab("picker");
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(color.hex)}
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeColor(color.id)}
                                  >
                                    <Trash className="h-3 w-3 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <h3 className="text-lg font-medium mb-2">No saved colors yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Select colors in the picker tab and save them to your collection
                        </p>
                        <Button onClick={() => setActiveTab("picker")}>
                          Go to Color Picker
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>

            <motion.div
              className="max-w-3xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">Color Theory Guide</h2>
              <p className="mb-4 text-muted-foreground">
                Understanding color theory helps create visually appealing designs. Here are some common color harmonies:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Analogous</h3>
                  <p className="text-sm text-muted-foreground">
                    Colors that are adjacent to each other on the color wheel, creating a harmonious and cohesive look.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Complementary</h3>
                  <p className="text-sm text-muted-foreground">
                    Colors opposite each other on the color wheel, creating a high-contrast, vibrant look.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Monochromatic</h3>
                  <p className="text-sm text-muted-foreground">
                    Different shades, tones, and tints of a single color, creating a subtle and elegant look.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Triadic</h3>
                  <p className="text-sm text-muted-foreground">
                    Three colors evenly spaced around the color wheel, creating a balanced yet vibrant look.
                  </p>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}