import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Phone, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Container from '@/components/Container';
import SectionHeading from '@/components/SectionHeading';

interface VoiceRoom {
  id: string;
  name: string;
  participantCount: number;
}

interface Participant {
  socketId: string;
  username: string;
  isMuted?: boolean;
}

interface PeerConnection {
  username: string;
  pc: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

export default function VoiceChat() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  
  // Connect to socket server and set up local stream
  useEffect(() => {
    if (!username) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    socketRef.current = io(wsUrl, { path: '/ws' });
    
    // Set up socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to voice chat server');
      
      // Request microphone access
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
          localStreamRef.current = stream;
          
          if (isMuted) {
            stream.getAudioTracks().forEach(track => {
              track.enabled = false;
            });
          }
          
          toast({
            title: 'Microphone connected',
            description: 'Your microphone is now active'
          });
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
          toast({
            title: 'Microphone access denied',
            description: 'Please allow microphone access to use voice chat',
            variant: 'destructive'
          });
        });
    });
    
    // Handle new user joining room
    socketRef.current.on('userJoined', async ({ socketId, username }) => {
      console.log(`User joined: ${username} (${socketId})`);
      
      if (!localStreamRef.current) return;
      
      // Create new peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      // Add local tracks to the connection
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });
      
      // Create audio element for remote stream
      const audioElement = new Audio();
      audioElement.autoplay = true;
      
      // Store peer connection
      peerConnectionsRef.current.set(socketId, {
        username,
        pc: peerConnection,
        audioElement
      });
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('signal', {
            to: socketId,
            from: socketRef.current.id,
            signal: { type: 'ice-candidate', ice: event.candidate }
          });
        }
      };
      
      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        const peerConnection = peerConnectionsRef.current.get(socketId);
        if (peerConnection) {
          peerConnection.audioElement.srcObject = event.streams[0];
        }
      };
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketRef.current.emit('signal', {
        to: socketId,
        from: socketRef.current.id,
        signal: { type: 'offer', sdp: peerConnection.localDescription }
      });
    });
    
    // Handle WebRTC signaling
    socketRef.current.on('signal', async ({ from, signal }) => {
      // Get peer connection or create new one
      let peerConnection = peerConnectionsRef.current.get(from);
      
      if (!peerConnection) {
        // Create new peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        
        // Add local tracks to the connection
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            if (localStreamRef.current) {
              pc.addTrack(track, localStreamRef.current);
            }
          });
        }
        
        // Create audio element for remote stream
        const audioElement = new Audio();
        audioElement.autoplay = true;
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current?.emit('signal', {
              to: from,
              from: socketRef.current.id,
              signal: { type: 'ice-candidate', ice: event.candidate }
            });
          }
        };
        
        // Handle incoming tracks
        pc.ontrack = (event) => {
          audioElement.srcObject = event.streams[0];
        };
        
        // Store peer connection
        peerConnectionsRef.current.set(from, {
          username: 'Unknown', // Will be updated when we get room info
          pc,
          audioElement
        });
        
        peerConnection = { username: 'Unknown', pc, audioElement };
      }
      
      // Handle different signal types
      if (signal.type === 'offer') {
        await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peerConnection.pc.createAnswer();
        await peerConnection.pc.setLocalDescription(answer);
        
        socketRef.current.emit('signal', {
          to: from,
          from: socketRef.current.id,
          signal: { type: 'answer', sdp: peerConnection.pc.localDescription }
        });
      } else if (signal.type === 'answer') {
        await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'ice-candidate') {
        try {
          await peerConnection.pc.addIceCandidate(new RTCIceCandidate(signal.ice));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
    
    // Handle room information
    socketRef.current.on('roomInfo', ({ roomId, participants }) => {
      setParticipants(participants);
    });
    
    // Handle user leaving
    socketRef.current.on('userLeft', ({ socketId }) => {
      const peerConnection = peerConnectionsRef.current.get(socketId);
      if (peerConnection) {
        peerConnection.pc.close();
        peerConnection.audioElement.srcObject = null;
        peerConnectionsRef.current.delete(socketId);
      }
      
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    });
    
    // Handle participant mute state changes
    socketRef.current.on('participantMuteChanged', ({ socketId, isMuted }) => {
      console.log(`Participant ${socketId} ${isMuted ? 'muted' : 'unmuted'}`);
      
      // Update the participant's audio track if available
      const peerConnection = peerConnectionsRef.current.get(socketId);
      if (peerConnection && peerConnection.audioElement.srcObject) {
        const audioTracks = (peerConnection.audioElement.srcObject as MediaStream).getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !isMuted;
        });
      }
      
      // Update the participant's UI state
      setParticipants(prev => 
        prev.map(p => 
          p.socketId === socketId 
            ? { ...p, isMuted } 
            : p
        )
      );
    });
    
    // Clean up function
    return () => {
      // Close all peer connections
      peerConnectionsRef.current.forEach(({ pc, audioElement }) => {
        pc.close();
        audioElement.srcObject = null;
      });
      peerConnectionsRef.current.clear();
      
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      
      // Leave room if connected
      if (currentRoom && socketRef.current) {
        socketRef.current.emit('leaveRoom', { roomId: currentRoom, username });
      }
      
      // Disconnect socket
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [username, isMuted]);
  
  // Load rooms from server
  useEffect(() => {
    if (!username) return;
    
    fetch('/api/voice-chat/rooms')
      .then(res => res.json())
      .then(data => {
        setRooms(data);
      })
      .catch(error => {
        console.error('Error fetching rooms:', error);
      });
  }, [username, currentRoom]);
  
  // Toggle mute state
  const toggleMute = () => {
    if (localStreamRef.current) {
      // Update local audio track state
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      
      // Update mute state
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      
      // Broadcast mute state to all participants in the room
      if (currentRoom && socketRef.current) {
        socketRef.current.emit('muteStateChanged', {
          roomId: currentRoom,
          isMuted: newMuteState,
          socketId: socketRef.current.id
        });
        
        console.log(`Broadcasting mute state: ${newMuteState ? 'Muted' : 'Unmuted'}`);
      }
    }
  };
  
  // Join a voice chat room
  const joinRoom = async (roomId: string) => {
    if (!username || !socketRef.current) {
      toast({
        title: 'Enter a username',
        description: 'Please enter a username before joining a room',
        variant: 'destructive'
      });
      return;
    }
    
    if (!localStreamRef.current) {
      toast({
        title: 'Microphone not connected',
        description: 'Please allow microphone access to join a voice chat room',
        variant: 'destructive'
      });
      return;
    }
    
    setIsJoiningRoom(true);
    
    // If already in a room, leave it first
    if (currentRoom) {
      socketRef.current.emit('leaveRoom', { roomId: currentRoom, username });
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(({ pc, audioElement }) => {
        pc.close();
        audioElement.srcObject = null;
      });
      peerConnectionsRef.current.clear();
    }
    
    try {
      socketRef.current.emit('joinRoom', { roomId, username });
      setCurrentRoom(roomId);
      
      toast({
        title: 'Joined voice chat',
        description: `You've joined the voice chat room`
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: 'Failed to join room',
        description: 'There was an error joining the voice chat room',
        variant: 'destructive'
      });
    }
    
    setIsJoiningRoom(false);
  };
  
  // Leave the current room
  const leaveRoom = () => {
    if (!currentRoom || !socketRef.current) return;
    
    socketRef.current.emit('leaveRoom', { roomId: currentRoom, username });
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(({ pc, audioElement }) => {
      pc.close();
      audioElement.srcObject = null;
    });
    peerConnectionsRef.current.clear();
    
    setCurrentRoom(null);
    setParticipants([]);
    
    toast({
      title: 'Left voice chat',
      description: 'You have left the voice chat room'
    });
  };
  
  // Create a new room
  const createRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: 'Room name required',
        description: 'Please enter a name for the room',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const response = await fetch('/api/voice-chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newRoomName })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      const room = await response.json();
      
      toast({
        title: 'Room created',
        description: `${newRoomName} has been created`
      });
      
      setRooms(prev => [...prev, room]);
      setIsCreateRoomOpen(false);
      setNewRoomName('');
      
      // Join the newly created room
      joinRoom(room.id);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Failed to create room',
        description: 'There was an error creating the voice chat room',
        variant: 'destructive'
      });
    }
  };
  
  // If username is not set, show setup screen
  if (!username) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 bg-background pt-20">
          <Container className="py-16">
            <div className="max-w-lg mx-auto text-center">
              <SectionHeading
                subtitle="VOICE CHAT"
                title="Join Voice Conversations"
                center
              />
              
              <div className="mt-8 p-6 bg-card border border-border rounded-lg shadow-lg">
                <h3 className="text-lg font-medium mb-4">Enter your display name</h3>
                <Input 
                  placeholder="Your name" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  className="w-full"
                  disabled={!username.trim()}
                  onClick={() => setUsername(username.trim())}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-background pt-20">
        <Container className="py-8">
          <SectionHeading
            subtitle="VOICE CHAT"
            title="Live Conversations"
          />
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {/* Room List Section */}
            <div className="md:col-span-1">
              <div className="bg-card border border-border rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Voice Rooms</h3>
                  <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Voice Room</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Input
                            placeholder="Room name"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateRoomOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createRoom}>
                          Create Room
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No voice rooms available</p>
                    <p className="text-sm">Create a new room to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <div 
                        key={room.id}
                        className={`flex justify-between items-center p-3 rounded-md hover:bg-accent/50 cursor-pointer transition-colors ${
                          currentRoom === room.id ? 'bg-accent text-accent-foreground' : ''
                        }`}
                        onClick={() => joinRoom(room.id)}
                      >
                        <div>
                          <h4 className="font-medium">{room.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {room.participantCount} participants
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant={currentRoom === room.id ? "secondary" : "outline"}
                          disabled={isJoiningRoom}
                        >
                          {currentRoom === room.id ? 'Joined' : 'Join'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Active Call Section */}
            <div className="md:col-span-2">
              <div className="bg-card border border-border rounded-lg shadow-lg p-4 h-full flex flex-col">
                {currentRoom ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">
                        {rooms.find(r => r.id === currentRoom)?.name || 'Voice Chat'}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {participants.length} participants
                      </div>
                    </div>
                    
                    <div className="flex-1 border border-border/50 rounded-md bg-background p-4 mb-4 overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Current user */}
                        <div className="flex flex-col items-center p-3 rounded-md bg-accent/30">
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                            <span className="text-xl font-bold">
                              {username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{username} (You)</span>
                          <span className="text-xs text-muted-foreground">
                            {isMuted ? 'Muted' : 'Speaking'}
                          </span>
                        </div>
                        
                        {/* Other participants */}
                        {participants
                          .filter(p => socketRef.current && p.socketId !== socketRef.current.id)
                          .map((participant) => (
                            <div key={participant.socketId} className="flex flex-col items-center p-3 rounded-md bg-card">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <span className="text-xl font-bold">
                                  {participant.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium">{participant.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {participant.isMuted ? 'Muted' : 'Speaking'}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {participants.length <= 1 && (
                        <div className="text-center py-8 text-muted-foreground mt-4">
                          <p>Waiting for others to join...</p>
                          <p className="text-sm">Share the room name with friends to chat together</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant={isMuted ? "default" : "outline"}
                        size="icon"
                        onClick={toggleMute}
                        className="rounded-full h-12 w-12"
                      >
                        {isMuted ? (
                          <MicOff className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={leaveRoom}
                        className="rounded-full h-12 w-12"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-xl font-medium mb-2">Join a voice room</h3>
                      <p className="text-muted-foreground mb-6">
                        Select a room from the list to start chatting
                      </p>
                      
                      <div className="flex justify-center">
                        <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Create a room
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create a New Voice Room</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Input
                                  placeholder="Room name"
                                  value={newRoomName}
                                  onChange={(e) => setNewRoomName(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsCreateRoomOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={createRoom}>
                                Create Room
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}