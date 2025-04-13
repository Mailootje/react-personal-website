import { useState, useRef, useCallback } from 'react';
import { FaUpload, FaDownload, FaFileArchive, FaTrash, FaSyncAlt } from 'react-icons/fa';
import JSZip from 'jszip';
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
  { value: 'bmp', label: 'BMP' }
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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<ImageOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

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

  // Convert image to the selected format
  const convertImage = async (imgItem: ImageItem, options: ImageOptions): Promise<Blob | null> => {
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
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to selected format
          const quality = options.quality / 100;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(null);
              }
            },
            `image/${options.format}`,
            quality
          );
        };
        
        img.onerror = () => {
          resolve(null);
        };
        
        img.src = imgItem.originalUrl;
      } catch (error) {
        console.error("Error converting image:", error);
        resolve(null);
      }
    });
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
    const newFilename = imgItem.file.name.replace(
      new RegExp(`\\.${originalExt}$`), 
      `.${options.format}`
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
          const newFilename = img.file.name.replace(
            new RegExp(`\\.${originalExt}$`), 
            `.${options.format}`
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
                      <p className="text-sm text-gray-400 mt-2">Supported formats: JPG, PNG, WebP, GIF, BMP</p>
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