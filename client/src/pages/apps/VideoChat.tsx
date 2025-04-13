import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import SimplePeer from "simple-peer";
import { io, Socket } from "socket.io-client";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VideoBackground } from "@/components/VideoBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize,
  UserPlus,
  Copy,
  Send,
  Settings,
  X,
  Users
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  peer?: any; // SimplePeer.Instance
}

interface Message {
  sender: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export default function VideoChat() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("join");
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{
    [key: string]: any // SimplePeer.Instance
  }>({});
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to socket server
  useEffect(() => {
    try {
      console.log('Connecting to Socket.IO server on the same port as the app');
      
      // Connect to Socket.IO server (same origin, same port)
      socketRef.current = io({
        path: '/socket.io',
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'], // Try both transport methods
        timeout: 20000
      });
      
      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO server with ID:', socketRef.current?.id);
      });
      
      socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
      });
      
      return () => {
        console.log('Cleaning up Socket.IO connection');
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Error setting up Socket.IO:', error);
    }
  }, []);
  
  // Setup media stream
  const setupMediaStream = async (video: boolean = true, audio: boolean = true) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: audio
      });
      
      // Update state and set local video
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera or microphone. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Create a new room
  const createRoom = async () => {
    if (!userName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to create a room",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get media stream
      const stream = await setupMediaStream();
      if (!stream) {
        setLoading(false);
        return;
      }
      
      // Create room via socket
      if (socketRef.current) {
        socketRef.current.emit("create-room", { name: userName }, (response: any) => {
          setLoading(false);
          
          if (response.success) {
            // Set room details
            setRoomId(response.roomId);
            setRoomCode(response.roomCode);
            setInRoom(true);
            
            // Add welcome message
            setMessages([
              {
                sender: "System",
                message: `Welcome to your new room, ${userName}!`,
                timestamp: new Date().toISOString(),
                isSystem: true
              }
            ]);
            
            // Add self to participants
            setParticipants([
              {
                id: "self",
                name: userName
              }
            ]);
            
            // Setup event listeners
            setupRoomEventListeners();
          } else {
            toast({
              title: "Error Creating Room",
              description: response.error || "Failed to create room",
              variant: "destructive"
            });
          }
        });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Join an existing room
  const joinRoom = async () => {
    if (!userName.trim() || !roomId.trim() || !roomCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name, room ID, and room code",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get media stream
      const stream = await setupMediaStream();
      if (!stream) {
        setLoading(false);
        return;
      }
      
      // Join room via socket
      if (socketRef.current) {
        socketRef.current.emit("join-room", {
          roomId,
          roomCode,
          name: userName
        }, (response: any) => {
          setLoading(false);
          
          if (response.success) {
            setInRoom(true);
            
            // Add welcome message
            setMessages([
              {
                sender: "System",
                message: `You joined the room successfully!`,
                timestamp: new Date().toISOString(),
                isSystem: true
              }
            ]);
            
            // Setup participants
            const existingParticipants = response.participants || [];
            
            // Add self to participants
            setParticipants([
              {
                id: "self",
                name: userName
              },
              ...existingParticipants.filter((p: any) => p.id !== socketRef.current?.id)
            ]);
            
            // Setup event listeners
            setupRoomEventListeners();
            
            // Create peer connections to existing participants
            existingParticipants.forEach((participant: any) => {
              if (participant.id !== socketRef.current?.id) {
                const peer = createPeer(participant.id, socketRef.current?.id || "", stream);
                peersRef.current[participant.id] = peer;
              }
            });
          } else {
            toast({
              title: "Error Joining Room",
              description: response.error || "Failed to join room",
              variant: "destructive"
            });
          }
        });
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to join room. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Create a WebRTC peer connection
  const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
    // Use type assertion to avoid TypeScript error with SimplePeer constructor
    const peer = new (SimplePeer as any)({
      initiator: true,
      trickle: false,
      stream
    });
    
    peer.on("signal", (signal: any) => {
      socketRef.current?.emit("signal", {
        roomId,
        to: userToSignal,
        signal
      });
    });
    
    peer.on("stream", (peerStream: MediaStream) => {
      // Update participant with stream
      setParticipants(prev => prev.map(p => {
        if (p.id === userToSignal) {
          return { ...p, stream: peerStream };
        }
        return p;
      }));
    });
    
    return peer;
  };
  
  // Add a peer who is calling
  const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
    // Use type assertion to avoid TypeScript error with SimplePeer constructor
    const peer = new (SimplePeer as any)({
      initiator: false,
      trickle: false,
      stream
    });
    
    peer.on("signal", (signal: any) => {
      socketRef.current?.emit("signal", {
        roomId,
        to: callerId,
        signal
      });
    });
    
    peer.on("stream", (peerStream: MediaStream) => {
      // Update participant with stream
      setParticipants(prev => prev.map(p => {
        if (p.id === callerId) {
          return { ...p, stream: peerStream };
        }
        return p;
      }));
    });
    
    peer.signal(incomingSignal);
    
    return peer;
  };
  
  // Setup room event listeners
  const setupRoomEventListeners = () => {
    if (!socketRef.current) return;
    
    // When a new user joins
    socketRef.current.on("user-joined", (data: { id: string, name: string }) => {
      // Add to participants
      setParticipants(prev => [...prev, { id: data.id, name: data.name }]);
      
      // Add system message
      setMessages(prev => [...prev, {
        sender: "System",
        message: `${data.name} joined the room`,
        timestamp: new Date().toISOString(),
        isSystem: true
      }]);
      
      // Create peer for new participant
      if (localStream) {
        const peer = addPeer({} as any, data.id, localStream);
        peersRef.current[data.id] = peer;
      }
    });
    
    // When a user leaves
    socketRef.current.on("user-left", (data: { id: string }) => {
      // Find the participant
      const participant = participants.find(p => p.id === data.id);
      
      // Add system message
      if (participant) {
        setMessages(prev => [...prev, {
          sender: "System",
          message: `${participant.name} left the room`,
          timestamp: new Date().toISOString(),
          isSystem: true
        }]);
      }
      
      // Remove participant
      setParticipants(prev => prev.filter(p => p.id !== data.id));
      
      // Clean up peer connection
      if (peersRef.current[data.id]) {
        peersRef.current[data.id].destroy();
        delete peersRef.current[data.id];
      }
    });
    
    // When receiving a signal
    socketRef.current.on("signal", (data: { from: string, signal: any }) => {
      const { from, signal } = data;
      
      // Check if we already have a peer for this user
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      } else if (localStream) {
        // If not, create a new peer
        const peer = addPeer(signal, from, localStream);
        peersRef.current[from] = peer;
      }
    });
    
    // When receiving a chat message
    socketRef.current.on("chat-message", (data: Message) => {
      setMessages(prev => [...prev, data]);
      
      // Scroll to bottom
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };
  
  // Leave the room
  const leaveRoom = () => {
    // Notify server
    socketRef.current?.emit("leave-room", { roomId });
    
    // Clean up peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.destroy();
    });
    peersRef.current = {};
    
    // Clean up media stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    // Reset state
    setLocalStream(null);
    setParticipants([]);
    setMessages([]);
    setInRoom(false);
    setRoomId("");
    setRoomCode("");
  };
  
  // Send a chat message
  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;
    
    socketRef.current.emit("chat-message", {
      roomId,
      message: messageInput
    });
    
    setMessageInput("");
  };
  
  // Copy room details to clipboard
  const copyRoomDetails = () => {
    const roomDetails = `Join my video chat room!\nRoom ID: ${roomId}\nRoom Code: ${roomCode}`;
    navigator.clipboard.writeText(roomDetails);
    setCopied(true);
    
    toast({
      title: "Copied!",
      description: "Room details copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 3000);
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <VideoBackground opacity={0.15} />
      
      <main className="flex-grow relative z-10 py-16">
        <Container maxWidth="6xl">
          {!inRoom ? (
            // Join/Create UI
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div 
                  onClick={() => navigate("/apps")}
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Apps
                </div>
              </div>
              
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                  Video Chat
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Create or join a private video chat room with friends, colleagues, or family.
                  Secure rooms with access codes.
                </p>
              </div>
              
              <div className="max-w-md mx-auto">
                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Join or Create a Room</CardTitle>
                    <CardDescription className="text-gray-400">
                      Enter your details to get started
                    </CardDescription>
                    
                    <Tabs defaultValue="join" value={tab} onValueChange={setTab} className="mt-4">
                      <TabsList className="grid grid-cols-2 bg-gray-800">
                        <TabsTrigger value="join" className="data-[state=active]:bg-blue-600">
                          Join Room
                        </TabsTrigger>
                        <TabsTrigger value="create" className="data-[state=active]:bg-blue-600">
                          Create Room
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Your Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    
                    <TabsContent value="join" className="space-y-4 mt-4 p-0">
                      <div className="space-y-2">
                        <Label htmlFor="roomId" className="text-gray-300">Room ID</Label>
                        <Input
                          id="roomId"
                          placeholder="Enter Room ID"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="roomCode" className="text-gray-300">Room Code</Label>
                        <Input
                          id="roomCode"
                          placeholder="Enter access code"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      
                      <Button 
                        onClick={joinRoom}
                        disabled={loading || !userName || !roomId || !roomCode}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? "Joining..." : "Join Room"}
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="create" className="space-y-4 mt-4 p-0">
                      <div className="p-4 bg-gray-800/50 rounded-md text-sm text-gray-300">
                        Create a new room and share the Room ID and Code with others to let them join.
                      </div>
                      
                      <Button 
                        onClick={createRoom}
                        disabled={loading || !userName}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? "Creating..." : "Create Room"}
                      </Button>
                    </TabsContent>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            // Video Chat Room UI
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <div className="flex flex-col h-[calc(100vh-200px)]">
                {/* Room Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={leaveRoom}
                      className="text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    
                    <div>
                      <h2 className="text-xl font-bold text-white">Video Chat Room</h2>
                      <div className="flex items-center text-sm text-gray-400">
                        <Badge variant="outline" className="mr-2 text-blue-400 border-blue-600">
                          Room Code: {roomCode}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={copyRoomDetails}
                          className="h-6 w-6 rounded-full"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-600">
                      <Users className="h-3 w-3 mr-1" />
                      {participants.length} {participants.length === 1 ? 'Person' : 'People'}
                    </Badge>
                  </div>
                </div>
                
                {/* Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 flex-grow">
                  {/* Local Video */}
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${videoEnabled ? '' : 'hidden'}`}
                    />
                    
                    {!videoEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <div className="mb-2">
                            <Avatar className="h-20 w-20 mx-auto">
                              <AvatarFallback className="bg-blue-600 text-2xl">
                                {userName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <p className="text-white font-medium">{userName} (You)</p>
                          <p className="text-gray-400 text-sm">Camera Off</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-3 left-3 flex space-x-2">
                      <Badge className="bg-blue-600">You</Badge>
                    </div>
                    
                    <div className="absolute bottom-3 right-3 flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleVideo}
                        className={`rounded-full h-8 w-8 ${!videoEnabled ? 'bg-red-600 border-red-700' : 'bg-gray-800 border-gray-700'}`}
                      >
                        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleAudio}
                        className={`rounded-full h-8 w-8 ${!audioEnabled ? 'bg-red-600 border-red-700' : 'bg-gray-800 border-gray-700'}`}
                      >
                        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Remote Videos */}
                  {participants.filter(p => p.id !== 'self').map((participant) => (
                    <div key={participant.id} className="relative bg-gray-900 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                      {participant.stream ? (
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(ref) => {
                            if (ref && participant.stream) ref.srcObject = participant.stream;
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                          <div className="text-center">
                            <div className="mb-2">
                              <Avatar className="h-20 w-20 mx-auto">
                                <AvatarFallback className="bg-purple-600 text-2xl">
                                  {participant.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <p className="text-white font-medium">{participant.name}</p>
                            <p className="text-gray-400 text-sm">Connecting...</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-gray-700 text-white">
                          {participant.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Chat Section */}
                <div className="h-64 bg-gray-900 rounded-lg border border-gray-800 shadow-md">
                  <div className="flex flex-col h-full">
                    <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-medium text-white">Chat</h3>
                      <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                        {messages.length} messages
                      </Badge>
                    </div>
                    
                    <ScrollArea className="flex-grow p-3">
                      <div className="space-y-3">
                        {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.isSystem ? 'justify-center' : 'justify-start'}`}>
                            {msg.isSystem ? (
                              <div className="bg-gray-800/50 px-3 py-1 rounded-full text-sm text-gray-400">
                                {msg.message}
                              </div>
                            ) : (
                              <div className="max-w-[80%]">
                                <div className="flex items-end space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={msg.sender === userName ? "bg-blue-600" : "bg-purple-600"}>
                                      {msg.sender.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className={`px-3 py-2 rounded-lg ${
                                    msg.sender === userName 
                                      ? "bg-blue-600 text-white" 
                                      : "bg-gray-800 text-white"
                                  }`}>
                                    <p className="text-xs font-medium mb-1">
                                      {msg.sender === userName ? "You" : msg.sender}
                                    </p>
                                    <p>{msg.message}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-10">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={messageEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="p-3 border-t border-gray-800">
                      <form 
                        className="flex space-x-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                      >
                        <Input
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <Button 
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!messageInput.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex justify-center space-x-4 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleVideo}
                    className={`rounded-full h-12 w-12 ${!videoEnabled ? 'bg-red-600 border-red-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                  >
                    {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleAudio}
                    className={`rounded-full h-12 w-12 ${!audioEnabled ? 'bg-red-600 border-red-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                  >
                    {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={leaveRoom}
                    className="rounded-full h-12 w-12"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyRoomDetails}
                          className="rounded-full h-12 w-12 bg-gray-800 border-gray-700 hover:bg-gray-700"
                        >
                          <UserPlus className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy Invite Details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </motion.div>
          )}
        </Container>
      </main>
      
      <Footer />
    </div>
  );
}