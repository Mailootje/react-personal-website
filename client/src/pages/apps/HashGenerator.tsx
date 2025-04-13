import { useState, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw, 
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CryptoES from "crypto-es";

const hashAlgorithms = [
  { value: "md5", label: "MD5", description: "Fast but not secure for passwords" },
  { value: "sha1", label: "SHA-1", description: "Legacy algorithm, avoid for security" },
  { value: "sha256", label: "SHA-256", description: "Secure, general purpose" },
  { value: "sha512", label: "SHA-512", description: "More secure, longer output" },
  { value: "sha3", label: "SHA-3", description: "Modern, highly secure" },
  { value: "ripemd160", label: "RIPEMD-160", description: "Used in blockchain" },
];

export default function HashGenerator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("text");
  const [algorithm, setAlgorithm] = useState<string>("sha256");
  const [inputText, setInputText] = useState<string>("");
  const [hashResult, setHashResult] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Handle text input change
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setHashResult("");
  };
  
  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setHashResult("");
    }
  };
  
  // Generate hash from text input
  const generateHashFromText = () => {
    if (!inputText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter some text to hash",
        variant: "destructive",
      });
      return;
    }
    
    setIsHashing(true);
    
    try {
      let hash: string;
      
      switch (algorithm) {
        case "md5":
          hash = CryptoES.MD5(inputText).toString();
          break;
        case "sha1":
          hash = CryptoES.SHA1(inputText).toString();
          break;
        case "sha256":
          hash = CryptoES.SHA256(inputText).toString();
          break;
        case "sha512":
          hash = CryptoES.SHA512(inputText).toString();
          break;
        case "sha3":
          hash = CryptoES.SHA3(inputText).toString();
          break;
        case "ripemd160":
          hash = CryptoES.RIPEMD160(inputText).toString();
          break;
        default:
          hash = CryptoES.SHA256(inputText).toString();
      }
      
      setHashResult(hash);
    } catch (error) {
      console.error("Error generating hash:", error);
      toast({
        title: "Error",
        description: "Failed to generate hash",
        variant: "destructive",
      });
    } finally {
      setIsHashing(false);
    }
  };
  
  // Generate hash from file
  const generateHashFromFile = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to hash",
        variant: "destructive",
      });
      return;
    }
    
    setIsHashing(true);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || !event.target.result) {
          throw new Error("Failed to read file");
        }
        
        const fileContent = event.target.result;
        let hash: string;
        
        switch (algorithm) {
          case "md5":
            hash = CryptoES.MD5(fileContent as string).toString();
            break;
          case "sha1":
            hash = CryptoES.SHA1(fileContent as string).toString();
            break;
          case "sha256":
            hash = CryptoES.SHA256(fileContent as string).toString();
            break;
          case "sha512":
            hash = CryptoES.SHA512(fileContent as string).toString();
            break;
          case "sha3":
            hash = CryptoES.SHA3(fileContent as string).toString();
            break;
          case "ripemd160":
            hash = CryptoES.RIPEMD160(fileContent as string).toString();
            break;
          default:
            hash = CryptoES.SHA256(fileContent as string).toString();
        }
        
        setHashResult(hash);
      } catch (error) {
        console.error("Error generating hash from file:", error);
        toast({
          title: "Error",
          description: "Failed to generate hash from file",
          variant: "destructive",
        });
      } finally {
        setIsHashing(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
      setIsHashing(false);
    };
    
    reader.readAsArrayBuffer(selectedFile);
  };
  
  // Copy hash result to clipboard
  const copyToClipboard = () => {
    if (!hashResult) return;
    
    navigator.clipboard.writeText(hashResult).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Hash copied to clipboard",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Hash Generator</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Generate cryptographic hashes from text or files using various algorithms
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Hash Generator</CardTitle>
                  <CardDescription>
                    Choose an algorithm and input to generate a hash
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Algorithm Selection */}
                  <div className="space-y-4">
                    <Label htmlFor="algorithm">Hash Algorithm</Label>
                    <RadioGroup 
                      value={algorithm} 
                      onValueChange={setAlgorithm}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {hashAlgorithms.map((algo) => (
                        <div key={algo.value} className="flex items-start space-x-2">
                          <RadioGroupItem value={algo.value} id={algo.value} />
                          <div className="flex flex-col">
                            <Label htmlFor={algo.value} className="font-medium">
                              {algo.label}
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {algo.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  {/* Input Type Tabs */}
                  <Tabs 
                    defaultValue="text"
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="grid grid-cols-2 w-full max-w-xs">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="file">File</TabsTrigger>
                    </TabsList>
                    
                    {/* Text Input Tab */}
                    <TabsContent value="text" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="input-text">Text to Hash</Label>
                        <Textarea
                          id="input-text"
                          placeholder="Enter text to generate hash..."
                          value={inputText}
                          onChange={handleTextChange}
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                      
                      <Button 
                        onClick={generateHashFromText}
                        disabled={isHashing || !inputText.trim()}
                        className="w-full"
                      >
                        {isHashing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Hash"
                        )}
                      </Button>
                    </TabsContent>
                    
                    {/* File Input Tab */}
                    <TabsContent value="file" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="input-file">File to Hash</Label>
                        <div className="border border-dashed rounded-md p-8 text-center">
                          <Input
                            id="input-file"
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <Label 
                              htmlFor="input-file" 
                              className="text-primary cursor-pointer hover:underline"
                            >
                              Click to select a file
                            </Label>
                            {selectedFile && (
                              <p className="text-sm text-muted-foreground">
                                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={generateHashFromFile}
                        disabled={isHashing || !selectedFile}
                        className="w-full"
                      >
                        {isHashing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing File...
                          </>
                        ) : (
                          "Generate Hash"
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Hash Result */}
                  {hashResult && (
                    <div className="border rounded-md p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">
                          {algorithm.toUpperCase()} Hash Result:
                        </Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={copyToClipboard}
                          className="h-8 w-8"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded-sm overflow-x-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {hashResult}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Hash Information */}
                  <div className="rounded-md bg-muted/50 p-4 text-sm">
                    <h4 className="font-medium mb-2">About Hash Functions</h4>
                    <p className="text-muted-foreground mb-2">
                      Cryptographic hash functions convert data into a fixed-size string of characters, 
                      which is typically a hexadecimal number. Some key properties:
                    </p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>The same input will always produce the same output</li>
                      <li>It's impossible to reverse-engineer the original input from the hash</li>
                      <li>Even a small change to the input creates a completely different hash</li>
                      <li>Different inputs should not produce the same hash (collision resistance)</li>
                    </ul>
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