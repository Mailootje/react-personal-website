import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw, 
  Download,
  Upload,
  FileCode,
  Code,
  Binary,
  Undo,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define available themes
const themes = [
  { id: "default", name: "Default", classes: "bg-background text-foreground" },
  { id: "monokai", name: "Monokai", classes: "bg-[#272822] text-[#F8F8F2]" },
  { id: "github", name: "GitHub", classes: "bg-[#ffffff] text-[#24292e]" },
  { id: "vscode", name: "VS Code", classes: "bg-[#1E1E1E] text-[#D4D4D4]" }
];

export default function JsonFormatter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("format");
  const [inputJson, setInputJson] = useState<string>("");
  const [outputJson, setOutputJson] = useState<string>("");
  const [originalJson, setOriginalJson] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [indentSize, setIndentSize] = useState<number>(2);
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  
  // Initial example JSON to guide users
  const exampleJson = JSON.stringify({
    name: "JSON Formatter",
    description: "A tool to format, validate and transform JSON data",
    features: ["Format", "Validate", "Minify", "Sort keys"],
    active: true,
    stats: {
      users: 1250,
      formatting: {
        time: "35ms",
        accuracy: 0.997
      }
    }
  }, null, 2);
  
  // Initialize with example JSON
  useEffect(() => {
    setInputJson(exampleJson);
  }, []);
  
  // Process input whenever it changes
  useEffect(() => {
    handleProcess();
  }, [activeTab, inputJson, indentSize, sortKeys]);
  
  // Format JSON
  const formatJson = (json: string, spaces: number, sort: boolean): string => {
    try {
      // Parse the JSON string to an object
      const parsedJson = JSON.parse(json);
      
      // Convert back to a formatted string
      return JSON.stringify(parsedJson, sort ? sortObjectKeys : undefined, spaces);
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
  };
  
  // Minify JSON
  const minifyJson = (json: string): string => {
    try {
      // Parse the JSON string to an object
      const parsedJson = JSON.parse(json);
      
      // Convert back to a minified string
      return JSON.stringify(parsedJson);
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
  };
  
  // Sort object keys function for JSON.stringify
  const sortObjectKeys = (key: string, value: any): any => {
    // Skip sorting arrays or non-objects
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }
    
    // Sort keys and create a new sorted object
    return Object.keys(value)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = value[key];
        return result;
      }, {});
  };
  
  // Validate JSON
  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  };
  
  // Convert JSON to XML
  const jsonToXml = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      const xml = objectToXml(obj, 'root');
      return '<?xml version="1.0" encoding="UTF-8" ?>\n' + xml;
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
  };
  
  // Helper to convert object to XML
  const objectToXml = (obj: any, tagName: string, indent: string = ''): string => {
    if (obj === null || obj === undefined) {
      return `${indent}<${tagName} />\n`;
    }
    
    if (typeof obj !== 'object') {
      return `${indent}<${tagName}>${escapeXml(String(obj))}</${tagName}>\n`;
    }
    
    if (Array.isArray(obj)) {
      return `${indent}<${tagName}>\n${obj.map((item, index) => {
        return objectToXml(item, 'item', indent + '  ');
      }).join('')}${indent}</${tagName}>\n`;
    }
    
    // Regular object
    let xml = `${indent}<${tagName}>\n`;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        xml += objectToXml(obj[key], key, indent + '  ');
      }
    }
    xml += `${indent}</${tagName}>\n`;
    return xml;
  };
  
  // Escape XML special characters
  const escapeXml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  // Convert JSON to YAML
  const jsonToYaml = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      return objectToYaml(obj);
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
  };
  
  // Helper to convert object to YAML
  const objectToYaml = (obj: any, indent: string = ''): string => {
    if (obj === null) return indent + 'null\n';
    if (obj === undefined) return indent + 'undefined\n';
    
    if (typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // Check if the string needs quotes (has special characters or starts with a symbol)
        if (/^[0-9]/.test(obj) || /[\s:]/.test(obj) || obj === '') {
          return indent + `"${obj}"\n`;
        }
        return indent + obj + '\n';
      }
      return indent + String(obj) + '\n';
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return indent + '[]\n';
      return obj.map(item => {
        return indent + '- ' + objectToYaml(item, indent + '  ').trimEnd();
      }).join('\n') + '\n';
    }
    
    // Regular object
    const keys = Object.keys(obj);
    if (keys.length === 0) return indent + '{}\n';
    
    return keys.map(key => {
      const keyStr = /[\s:]/.test(key) ? `"${key}"` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null) {
        return indent + keyStr + ':\n' + objectToYaml(value, indent + '  ');
      }
      
      return indent + keyStr + ': ' + objectToYaml(value, '').trimEnd();
    }).join('\n') + '\n';
  };
  
  // Convert JSON to CSS
  const jsonToCss = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      return objectToCss(obj);
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
  };
  
  // Helper to convert object to CSS
  const objectToCss = (obj: any, prefix: string = ''): string => {
    if (typeof obj !== 'object' || obj === null) {
      return '';
    }
    
    let css = '';
    
    for (const selector in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, selector)) {
        const value = obj[selector];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Nested selector
          const newPrefix = prefix ? `${prefix} ${selector}` : selector;
          css += objectToCss(value, newPrefix);
        } else {
          // Regular selector with properties
          if (prefix) {
            css += `${prefix} {\n`;
            css += `  ${selector}: ${value};\n`;
            css += '}\n\n';
          } else {
            css += `${selector} {\n`;
            
            // If value is an object, process its properties
            if (typeof value === 'object' && value !== null) {
              for (const prop in value) {
                if (Object.prototype.hasOwnProperty.call(value, prop)) {
                  css += `  ${prop}: ${value[prop]};\n`;
                }
              }
            }
            
            css += '}\n\n';
          }
        }
      }
    }
    
    return css;
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputJson(content);
      setOriginalJson(content);
    };
    reader.readAsText(file);
  };
  
  // Download the formatted JSON
  const downloadJson = () => {
    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted_json.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Process the input based on the active tab
  const handleProcess = () => {
    if (!inputJson.trim()) {
      setOutputJson("");
      setError("");
      return;
    }
    
    setProcessing(true);
    setError("");
    
    try {
      switch (activeTab) {
        case "format":
          setOutputJson(formatJson(inputJson, indentSize, sortKeys));
          break;
        case "minify":
          setOutputJson(minifyJson(inputJson));
          break;
        case "validate":
          if (validateJson(inputJson)) {
            setOutputJson("JSON is valid");
          } else {
            throw new Error("Invalid JSON");
          }
          break;
        case "toXML":
          setOutputJson(jsonToXml(inputJson));
          break;
        case "toYAML":
          setOutputJson(jsonToYaml(inputJson));
          break;
        case "toCSS":
          setOutputJson(jsonToCss(inputJson));
          break;
        default:
          setOutputJson(formatJson(inputJson, indentSize, sortKeys));
      }
    } catch (error) {
      console.error("Processing error:", error);
      setError((error as Error).message);
      setOutputJson("");
    } finally {
      setProcessing(false);
    }
  };
  
  // Reset to original input
  const resetToOriginal = () => {
    if (originalJson) {
      setInputJson(originalJson);
      toast({
        title: "Reset Complete",
        description: "Input has been reset to the original JSON"
      });
    }
  };
  
  // Copy output to clipboard
  const copyToClipboard = () => {
    if (!outputJson) return;
    
    navigator.clipboard.writeText(outputJson).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Output copied to clipboard"
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="xl">
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">JSON Formatter</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Format, validate and transform JSON data
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>JSON Formatter & Converter</CardTitle>
                  <CardDescription>
                    Beautify, validate or transform JSON data into various formats
                  </CardDescription>
                  
                  {/* Tool Tabs */}
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="mt-4"
                  >
                    <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
                      <TabsTrigger value="format" className="flex items-center">
                        <Code className="h-4 w-4 mr-2" />
                        Format
                      </TabsTrigger>
                      <TabsTrigger value="minify" className="flex items-center">
                        <Binary className="h-4 w-4 mr-2" />
                        Minify
                      </TabsTrigger>
                      <TabsTrigger value="validate" className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Validate
                      </TabsTrigger>
                      <TabsTrigger value="toXML" className="flex items-center">
                        <FileCode className="h-4 w-4 mr-2" />
                        to XML
                      </TabsTrigger>
                      <TabsTrigger value="toYAML" className="flex items-center">
                        <FileCode className="h-4 w-4 mr-2" />
                        to YAML
                      </TabsTrigger>
                      <TabsTrigger value="toCSS" className="flex items-center">
                        <FileCode className="h-4 w-4 mr-2" />
                        to CSS
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Control Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Format Options */}
                    {activeTab === "format" && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="indentation">Indentation Size</Label>
                            <span className="text-sm text-muted-foreground">{indentSize} spaces</span>
                          </div>
                          <Slider
                            id="indentation"
                            min={0}
                            max={8}
                            step={1}
                            value={[indentSize]}
                            onValueChange={(value) => setIndentSize(value[0])}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="sort-keys"
                            checked={sortKeys}
                            onCheckedChange={setSortKeys}
                          />
                          <Label htmlFor="sort-keys">Sort Object Keys</Label>
                        </div>
                      </>
                    )}
                    
                    {/* Theme Selector */}
                    <div className="space-y-2 md:col-start-3 md:col-span-2 md:justify-self-end">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={selectedTheme}
                        onValueChange={setSelectedTheme}
                      >
                        <SelectTrigger id="theme" className="w-[180px]">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {themes.map(theme => (
                            <SelectItem key={theme.id} value={theme.id}>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* JSON Input & Output */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Panel */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="input-json">Input JSON</Label>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={resetToOriginal}
                            disabled={!originalJson}
                          >
                            <Undo className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                          <div className="relative">
                            <input
                              type="file"
                              id="file-upload"
                              accept=".json,.txt"
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 w-full cursor-pointer"
                            />
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Textarea
                        id="input-json"
                        value={inputJson}
                        onChange={(e) => setInputJson(e.target.value)}
                        className="font-mono h-[500px] resize-none"
                        placeholder="Paste your JSON here..."
                      />
                    </div>
                    
                    {/* Output Panel */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="output-json">
                          {activeTab === "format" ? "Formatted JSON" : 
                           activeTab === "minify" ? "Minified JSON" : 
                           activeTab === "validate" ? "Validation Result" : 
                           activeTab === "toXML" ? "XML Output" : 
                           activeTab === "toYAML" ? "YAML Output" : 
                           activeTab === "toCSS" ? "CSS Output" : 
                           "Output"}
                        </Label>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={copyToClipboard}
                            disabled={!outputJson}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 mr-2" />
                            )}
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={downloadJson}
                            disabled={!outputJson}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      
                      {error ? (
                        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md h-[500px] overflow-auto">
                          <p className="font-medium">Error:</p>
                          <p>{error}</p>
                        </div>
                      ) : (
                        <pre 
                          id="output-json"
                          className={`font-mono p-4 rounded-md border border-border h-[500px] overflow-auto 
                            ${themes.find(t => t.id === selectedTheme)?.classes || themes[0].classes}`}
                        >
                          {processing ? (
                            <div className="flex items-center justify-center h-full">
                              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : outputJson ? (
                            outputJson
                          ) : (
                            <span className="text-muted-foreground">Output will appear here...</span>
                          )}
                        </pre>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}