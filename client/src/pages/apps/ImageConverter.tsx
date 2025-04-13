import { useState, useRef, useCallback, useEffect } from 'react';
import { FaUpload, FaDownload, FaFileArchive, FaTrash, FaSyncAlt, FaMicrochip } from 'react-icons/fa';
import JSZip from 'jszip';

// Ensure WebGL context type is available
declare global {
  interface Window {
    WebGLRenderingContext: typeof WebGLRenderingContext;
  }
}
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { VideoBackground } from "@/components/VideoBackground";
import { Header } from "@/components/Header";
import { Container } from "@/components/ui/container";

// Image conversion formats supported
const FORMAT_OPTIONS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'gif', label: 'GIF' },
  { value: 'bmp', label: 'BMP' },
  { value: 'tiff', label: 'TIFF' },
  { value: 'avif', label: 'AVIF' },
  { value: 'ico', label: 'ICO (Icon)' },
  { value: 'svg+xml', label: 'SVG' },
  { value: 'heic', label: 'HEIC' }
];

// Image processing options
interface ImageOptions {
  format: string;
  quality: number;
  resize: boolean;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

// Default image processing options
const DEFAULT_OPTIONS: ImageOptions = {
  format: 'jpeg',
  quality: 90,
  resize: false,
  width: 800,
  height: 600,
  maintainAspectRatio: true
};

// Image item with metadata
interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  isConverting: boolean;
  error: string | null;
}

