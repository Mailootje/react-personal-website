import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Copy, Check, Download, Upload, Trash, Code, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Monaco } from "@monaco-editor/react";

export default function JsonFormatter() {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [minifiedJson, setMinifiedJson] = useState("");
  const [activeTab, setActiveTab] = useState("format");
  const [indentSize, setIndentSize] = useState<number>(2);
  const [searchText, setSearchText] = useState("");
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string }>({ valid: true });
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sortKeys, setSortKeys] = useState(false);
  const [showTreeView, setShowTreeView] = useState(false);

  // Format the JSON string
  const formatJson = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "No JSON to format",
        description: "Please enter some JSON first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse the JSON to validate it
      let parsed = JSON.parse(jsonInput);
      
      // Sort keys if option is enabled
      if (sortKeys) {
        parsed = sortObjectKeys(parsed);
      }
      
      // Format the JSON with the specified indent size
      const formatted = JSON.stringify(parsed, null, indentSize);
      setFormattedJson(formatted);
      setMinifiedJson(JSON.stringify(parsed));
      setValidationResult({ valid: true });
      
      toast({
        title: "JSON Formatted",
        description: "Your JSON has been successfully formatted",
      });
    } catch (error: any) {
      setValidationResult({ 
        valid: false, 
        message: `Error: ${error.message}` 
      });
      
      toast({
        title: "Invalid JSON",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Recursively sort object keys
  const sortObjectKeys = (obj: any): any => {
    // If it's not an object or it's null, return it as is
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      // For arrays, sort the contents if they are objects
      if (Array.isArray(obj)) {
        return obj.map(item => {
          if (item !== null && typeof item === 'object') {
            return sortObjectKeys(item);
          }
          return item;
        });
      }
      return obj;
    }
    
    // Create a new object with sorted keys
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
      }, {});
  };

  // Copy the JSON to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "JSON copied to clipboard",
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Clear the JSON input
  const clearJson = () => {
    setJsonInput("");
    setFormattedJson("");
    setMinifiedJson("");
    setValidationResult({ valid: true });
  };

  // Upload a JSON file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (event.target) {
      event.target.value = "";
    }
  };

  // Trigger file upload
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Download formatted JSON
  const downloadJson = (type: "formatted" | "minified") => {
    const content = type === "formatted" ? formattedJson : minifiedJson;
    if (!content) return;
    
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `json-${type}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Validate JSON
  const validateJson = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "No JSON to validate",
        description: "Please enter some JSON first",
        variant: "destructive",
      });
      return;
    }

    try {
      JSON.parse(jsonInput);
      setValidationResult({ 
        valid: true,
        message: "JSON is valid! ✓"
      });
      
      toast({
        title: "Valid JSON",
        description: "Your JSON is correctly formatted",
      });
    } catch (error: any) {
      setValidationResult({ 
        valid: false, 
        message: `Error: ${error.message}` 
      });
      
      toast({
        title: "Invalid JSON",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Generate sample JSON
  const generateSample = () => {
    const sample = {
      "name": "John Doe",
      "age": 30,
      "email": "john.doe@example.com",
      "isActive": true,
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip": "12345"
      },
      "phone_numbers": [
        {
          "type": "home",
          "number": "555-1234"
        },
        {
          "type": "work",
          "number": "555-5678"
        }
      ],
      "tags": ["developer", "javascript", "react"],
      "preferences": null
    };
    
    setJsonInput(JSON.stringify(sample));
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">JSON Formatter</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Format, validate, and minify JSON data for easier reading and debugging
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>JSON Input</CardTitle>
                  <CardDescription>
                    Paste your JSON data below or upload a JSON file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-md relative">
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Paste your JSON here..."
                      className="font-mono min-h-[200px] resize-y p-4"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={formatJson}
                      className="flex items-center"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Format JSON
                    </Button>
                    <Button
                      variant="outline"
                      onClick={validateJson}
                      className="flex items-center"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Validate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={triggerFileUpload}
                      className="flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json,application/json"
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="outline"
                      onClick={clearJson}
                      className="flex items-center"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      variant="link"
                      onClick={generateSample}
                      className="ml-auto"
                    >
                      Generate Sample
                    </Button>
                  </div>

                  {/* Options */}
                  <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                    <h3 className="font-medium mb-2">Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Indent Size: {indentSize}</span>
                          <div className="w-[180px]">
                            <Slider
                              value={[indentSize]}
                              min={1}
                              max={8}
                              step={1}
                              onValueChange={(values) => setIndentSize(values[0])}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="sort-keys"
                            checked={sortKeys}
                            onCheckedChange={setSortKeys}
                          />
                          <Label htmlFor="sort-keys">Sort Object Keys</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Result */}
                  {validationResult.message && (
                    <div className={`p-4 border rounded-md ${validationResult.valid ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                      <p className="font-mono text-sm">{validationResult.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(formattedJson || minifiedJson) && (
                <Card>
                  <CardHeader>
                    <CardTitle>JSON Output</CardTitle>
                    <CardDescription>
                      View your formatted or minified JSON
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs 
                      defaultValue="format" 
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="format">
                          Formatted JSON
                        </TabsTrigger>
                        <TabsTrigger value="minify">
                          Minified JSON
                        </TabsTrigger>
                      </TabsList>

                      {/* Formatted JSON */}
                      <TabsContent value="format" className="space-y-4">
                        {formattedJson && (
                          <>
                            <div className="border rounded-md relative">
                              <Textarea
                                value={formattedJson}
                                readOnly
                                className="font-mono min-h-[200px] resize-y p-4"
                              />
                              <div className="absolute top-2 right-2 flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(formattedJson)}
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
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                onClick={() => downloadJson("formatted")}
                                className="flex items-center"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Formatted JSON
                              </Button>
                            </div>
                          </>
                        )}
                      </TabsContent>

                      {/* Minified JSON */}
                      <TabsContent value="minify" className="space-y-4">
                        {minifiedJson && (
                          <>
                            <div className="border rounded-md relative">
                              <Textarea
                                value={minifiedJson}
                                readOnly
                                className="font-mono min-h-[200px] resize-y p-4"
                              />
                              <div className="absolute top-2 right-2 flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(minifiedJson)}
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
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                onClick={() => downloadJson("minified")}
                                className="flex items-center"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Minified JSON
                              </Button>
                            </div>
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div
              className="max-w-3xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">About JSON</h2>
              <p className="mb-4 text-muted-foreground">
                JSON (JavaScript Object Notation) is a lightweight data-interchange format. It is easy for humans to read and write, and easy for machines to parse and generate.
              </p>
              <p className="mb-4 text-muted-foreground">
                JSON is a text format that is completely language independent but uses conventions that are familiar to programmers of the C family of languages, including C, C++, C#, Java, JavaScript, Perl, Python, and many others.
              </p>
              <h3 className="text-lg font-bold mt-6 mb-2">Common Use Cases:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  API responses and requests
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Configuration files
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Data storage
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Web application state management
                </li>
              </ul>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}