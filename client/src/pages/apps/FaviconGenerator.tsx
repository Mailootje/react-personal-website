import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Upload, Download, Image, AlertCircle, X, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FaviconSize {
  size: number;
  name: string;
  recommended: boolean;
  platform?: string;
}

export default function FaviconGenerator() {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFavicons, setGeneratedFavicons] = useState<{ size: number; dataUrl: string }[]>([]);
  const [includeAppleTouch, setIncludeAppleTouch] = useState(true);
  const [includeAndroid, setIncludeAndroid] = useState(true);
  const [includeMicrosoft, setIncludeMicrosoft] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [includeTransparent, setIncludeTransparent] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available favicon sizes
  const faviconSizes: FaviconSize[] = [
    { size: 16, name: "Favicon 16x16", recommended: true },
    { size: 32, name: "Favicon 32x32", recommended: true },
    { size: 48, name: "Favicon 48x48", recommended: false },
    { size: 64, name: "Favicon 64x64", recommended: false },
    { size: 96, name: "Favicon 96x96", recommended: false },
    { size: 128, name: "Favicon 128x128", recommended: false },
    { size: 152, name: "Apple Touch Icon 152x152", recommended: true, platform: "apple" },
    { size: 167, name: "Apple Touch Icon 167x167", recommended: true, platform: "apple" },
    { size: 180, name: "Apple Touch Icon 180x180", recommended: true, platform: "apple" },
    { size: 192, name: "Android Icon 192x192", recommended: true, platform: "android" },
    { size: 196, name: "Android Icon 196x196", recommended: false, platform: "android" },
    { size: 512, name: "Android Icon 512x512", recommended: true, platform: "android" },
    { size: 70, name: "MS Small Tile 70x70", recommended: false, platform: "microsoft" },
    { size: 144, name: "MS Square 144x144", recommended: false, platform: "microsoft" },
    { size: 150, name: "MS Square 150x150", recommended: true, platform: "microsoft" },
    { size: 310, name: "MS Square 310x310", recommended: true, platform: "microsoft" },
  ];

  // Trigger file input click
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, SVG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Set the file and create a preview
    setUploadedImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      // Clear previously generated favicons
      setGeneratedFavicons([]);
    };
    reader.readAsDataURL(file);
    
    // Reset file input value
    if (event.target) {
      event.target.value = "";
    }
  };

  // Clear the uploaded image
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageFile(null);
    setGeneratedFavicons([]);
  };

  // Generate favicons
  const generateFavicons = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedFavicons([]);

    try {
      // Load the image
      const img = new Image();
      img.src = uploadedImage;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      // Filter sizes based on platform selections
      const selectedSizes = faviconSizes.filter(size => {
        if (!size.platform) return true;
        if (size.platform === "apple" && !includeAppleTouch) return false;
        if (size.platform === "android" && !includeAndroid) return false;
        if (size.platform === "microsoft" && !includeMicrosoft) return false;
        return true;
      });

      // Generate each favicon size
      const favicons = await Promise.all(
        selectedSizes.map(async ({ size }) => {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Failed to get canvas context");
          }

          // If not transparent or if it's an Apple Touch icon, fill with background color
          if (!includeTransparent || size === 152 || size === 167 || size === 180) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);
          }

          // Calculate dimensions to maintain aspect ratio
          const aspectRatio = img.width / img.height;
          let drawWidth = size;
          let drawHeight = size;
          let offsetX = 0;
          let offsetY = 0;

          if (aspectRatio > 1) {
            // Wider than tall
            drawHeight = size / aspectRatio;
            offsetY = (size - drawHeight) / 2;
          } else {
            // Taller than wide
            drawWidth = size * aspectRatio;
            offsetX = (size - drawWidth) / 2;
          }

          // Add padding for better look (10% padding)
          const padding = size * 0.1;
          drawWidth -= padding * 2;
          drawHeight -= padding * 2;
          offsetX += padding;
          offsetY += padding;

          // Draw the image
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          return {
            size,
            dataUrl: canvas.toDataURL("image/png"),
          };
        })
      );

      setGeneratedFavicons(favicons);
      
      toast({
        title: "Favicons generated",
        description: `Successfully generated ${favicons.length} favicon sizes`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate favicons. Please try again.",
        variant: "destructive",
      });
      console.error("Favicon generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download a single favicon
  const downloadFavicon = (dataUrl: string, size: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `favicon-${size}x${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all favicons as a zip file
  const downloadAllFavicons = async () => {
    if (generatedFavicons.length === 0) return;

    try {
      // Dynamic import JSZip (to avoid increasing initial bundle size)
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      
      // Add each favicon to the zip
      generatedFavicons.forEach(({ dataUrl, size }) => {
        // Convert data URL to blob
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeType });
        zip.file(`favicon-${size}x${size}.png`, blob);
      });
      
      // Generate HTML code for the favicons
      const htmlCode = generateHtmlCode();
      zip.file("favicon-instructions.html", htmlCode);
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favicons.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your favicons are being downloaded as a zip file",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download favicons. Please try again.",
        variant: "destructive",
      });
      console.error("Favicon download error:", error);
    }
  };

  // Generate HTML code for the favicons
  const generateHtmlCode = () => {
    let htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Favicon Installation Instructions</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        h2 { margin-top: 30px; }
        .note { background: #fffde7; padding: 10px; border-left: 4px solid #ffd600; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Favicon Installation Instructions</h1>
    <p>Add the following code to the <code>&lt;head&gt;</code> section of your HTML:</p>
    
    <pre><code>`;
    
    // Add standard favicons
    const standardSizes = generatedFavicons.filter(({ size }) => size === 16 || size === 32);
    if (standardSizes.length > 0) {
      standardSizes.forEach(({ size }) => {
        htmlCode += `&lt;link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png"&gt;\n`;
      });
    }
    
    // Add Apple Touch icons
    const appleSizes = generatedFavicons.filter(({ size }) => size === 152 || size === 167 || size === 180);
    if (appleSizes.length > 0) {
      appleSizes.forEach(({ size }) => {
        htmlCode += `&lt;link rel="apple-touch-icon" sizes="${size}x${size}" href="/favicon-${size}x${size}.png"&gt;\n`;
      });
    }
    
    // Add Android icons
    const androidSizes = generatedFavicons.filter(({ size }) => size === 192 || size === 512);
    if (androidSizes.length > 0) {
      htmlCode += `&lt;link rel="manifest" href="/site.webmanifest"&gt;\n`;
    }
    
    // Add Microsoft tiles
    const msSizes = generatedFavicons.filter(({ size }) => size === 70 || size === 150 || size === 310);
    if (msSizes.length > 0) {
      htmlCode += `&lt;meta name="msapplication-TileColor" content="${backgroundColor}"&gt;\n`;
      const msSize = msSizes.find(({ size }) => size === 150);
      if (msSize) {
        htmlCode += `&lt;meta name="msapplication-TileImage" content="/favicon-150x150.png"&gt;\n`;
      }
    }
    
    htmlCode += `</code></pre>
    
    <h2>Additional Steps</h2>
    
    <h3>For Android Support</h3>
    <p>Create a file named <code>site.webmanifest</code> with the following content:</p>
    
    <pre><code>{
  "name": "Your Site Name",
  "short_name": "Site Name",
  "icons": [`;
    
    const androidManifestIcons = generatedFavicons.filter(({ size }) => size === 192 || size === 512);
    androidManifestIcons.forEach(({ size }, index) => {
      htmlCode += `
    {
      "src": "/favicon-${size}x${size}.png",
      "sizes": "${size}x${size}",
      "type": "image/png"
    }${index < androidManifestIcons.length - 1 ? ',' : ''}`;
    });
    
    htmlCode += `
  ],
  "theme_color": "${backgroundColor}",
  "background_color": "${backgroundColor}",
  "display": "standalone"
}</code></pre>

    <h3>For Microsoft Support</h3>
    <p>Create a file named <code>browserconfig.xml</code> with the following content:</p>
    
    <pre><code>&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;browserconfig&gt;
    &lt;msapplication&gt;
        &lt;tile&gt;`;
        
    const msTileIcons = generatedFavicons.filter(({ size }) => 
      size === 70 || size === 150 || size === 310);
      
    msTileIcons.forEach(({ size }) => {
      let sizeName = "square";
      if (size === 70) sizeName = "small";
      htmlCode += `
            &lt;${sizeName}${size === 70 ? '' : size}x${size === 70 ? '' : size} src="/favicon-${size}x${size}.png"/&gt;`;
    });
    
    htmlCode += `
            &lt;TileColor&gt;${backgroundColor}&lt;/TileColor&gt;
        &lt;/tile&gt;
    &lt;/msapplication&gt;
&lt;/browserconfig&gt;</code></pre>

    <div class="note">
        <strong>Note:</strong> Make sure to replace "Your Site Name" in the webmanifest file with your actual site name.
        <p>Place all favicon files in the root directory of your website, or adjust the paths in the code accordingly.</p>
    </div>
</body>
</html>`;

    return htmlCode;
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Favicon Generator</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Create complete favicon sets for your website from a single image
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Image Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Image</CardTitle>
                  <CardDescription>
                    Upload a square image (ideally SVG or PNG with transparency)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!uploadedImage ? (
                    <div className="border-2 border-dashed rounded-lg p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Image className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Drag and drop an image here, or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recommended: SVG or PNG with transparency <br />
                            Minimum 512x512px for best results
                          </p>
                        </div>
                        <Button onClick={handleChooseFile}>Choose File</Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6 text-center relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearUploadedImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-48 h-48 mx-auto border rounded-md overflow-hidden">
                          <img
                            src={uploadedImage}
                            alt="Uploaded image"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {uploadedImageFile?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {uploadedImageFile && `${(uploadedImageFile.size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleChooseFile}
                          className="mt-2"
                        >
                          Change Image
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-medium">Options</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="apple-touch">Apple Touch Icons</Label>
                          <p className="text-xs text-muted-foreground">
                            For iOS and macOS devices
                          </p>
                        </div>
                        <Switch
                          id="apple-touch"
                          checked={includeAppleTouch}
                          onCheckedChange={setIncludeAppleTouch}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="android">Android Icons</Label>
                          <p className="text-xs text-muted-foreground">
                            For Android home screen and PWA
                          </p>
                        </div>
                        <Switch
                          id="android"
                          checked={includeAndroid}
                          onCheckedChange={setIncludeAndroid}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="microsoft">Microsoft Tiles</Label>
                          <p className="text-xs text-muted-foreground">
                            For Windows and IE/Edge
                          </p>
                        </div>
                        <Switch
                          id="microsoft"
                          checked={includeMicrosoft}
                          onCheckedChange={setIncludeMicrosoft}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="transparent">Transparent Background</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable for PNGs with transparency
                          </p>
                        </div>
                        <Switch
                          id="transparent"
                          checked={includeTransparent}
                          onCheckedChange={setIncludeTransparent}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bg-color">Background Color</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Used for non-transparent backgrounds and metadata
                        </p>
                        <div className="flex space-x-2">
                          <Input
                            type="color"
                            id="bg-color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#RRGGBB"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-2">
                    <Button
                      onClick={generateFavicons}
                      disabled={!uploadedImage || isGenerating}
                      className="w-full"
                    >
                      {isGenerating && (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {isGenerating ? "Generating..." : "Generate Favicons"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview & Download</CardTitle>
                  <CardDescription>
                    {generatedFavicons.length > 0
                      ? `${generatedFavicons.length} favicon sizes generated`
                      : "Generated favicons will appear here"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {generatedFavicons.length > 0 ? (
                    <>
                      <Tabs defaultValue="preview">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                          <TabsTrigger value="code">HTML Code</TabsTrigger>
                        </TabsList>
                        
                        {/* Preview Tab */}
                        <TabsContent value="preview" className="space-y-4">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={downloadAllFavicons}
                              className="text-xs"
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Download All as ZIP
                            </Button>
                          </div>
                          
                          <div className="border rounded-md p-4">
                            <div className="text-sm font-medium mb-4">Standard Favicons</div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                              {generatedFavicons
                                .filter(({ size }) => size <= 128 && !faviconSizes.find(s => s.size === size)?.platform)
                                .map(({ size, dataUrl }) => (
                                  <div
                                    key={size}
                                    className="flex flex-col items-center space-y-2"
                                  >
                                    <div className="relative border rounded-md p-2 bg-muted/50">
                                      <img
                                        src={dataUrl}
                                        alt={`Favicon ${size}x${size}`}
                                        className="mx-auto"
                                        style={{
                                          width: size > 64 ? 64 : size,
                                          height: size > 64 ? 64 : size,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-center">{size}×{size}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => downloadFavicon(dataUrl, size)}
                                      className="h-6 w-6"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                          
                          {includeAppleTouch && (
                            <div className="border rounded-md p-4">
                              <div className="text-sm font-medium mb-4">Apple Touch Icons</div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {generatedFavicons
                                  .filter(({ size }) => faviconSizes.find(s => s.size === size)?.platform === "apple")
                                  .map(({ size, dataUrl }) => (
                                    <div
                                      key={size}
                                      className="flex flex-col items-center space-y-2"
                                    >
                                      <div className="relative border rounded-md p-2 bg-muted/50">
                                        <img
                                          src={dataUrl}
                                          alt={`Apple Touch Icon ${size}x${size}`}
                                          className="mx-auto"
                                          style={{
                                            width: 64,
                                            height: 64,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-center">{size}×{size}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => downloadFavicon(dataUrl, size)}
                                        className="h-6 w-6"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          
                          {includeAndroid && (
                            <div className="border rounded-md p-4">
                              <div className="text-sm font-medium mb-4">Android Icons</div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {generatedFavicons
                                  .filter(({ size }) => faviconSizes.find(s => s.size === size)?.platform === "android")
                                  .map(({ size, dataUrl }) => (
                                    <div
                                      key={size}
                                      className="flex flex-col items-center space-y-2"
                                    >
                                      <div className="relative border rounded-md p-2 bg-muted/50">
                                        <img
                                          src={dataUrl}
                                          alt={`Android Icon ${size}x${size}`}
                                          className="mx-auto"
                                          style={{
                                            width: 64,
                                            height: 64,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-center">{size}×{size}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => downloadFavicon(dataUrl, size)}
                                        className="h-6 w-6"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          
                          {includeMicrosoft && (
                            <div className="border rounded-md p-4">
                              <div className="text-sm font-medium mb-4">Microsoft Tiles</div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {generatedFavicons
                                  .filter(({ size }) => faviconSizes.find(s => s.size === size)?.platform === "microsoft")
                                  .map(({ size, dataUrl }) => (
                                    <div
                                      key={size}
                                      className="flex flex-col items-center space-y-2"
                                    >
                                      <div className="relative border rounded-md p-2 bg-muted/50">
                                        <img
                                          src={dataUrl}
                                          alt={`Microsoft Tile ${size}x${size}`}
                                          className="mx-auto"
                                          style={{
                                            width: 64,
                                            height: 64,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-center">{size}×{size}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => downloadFavicon(dataUrl, size)}
                                        className="h-6 w-6"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        
                        {/* HTML Code Tab */}
                        <TabsContent value="code" className="space-y-4">
                          <div className="bg-muted rounded-md p-4">
                            <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-[400px]">
                              <code>
                                {/* Standard favicons */}
                                {generatedFavicons
                                  .filter(({ size }) => size === 16 || size === 32)
                                  .map(({ size }) => (
                                    `<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png">\n`
                                  ))}
                                
                                {/* Apple Touch icons */}
                                {includeAppleTouch && 
                                  generatedFavicons
                                    .filter(({ size }) => faviconSizes.find(s => s.size === size)?.platform === "apple")
                                    .map(({ size }) => (
                                      `<link rel="apple-touch-icon" sizes="${size}x${size}" href="/favicon-${size}x${size}.png">\n`
                                    ))}
                                
                                {/* Android manifest */}
                                {includeAndroid && generatedFavicons.some(({ size }) => size === 192 || size === 512) && 
                                  `<link rel="manifest" href="/site.webmanifest">\n`}
                                
                                {/* Microsoft tiles */}
                                {includeMicrosoft && generatedFavicons.some(({ size }) => size === 150) && 
                                  `<meta name="msapplication-TileColor" content="${backgroundColor}">\n<meta name="msapplication-TileImage" content="/favicon-150x150.png">\n`}
                              </code>
                            </pre>
                          </div>
                          
                          <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200">
                            <h3 className="text-sm font-medium flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Additional Configuration Required
                            </h3>
                            <p className="text-xs mt-2">
                              For complete setup, you'll need to create additional files. 
                              Download the ZIP file which includes HTML installation instructions 
                              with the complete code for all required files.
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={downloadAllFavicons}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download ZIP with Complete Instructions
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                    <div className="text-center py-12 px-6">
                      <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Favicons Generated Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Upload an image and click "Generate Favicons" to create your favicon set.
                      </p>
                      
                      <div className="p-4 border rounded-md bg-muted/50 text-left">
                        <h4 className="text-sm font-medium mb-2">Recommended Image Guidelines</h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            Use a square image (1:1 aspect ratio)
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            SVG or PNG with transparency works best
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            Minimum 512×512 pixels for best quality
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            Keep the design simple and recognizable
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="max-w-3xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">About Favicons</h2>
              <p className="mb-4 text-muted-foreground">
                Favicons are small icons displayed in browser tabs, bookmarks, and mobile home screens that represent your website or web application. A complete favicon set includes various sizes to support different devices and platforms.
              </p>
              
              <h3 className="text-lg font-bold mt-6 mb-2">Platform Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Standard Browsers</h4>
                  <p className="text-sm text-muted-foreground">
                    16×16, 32×32, and 48×48 pixel favicons are used by most desktop browsers in tabs and bookmarks.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Apple Devices</h4>
                  <p className="text-sm text-muted-foreground">
                    Apple Touch Icons (152×152, 167×167, 180×180) are used when adding a website to the home screen on iOS devices.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Android & Windows</h4>
                  <p className="text-sm text-muted-foreground">
                    Android uses 192×192 and 512×512 icons for PWAs, while Windows uses various tile sizes for pinned sites.
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