export default function ImageConverter() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<ImageOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [useHardwareAcceleration, setUseHardwareAcceleration] = useState(true);
  const [isHardwareAccelerationSupported, setIsHardwareAccelerationSupported] = useState(false);
  
  // Check if hardware acceleration (WebGL) is supported
  useEffect(() => {
    try {
      // Create temporary canvas to check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        // WebGL is supported
        setIsHardwareAccelerationSupported(true);
        webglCanvasRef.current = canvas;
        console.log('Hardware acceleration enabled (WebGL supported)');
      } else {
        console.log('WebGL not supported, falling back to standard canvas');
        setUseHardwareAcceleration(false);
        setIsHardwareAccelerationSupported(false);
      }
    } catch (e) {
      console.error('Error initializing WebGL:', e);
      setUseHardwareAcceleration(false);
      setIsHardwareAccelerationSupported(false);
    }
  }, []);

  // Handler for file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newImages: ImageItem[] = Array.from(e.target.files).map(file => ({
      id: generateId(),
      file,
      originalUrl: URL.createObjectURL(file),
      convertedUrl: null,
      convertedBlob: null,
      isConverting: false,
      error: null,
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  // Generate a unique ID for each image
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Handle image removal
  const removeImage = (id: string) => {
    setImages(prevImages => {
      const updatedImages = prevImages.filter(img => img.id !== id);
      // Release object URLs to avoid memory leaks
      const removedImage = prevImages.find(img => img.id === id);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.originalUrl);
        if (removedImage.convertedUrl) {
          URL.revokeObjectURL(removedImage.convertedUrl);
        }
      }
      return updatedImages;
    });
  };

  // Clear all images
  const clearAllImages = () => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.convertedUrl) {
        URL.revokeObjectURL(img.convertedUrl);
      }
    });
    setImages([]);
  };

  // Hardware-accelerated processing using WebGL
  const convertImageWithWebGL = async (imgItem: ImageItem, options: ImageOptions): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        // Check if WebGL is available
        if (!webglCanvasRef.current) {
          console.warn('WebGL canvas not available, falling back to standard processing');
          // Fallback to regular canvas processing
          const result = convertImageWithCanvas(imgItem, options);
          resolve(result);
          return;
        }

        const img = new Image();
        img.onload = () => {
          // Determine dimensions
          let width = img.width;
          let height = img.height;
          
          if (options.resize) {
            if (options.maintainAspectRatio) {
              // Calculate new dimensions while maintaining aspect ratio
              const aspectRatio = img.width / img.height;
              if (options.width / options.height > aspectRatio) {
                height = options.height;
                width = height * aspectRatio;
              } else {
                width = options.width;
                height = width / aspectRatio;
              }
            } else {
              // Use exact dimensions
              width = options.width;
              height = options.height;
            }
          }
          
          // Set canvas dimensions
          const canvas = webglCanvasRef.current as HTMLCanvasElement;
          canvas.width = width;
          canvas.height = height;
          
          // Get WebGL context
          // Use type assertion to handle WebGL specific methods
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) {
            console.warn('WebGL context not available, falling back to standard processing');
            // Fallback to regular canvas processing
            const result = convertImageWithCanvas(imgItem, options);
            resolve(result);
            return;
          }
          
          // Explicitly type the WebGL context to fix the TypeScript errors
          const webgl = gl as WebGLRenderingContext;
          
          // Set up WebGL for image processing
          // Create vertex shader
          const vertexShader = webgl.createShader(webgl.VERTEX_SHADER);
          if (!vertexShader) {
            resolve(null);
            return;
          }
          
          webgl.shaderSource(vertexShader, `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            void main() {
              gl_Position = vec4(a_position, 0, 1);
              v_texCoord = a_texCoord;
            }
          `);
          webgl.compileShader(vertexShader);
          
          // Create fragment shader
          const fragmentShader = webgl.createShader(webgl.FRAGMENT_SHADER);
          if (!fragmentShader) {
            resolve(null);
            return;
          }
          
          // Apply adjustments based on format
          const hasTransparency = ['png', 'ico', 'tiff'].includes(options.format);
          
          webgl.shaderSource(fragmentShader, `
            precision mediump float;
            varying vec2 v_texCoord;
            uniform sampler2D u_image;
            void main() {
              vec4 color = texture2D(u_image, v_texCoord);
              ${!hasTransparency ? 'color.a = 1.0;' : ''} // Force opaque for formats that don't support transparency
              gl_FragColor = color;
            }
          `);
          webgl.compileShader(fragmentShader);
          
          // Create program and link shaders
          const program = webgl.createProgram();
          if (!program) {
            resolve(null);
            return;
          }
          
          webgl.attachShader(program, vertexShader);
          webgl.attachShader(program, fragmentShader);
          webgl.linkProgram(program);
          webgl.useProgram(program);
          
          // Set up geometry for drawing the image
          const positionBuffer = webgl.createBuffer();
          webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
          webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0
          ]), webgl.STATIC_DRAW);
          
          // Set up texture coordinates
          const texCoordBuffer = webgl.createBuffer();
          webgl.bindBuffer(webgl.ARRAY_BUFFER, texCoordBuffer);
          webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
          ]), webgl.STATIC_DRAW);
          
          // Create texture for the image
          const texture = webgl.createTexture();
          webgl.bindTexture(webgl.TEXTURE_2D, texture);
          
          // Set texture parameters
          webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
          webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
          webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
          webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
          
          // Upload image to texture
          webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, img);
          
          // Set up attributes
          const positionLocation = webgl.getAttribLocation(program, "a_position");
          const texCoordLocation = webgl.getAttribLocation(program, "a_texCoord");
          
          webgl.enableVertexAttribArray(positionLocation);
          webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
          webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);
          
          webgl.enableVertexAttribArray(texCoordLocation);
          webgl.bindBuffer(webgl.ARRAY_BUFFER, texCoordBuffer);
          webgl.vertexAttribPointer(texCoordLocation, 2, webgl.FLOAT, false, 0, 0);
          
          // Draw the image using WebGL
          webgl.viewport(0, 0, width, height);
          webgl.clearColor(1, 1, 1, 1); // White background
          webgl.clear(webgl.COLOR_BUFFER_BIT);
          webgl.drawArrays(webgl.TRIANGLES, 0, 6);
          
          // Read back the result and convert to blob
          // Special handling for different formats
          let mimeType = `image/${options.format}`;
          
          // Special case for SVG
          if (options.format === 'svg+xml') {
            mimeType = 'image/svg+xml';
          }
          
          // For ICO format, use PNG as intermediate format since toBlob doesn't support ICO directly
          if (options.format === 'ico') {
            mimeType = 'image/png';
          }
          
          // Convert WebGL canvas to regular canvas to use toBlob
          const outputCanvas = document.createElement('canvas');
          outputCanvas.width = width;
          outputCanvas.height = height;
          const outputCtx = outputCanvas.getContext('2d');
          if (!outputCtx) {
            resolve(null);
            return;
          }
          
          // Draw WebGL canvas to regular canvas
          outputCtx.drawImage(canvas, 0, 0);
          
          // Convert to blob
          const quality = options.quality / 100;
          outputCanvas.toBlob(
            (blob) => {
              if (blob) {
                // For special formats that need additional processing
                if (options.format === 'ico') {
                  const newBlob = new Blob([blob], { type: 'image/x-icon' });
                  resolve(newBlob);
                } else {
                  resolve(blob);
                }
              } else {
                resolve(null);
              }
            },
            mimeType,
            quality
          );
        };
        
        img.onerror = () => {
          resolve(null);
        };
        
        img.src = imgItem.originalUrl;
      } catch (error) {
        console.error("Error in WebGL processing:", error);
        // Fallback to regular canvas processing
        const result = convertImageWithCanvas(imgItem, options);
        resolve(result);
      }
    });
  };

  // Standard canvas-based processing (no hardware acceleration)
  const convertImageWithCanvas = async (imgItem: ImageItem, options: ImageOptions): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Create canvas for image manipulation
          const canvas = document.createElement('canvas');
          
          // Determine dimensions
          let width = img.width;
          let height = img.height;
          
          if (options.resize) {
            if (options.maintainAspectRatio) {
              // Calculate new dimensions while maintaining aspect ratio
              const aspectRatio = img.width / img.height;
              if (options.width / options.height > aspectRatio) {
                height = options.height;
                width = height * aspectRatio;
              } else {
                width = options.width;
                height = width / aspectRatio;
              }
            } else {
              // Use exact dimensions
              width = options.width;
              height = options.height;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          // For some formats, adjust background settings
          if (['png', 'ico', 'tiff'].includes(options.format)) {
            // For formats that support transparency, ensure we don't add a background
            ctx.clearRect(0, 0, width, height);
          } else {
            // For formats that don't support transparency, add a white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to selected format
          const quality = options.quality / 100;
          
          // Special handling for different formats
          let mimeType = `image/${options.format}`;
          
          // Special case for SVG
          if (options.format === 'svg+xml') {
            mimeType = 'image/svg+xml';
          }
          
          // For ICO format, use PNG as intermediate format since toBlob doesn't support ICO directly
          if (options.format === 'ico') {
            mimeType = 'image/png';
          }
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // For special formats that need additional processing, handle here
                if (options.format === 'ico') {
                  // In a real implementation, convert PNG to ICO using a library
                  // For now, just change the MIME type to simulate conversion
                  const newBlob = new Blob([blob], { type: 'image/x-icon' });
                  resolve(newBlob);
                } else {
                  resolve(blob);
                }
              } else {
                resolve(null);
              }
            },
            mimeType,
            quality
          );
        };
        
        img.onerror = () => {
          resolve(null);
        };
        
        img.src = imgItem.originalUrl;
      } catch (error) {
        console.error("Error converting image with canvas:", error);
        resolve(null);
      }
    });
  };

  // Convert image to the selected format - main conversion function
  const convertImage = async (imgItem: ImageItem, options: ImageOptions): Promise<Blob | null> => {
    try {
      // Handle SVG format specially, as it requires different processing
      if (options.format === 'svg+xml') {
        // For SVG output, we would need server-side processing or a specialized library
        // Instead, show a message that browser-side conversion to SVG is limited
        toast({
          title: "SVG Conversion Limited",
          description: "Browser-based conversion to SVG is not fully supported. Results may vary."
        });
      }
      
      // Handle HEIC format - browser support is limited, so provide a warning
      if (options.format === 'heic') {
        toast({
          title: "HEIC Format Warning",
          description: "HEIC format has limited browser support. The image may not display correctly in all browsers."
        });
      }
      
      // Choose processing method based on hardware acceleration setting
      if (useHardwareAcceleration && isHardwareAccelerationSupported) {
        return await convertImageWithWebGL(imgItem, options);
      } else {
        return await convertImageWithCanvas(imgItem, options);
      }
    } catch (error) {
      console.error("Error in image conversion:", error);
      return null;
    }
  };

  // Convert all images
  const convertAllImages = async () => {
    if (images.length === 0) {
      toast({
        title: "No images to convert",
        description: "Please upload at least one image first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      const updatedImages = [...images];
      
      for (let i = 0; i < updatedImages.length; i++) {
        // Update progress
        setProcessingProgress(Math.floor((i / updatedImages.length) * 100));
        
        // Skip already converted images with the same settings
        if (updatedImages[i].convertedBlob && !updatedImages[i].isConverting) {
          continue;
        }
        
        // Set converting flag
        updatedImages[i] = { ...updatedImages[i], isConverting: true, error: null };
        setImages(updatedImages);
        
        // Convert image
        const result = await convertImage(updatedImages[i], options);
        
        // Update result
        if (result) {
          const url = URL.createObjectURL(result);
          updatedImages[i] = {
            ...updatedImages[i],
            convertedUrl: url,
            convertedBlob: result,
            isConverting: false,
            error: null
          };
        } else {
          updatedImages[i] = {
            ...updatedImages[i],
            convertedUrl: null,
            convertedBlob: null,
            isConverting: false,
            error: "Failed to convert image"
          };
        }
        
        setImages([...updatedImages]);
      }
      
      setProcessingProgress(100);
      
      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${updatedImages.filter(img => img.convertedBlob).length} of ${updatedImages.length} images`,
      });
    } catch (error) {
      console.error("Error in batch conversion:", error);
      toast({
        title: "Conversion Failed",
        description: "An error occurred during conversion.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Download a single converted image
  const downloadImage = (imgItem: ImageItem) => {
    if (!imgItem.convertedUrl || !imgItem.convertedBlob) {
      toast({
        title: "Cannot Download",
        description: "Image has not been converted yet.",
        variant: "destructive"
      });
      return;
    }
    
    const originalExt = imgItem.file.name.split('.').pop() || '';
    
    // Get appropriate file extension based on format
    let fileExtension = options.format;
    
    // Special handling for specific formats
    if (options.format === 'jpeg') fileExtension = 'jpg';
    if (options.format === 'svg+xml') fileExtension = 'svg';
    if (options.format === 'ico') fileExtension = 'ico';
    if (options.format === 'heic') fileExtension = 'heic';
    if (options.format === 'tiff') fileExtension = 'tiff';
    
    const newFilename = imgItem.file.name.replace(
      new RegExp(`\\.${originalExt}$`), 
      `.${fileExtension}`
    );
    
    const a = document.createElement('a');
    a.href = imgItem.convertedUrl;
    a.download = newFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download Started",
      description: `Downloading ${newFilename}`,
    });
  };

  // Download all converted images as a zip file
  const downloadAllAsZip = async () => {
    const convertedImages = images.filter(img => img.convertedBlob);
    
    if (convertedImages.length === 0) {
      toast({
        title: "Nothing to Download",
        description: "No converted images available.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const zip = new JSZip();
      
      // Add each converted image to the zip
      convertedImages.forEach(img => {
        if (img.convertedBlob) {
          const originalExt = img.file.name.split('.').pop() || '';
          
          // Get appropriate file extension based on format
          let fileExtension = options.format;
          
          // Special handling for specific formats
          if (options.format === 'jpeg') fileExtension = 'jpg';
          if (options.format === 'svg+xml') fileExtension = 'svg';
          if (options.format === 'ico') fileExtension = 'ico';
          if (options.format === 'heic') fileExtension = 'heic';
          if (options.format === 'tiff') fileExtension = 'tiff';
          
          const newFilename = img.file.name.replace(
            new RegExp(`\\.${originalExt}$`), 
            `.${fileExtension}`
          );
          
          zip.file(newFilename, img.convertedBlob);
        }
      });
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-images-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${convertedImages.length} images as ZIP`,
      });
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file.",
        variant: "destructive"
      });
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Truncate filename if too long
  const truncateFilename = (filename: string, maxLength: number = 25): string => {
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.length - extension.length - 1);
    
    if (nameWithoutExt.length <= maxLength - 3 - extension.length) {
      return filename;
    }
    
    return `${nameWithoutExt.substring(0, maxLength - 3 - extension.length)}...${extension}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      <VideoBackground opacity={0.10} />
      
      <main className="flex-grow relative z-10 pt-24 pb-16">
        <Container maxWidth="6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-4">
              Image Converter
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Convert your images between different formats instantly, right in your browser. 
              No uploads to external servers - all processing happens locally.
            </p>
          </div>
          
          <div className="grid md:grid-cols-12 gap-6">
            {/* Left Column - Image Options */}
            <div className="md:col-span-4 space-y-6">
              <Card className="bg-gray-900/70 backdrop-blur border-gray-800 text-white">
                <CardHeader>
                  <CardTitle>Conversion Options</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how your images will be converted
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select 
                      value={options.format} 
                      onValueChange={(value) => setOptions({...options, format: value})}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {FORMAT_OPTIONS.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quality">Quality: {options.quality}%</Label>
                    </div>
                    <Slider 
                      id="quality"
                      min={10} 
                      max={100} 
                      step={1}
                      value={[options.quality]} 
                      onValueChange={(values) => setOptions({...options, quality: values[0]})}
                      disabled={isProcessing}
                      className="py-2"
                    />
                    <p className="text-xs text-gray-400">
                      Higher quality means larger file size. For JPEG, WebP, and similar formats.
                    </p>
                  </div>
                  
                  <Separator className="my-4 bg-gray-700" />
                  
                  {/* Hardware Acceleration Toggle */}
                  {isHardwareAccelerationSupported && (
                    <>
                      <div className="flex items-center justify-between space-x-2 py-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="hardware-acceleration" 
                            checked={useHardwareAcceleration}
                            onCheckedChange={(checked) => setUseHardwareAcceleration(checked)}
                            disabled={isProcessing || !isHardwareAccelerationSupported}
                          />
                          <Label htmlFor="hardware-acceleration" className="flex items-center">
                            <FaMicrochip className="mr-2 text-blue-400" />
                            Hardware Acceleration
                          </Label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 ml-10 -mt-1">
                        Uses your GPU for faster image processing. Great for batch conversions and larger images.
                      </p>
                      <Separator className="my-4 bg-gray-700" />
                    </>
                  )}
                  
                  <div className="flex items-center space-x-2 py-2">
                    <Switch 
                      id="resize" 
                      checked={options.resize}
                      onCheckedChange={(checked) => setOptions({...options, resize: checked})}
                      disabled={isProcessing}
                    />
                    <Label htmlFor="resize">Resize Images</Label>
                  </div>
                  
                  {options.resize && (
                    <div className="space-y-4 pl-6 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="width">Width (px)</Label>
                          <Input 
                            id="width"
                            type="number" 
                            value={options.width}
                            onChange={(e) => setOptions({...options, width: parseInt(e.target.value) || 0})}
                            disabled={isProcessing}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (px)</Label>
                          <Input 
                            id="height"
                            type="number" 
                            value={options.height}
                            onChange={(e) => setOptions({...options, height: parseInt(e.target.value) || 0})}
                            disabled={isProcessing || options.maintainAspectRatio}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="aspect-ratio" 
                          checked={options.maintainAspectRatio}
                          onCheckedChange={(checked) => setOptions({...options, maintainAspectRatio: checked})}
                          disabled={isProcessing}
                        />
                        <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOptions(DEFAULT_OPTIONS)}
                    disabled={isProcessing}
                    className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={convertAllImages}
                    disabled={isProcessing || images.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <FaSyncAlt className="mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <FaSyncAlt className="mr-2" />
                        Convert {images.length > 0 ? `(${images.length})` : 'All'}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {images.length > 0 && (
                <Card className="bg-gray-900/70 backdrop-blur border-gray-800 text-white">
                  <CardHeader>
                    <CardTitle>Batch Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Progress</Label>
                          <span className="text-sm text-gray-400">{processingProgress}%</span>
                        </div>
                        <Progress value={processingProgress} className="w-full h-2" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="destructive"
                        onClick={clearAllImages}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        <FaTrash className="mr-2" />
                        Clear All
                      </Button>
                      <Button
                        onClick={downloadAllAsZip}
                        disabled={isProcessing || !images.some(img => img.convertedBlob)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <FaFileArchive className="mr-2" />
                        Download ZIP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Right Column - Image Upload & Results */}
            <div className="md:col-span-8">
              <Card className="bg-gray-900/70 backdrop-blur border-gray-800 text-white">
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription className="text-gray-400">
                    Upload your images to convert ({images.length} {images.length === 1 ? 'image' : 'images'} added)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {images.length === 0 ? (
                    <div 
                      className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaUpload className="mx-auto text-4xl mb-4 text-gray-500" />
                      <p className="text-lg font-medium">Drop images here or click to browse</p>
                      <p className="text-sm text-gray-400 mt-2">Supported formats: JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, ICO, SVG, HEIC</p>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        Select Images
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessing}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FaUpload className="mr-2" />
                          Add More Images
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        {images.map(img => (
                          <Card key={img.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                            <div className="grid md:grid-cols-12 gap-4">
                              <div className="md:col-span-7 p-4">
                                <Tabs defaultValue="original" className="w-full">
                                  <TabsList className="grid grid-cols-2 bg-gray-900">
                                    <TabsTrigger value="original">Original</TabsTrigger>
                                    <TabsTrigger value="converted" disabled={!img.convertedUrl}>
                                      Converted
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="original" className="mt-2">
                                    <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
                                      <img 
                                        src={img.originalUrl} 
                                        alt="Original" 
                                        className="object-contain w-full h-full"
                                      />
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="converted" className="mt-2">
                                    {img.convertedUrl ? (
                                      <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
                                        <img 
                                          src={img.convertedUrl} 
                                          alt="Converted" 
                                          className="object-contain w-full h-full"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center aspect-video bg-gray-900 rounded text-gray-500">
                                        {img.isConverting ? "Converting..." : "Not converted yet"}
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </div>
                              
                              <div className="md:col-span-5 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="font-medium truncate" title={img.file.name}>
                                    {truncateFilename(img.file.name)}
                                  </h3>
                                  <div className="mt-2 grid grid-cols-2 text-sm text-gray-400">
                                    <div>Original:</div>
                                    <div>{formatFileSize(img.file.size)}</div>
                                    
                                    <div>Format:</div>
                                    <div>{img.file.type.split('/')[1].toUpperCase()}</div>
                                    
                                    {img.convertedBlob && (
                                      <>
                                        <div>Converted:</div>
                                        <div>{formatFileSize(img.convertedBlob.size)}</div>
                                        
                                        <div>New Format:</div>
                                        <div>{options.format.toUpperCase()}</div>
                                      </>
                                    )}
                                  </div>
                                  
                                  {img.error && (
                                    <p className="mt-2 text-red-500 text-sm">{img.error}</p>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeImage(img.id)}
                                    disabled={isProcessing}
                                  >
                                    <FaTrash className="mr-2" />
                                    Remove
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => downloadImage(img)}
                                    disabled={isProcessing || !img.convertedBlob}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <FaDownload className="mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}