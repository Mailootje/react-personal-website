import { useEffect, useRef, useState } from 'react';
import Container from '@/components/Container';
import SectionHeading from '@/components/SectionHeading';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mic, MicOff, Phone, Plus, Copy, Lock, Monitor, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

interface VoiceRoom {
  id: string;
  name: string;
  participantCount: number;
  hasPassword: boolean;
  inviteCode?: string;
}

interface Participant {
  socketId: string;
  username: string;
  isMuted?: boolean;
  isScreenSharing?: boolean;
}

interface PeerConnection {
  username: string;
  pc: RTCPeerConnection;
  audioElement: HTMLAudioElement;
  videoElement?: HTMLVideoElement;
}

export default function VoiceChat() {
  const { toast } = useToast();
  
  // State
  const [username, setUsername] = useState<string>('');
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomPassword, setNewRoomPassword] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [passwordInputOpen, setPasswordInputOpen] = useState<boolean>(false);
  const [inviteInputOpen, setInviteInputOpen] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [currentInviteCode, setCurrentInviteCode] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [showVideoControls, setShowVideoControls] = useState<boolean>(false);
  
  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Initialize socket connection and get local media stream
  useEffect(() => {
    if (!username) return;
    
    // Create socket connection
    socketRef.current = io('/');
    
    // Initialize audio stream
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        localStreamRef.current = stream;
        setIsMuted(false);
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access to use voice chat',
          variant: 'destructive'
        });
      });
    
    // Handle connecting to peers when joining a room
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
    });
    
    // Handle new users joining and create peer connections
    socketRef.current.on('newUser', async ({ socketId, username }) => {
      console.log(`New user joined: ${username} (${socketId})`);
      
      // Create a peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            peerConnection.addTrack(track, localStreamRef.current);
          }
        });
      }
      
      // Add screen sharing tracks if active
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          if (screenStreamRef.current) {
            peerConnection.addTrack(track, screenStreamRef.current);
          }
        });
      }
      
      // Create audio element for remote audio
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
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('signal', {
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
          // Handle audio tracks
          peerConnection.audioElement.srcObject = event.streams[0];
          
          // Check if this is a video track (screen sharing)
          const videoTracks = event.streams[0].getVideoTracks();
          if (videoTracks.length > 0) {
            console.log('Received video track from', username);
            
            // Create video element if it doesn't exist
            if (!peerConnection.videoElement && videoContainerRef.current) {
              const videoElement = document.createElement('video');
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.className = 'w-full h-full object-contain';
              videoElement.srcObject = event.streams[0];
              
              // Clear existing videos and add this one
              while (videoContainerRef.current.firstChild) {
                videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
              }
              
              videoContainerRef.current.appendChild(videoElement);
              
              // Add a label to indicate whose screen is being shared
              const label = document.createElement('div');
              label.className = 'absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs';
              label.textContent = `${username}'s screen`;
              videoContainerRef.current.appendChild(label);
              
              // Update peer connection with video element
              peerConnectionsRef.current.set(socketId, {
                ...peerConnection,
                videoElement
              });
              
              // Show video controls
              setShowVideoControls(true);
            } else if (peerConnection.videoElement) {
              // Update existing video element
              peerConnection.videoElement.srcObject = event.streams[0];
            }
          }
        }
      };
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('signal', {
          to: socketId,
          from: socketRef.current.id,
          signal: { type: 'offer', sdp: peerConnection.localDescription }
        });
      }
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
          
          // Check if this is a video track (screen sharing)
          const videoTracks = event.streams[0].getVideoTracks();
          if (videoTracks.length > 0) {
            console.log('Received video track from participant');
            
            // Create video element if it doesn't exist
            if (videoContainerRef.current) {
              const videoElement = document.createElement('video');
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.className = 'w-full h-full object-contain';
              videoElement.srcObject = event.streams[0];
              
              // Clear existing videos and add this one
              while (videoContainerRef.current.firstChild) {
                videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
              }
              
              videoContainerRef.current.appendChild(videoElement);
              
              // Create a new object with videoElement
              const newPeerConnection = {
                username: 'Unknown', // Will be updated when we get room info
                pc,
                audioElement,
                videoElement
              };
              
              // Store peer connection with video element
              peerConnectionsRef.current.set(from, newPeerConnection);
              
              // Show video controls
              setShowVideoControls(true);
              
              // Use the updated peerConnection for further operations
              peerConnection = newPeerConnection;
            }
          } else {
            // Store peer connection without video element
            peerConnectionsRef.current.set(from, {
              username: 'Unknown', // Will be updated when we get room info
              pc,
              audioElement
            });
            
            peerConnection = { username: 'Unknown', pc, audioElement };
          }
        };
      }
      
      // Handle different signal types
      if (signal.type === 'offer' && peerConnection) {
        await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peerConnection.pc.createAnswer();
        await peerConnection.pc.setLocalDescription(answer);
        
        if (socketRef.current) {
          socketRef.current.emit('signal', {
            to: from,
            from: socketRef.current.id,
            signal: { type: 'answer', sdp: peerConnection.pc.localDescription }
          });
        }
      } else if (signal.type === 'answer' && peerConnection) {
        await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'ice-candidate' && peerConnection) {
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
    
    // Handle screen sharing state changes
    socketRef.current.on('screenShareStateChanged', ({ socketId, isScreenSharing }) => {
      console.log(`Participant ${socketId} ${isScreenSharing ? 'started' : 'stopped'} screen sharing`);
      
      // Update the participant's UI state
      setParticipants(prev => 
        prev.map(p => 
          p.socketId === socketId 
            ? { ...p, isScreenSharing } 
            : p
        )
      );
      
      // Toggle video display area as needed
      if (isScreenSharing) {
        setShowVideoControls(true);
      } else {
        // If this participant stopped sharing, clean up their video element
        const peerConnection = peerConnectionsRef.current.get(socketId);
        if (peerConnection && peerConnection.videoElement) {
          // Remove the video element from the DOM
          peerConnection.videoElement.srcObject = null;
          if (peerConnection.videoElement.parentNode === videoContainerRef.current) {
            videoContainerRef.current?.removeChild(peerConnection.videoElement);
          }
          
          // Update the peer connection to remove the video element
          peerConnectionsRef.current.set(socketId, {
            ...peerConnection,
            videoElement: undefined
          });
        }
        
        // Check if any participant is still screen sharing
        const anyScreenSharing = participants.some(
          p => p.socketId !== socketId && p.isScreenSharing
        );
        
        if (!anyScreenSharing && !isScreenSharing) {
          // No one is screen sharing anymore
          if (videoContainerRef.current) {
            while (videoContainerRef.current.firstChild) {
              videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
            }
          }
          
          // Only hide the video container if we're not sharing our own screen
          if (!isScreenSharing) {
            setShowVideoControls(false);
          }
        }
      }
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
      
      // Stop screen sharing if active
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        screenStreamRef.current = null;
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
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!currentRoom) {
      toast({
        title: 'Join a room first',
        description: 'You need to join a voice chat room before sharing your screen',
        variant: 'destructive'
      });
      return;
    }
    
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        screenStreamRef.current = null;
      }
      
      // Clear the video container when stopping screen share
      if (videoContainerRef.current) {
        while (videoContainerRef.current.firstChild) {
          videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
        }
      }
      
      setIsScreenSharing(false);
      setShowVideoControls(false);
      
      // Notify other participants that screen sharing has stopped
      if (socketRef.current) {
        socketRef.current.emit('screenShareStateChanged', {
          roomId: currentRoom,
          isScreenSharing: false,
          socketId: socketRef.current.id
        });
      }
      
      toast({
        title: 'Screen sharing stopped',
        description: 'Your screen is no longer being shared'
      });
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        screenStreamRef.current = screenStream;
        
        // Create video element to display our own screen share
        if (videoContainerRef.current) {
          // Clear existing video elements first
          while (videoContainerRef.current.firstChild) {
            videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
          }
          
          // Create and add our video element
          const videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.muted = true; // Mute our own video to prevent echo
          videoElement.playsInline = true;
          videoElement.className = 'w-full h-full object-contain';
          videoElement.srcObject = screenStream;
          videoContainerRef.current.appendChild(videoElement);
          
          // Add label indicating it's our screen
          const label = document.createElement('div');
          label.className = 'absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs';
          label.textContent = 'Your screen';
          videoContainerRef.current.appendChild(label);
        }
        
        // Add tracks to all peer connections
        peerConnectionsRef.current.forEach(({ pc }) => {
          screenStream.getTracks().forEach(track => {
            pc.addTrack(track, screenStream);
          });
        });
        
        // Handle track ending (user stops sharing)
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
        setShowVideoControls(true);
        
        // Notify other participants
        if (socketRef.current) {
          socketRef.current.emit('screenShareStateChanged', {
            roomId: currentRoom,
            isScreenSharing: true,
            socketId: socketRef.current.id
          });
        }
        
        toast({
          title: 'Screen sharing started',
          description: 'Your screen is now being shared with other participants'
        });
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast({
          title: 'Screen sharing failed',
          description: 'Failed to access your screen. Make sure to grant permission.',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Handle password prompt and room joining
  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      toast({
        title: 'Room not found',
        description: 'The voice chat room you are trying to join does not exist',
        variant: 'destructive'
      });
      return;
    }
    
    // If room has password, open password dialog
    if (room.hasPassword) {
      setSelectedRoomId(roomId);
      setRoomPassword('');
      setPasswordInputOpen(true);
    } else {
      // No password, join directly
      joinRoom(roomId);
    }
  };
  
  // Join a voice chat room
  const joinRoom = async (roomId: string, password?: string) => {
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
      // Add socket error handler for room join errors
      const handleRoomJoinError = (error: { message: string }) => {
        toast({
          title: 'Failed to join room',
          description: error.message,
          variant: 'destructive'
        });
        setIsJoiningRoom(false);
        socketRef.current?.off('roomJoinError', handleRoomJoinError);
      };
      
      socketRef.current.on('roomJoinError', handleRoomJoinError);
      
      // Send join request with password if provided
      socketRef.current.emit('joinRoom', { roomId, username, password });
      
      // Set timeout to remove error handler if successful
      setTimeout(() => {
        socketRef.current?.off('roomJoinError', handleRoomJoinError);
      }, 3000);
      
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
    setCurrentInviteCode(null);
    setIsCreator(false);
    
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
      const requestBody: { name: string; password?: string } = { name: newRoomName };
      
      // Only include password if it's not empty
      if (newRoomPassword.trim()) {
        requestBody.password = newRoomPassword.trim();
      }
      
      const response = await fetch('/api/voice-chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      const room = await response.json();
      
      // Save the invite code
      if (room.inviteCode) {
        setCurrentInviteCode(room.inviteCode);
      }
      
      // Mark as room creator
      setIsCreator(true);
      
      toast({
        title: 'Room created',
        description: `${newRoomName} has been created${newRoomPassword ? ' with password protection' : ''}`
      });
      
      setRooms(prev => [...prev, room]);
      setIsCreateRoomOpen(false);
      setNewRoomName('');
      setNewRoomPassword('');
      
      // Join the newly created room (we don't need password since we're the creator)
      joinRoom(room.id, newRoomPassword);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: 'Failed to create room',
        description: 'There was an error creating the voice chat room',
        variant: 'destructive'
      });
    }
  };
  
  // State for input before committing the username
  const [usernameInput, setUsernameInput] = useState<string>('');
  
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
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && usernameInput.trim()) {
                      setUsername(usernameInput.trim());
                    }
                  }}
                />
                <Button 
                  className="w-full"
                  disabled={!usernameInput.trim()}
                  onClick={() => setUsername(usernameInput.trim())}
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
  
  // Add a function to join room by invite code
  const joinRoomByInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Invite code required",
        description: "Please enter a valid invite code",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/voice-chat/rooms/invite/${inviteCode}`);
      
      if (!response.ok) {
        throw new Error("Invalid invite code");
      }
      
      const room = await response.json();
      
      // Close invite dialog
      setInviteInputOpen(false);
      setInviteCode("");
      
      // If room has password, prompt for it
      if (room.hasPassword) {
        setSelectedRoomId(room.id);
        setRoomPassword('');
        setPasswordInputOpen(true);
      } else {
        // No password, join directly
        joinRoom(room.id);
      }
      
    } catch (error) {
      toast({
        title: "Invalid invite code",
        description: "Could not find a room with that invite code",
        variant: "destructive"
      });
    }
  };

  // Password dialog component
  const PasswordDialog = () => (
    <Dialog open={passwordInputOpen} onOpenChange={setPasswordInputOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Room Password</DialogTitle>
          <DialogDescription>
            This voice chat room is password protected
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Enter room password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              onKeyDown={(e) => {
                // Prevent form submission on Enter key
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPasswordInputOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setPasswordInputOpen(false);
              joinRoom(selectedRoomId!, roomPassword);
            }}
            disabled={!roomPassword.trim()}
          >
            Join Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Invite code input dialog
  const InviteCodeDialog = () => (
    <Dialog open={inviteInputOpen} onOpenChange={setInviteInputOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join with Invite Code</DialogTitle>
          <DialogDescription>
            Enter the invite code to join a private voice chat room
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Code</label>
            <Input
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => {
                // Prevent form submission on Enter key
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setInviteInputOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={joinRoomByInviteCode}
            disabled={!inviteCode.trim()}
          >
            Join Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-background pt-20">
        <Container className="py-16">
          <SectionHeading
            subtitle="VOICE CHAT"
            title="Connect with Voice"
            description="Create or join voice chat rooms to talk with friends in real-time"
          />
          
          <div className="mt-8 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
              <div className="border-r border-border/50 md:col-span-1 lg:col-span-1 p-4">
                <h3 className="text-lg font-medium mb-4">Available Rooms</h3>
                
                {isJoiningRoom ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>Joining room...</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    {rooms.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <p>No rooms available</p>
                        <p className="text-sm mt-2">Create a new room to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pr-4">
                        {rooms.map(room => (
                          <div 
                            key={room.id} 
                            className={`p-3 rounded-md border transition-colors cursor-pointer ${
                              currentRoom === room.id 
                                ? 'bg-primary/10 border-primary/30' 
                                : 'border-border/50 hover:bg-accent/50'
                            }`}
                            onClick={() => handleJoinRoom(room.id)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">{room.name}</h4>
                              {room.hasPassword && (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {room.participantCount} {room.participantCount === 1 ? 'participant' : 'participants'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
                
                <PasswordDialog />
                <InviteCodeDialog />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3 p-4">
                {currentRoom ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">
                        {rooms.find(r => r.id === currentRoom)?.name || 'Voice Room'}
                      </h3>
                      <div className="text-xs text-muted-foreground">
                        {participants.length} participants
                      </div>
                    </div>
                    
                    <div className="flex-1 border border-border/50 rounded-md bg-background p-4 mb-4 overflow-y-auto">
                      {/* Video container for screen sharing */}
                      {showVideoControls && (
                        <div 
                          ref={videoContainerRef} 
                          className="w-full bg-black rounded-md mb-4 relative aspect-video overflow-hidden"
                        >
                          {isScreenSharing && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                              You are sharing your screen
                            </div>
                          )}
                          {participants.some(p => p.isScreenSharing) && !isScreenSharing && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                              {participants.find(p => p.isScreenSharing)?.username} is sharing their screen
                            </div>
                          )}
                        </div>
                      )}
                      
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
                          {isCreator && currentInviteCode && (
                            <div className="mt-4 p-3 bg-primary/5 rounded-md">
                              <p className="font-medium text-sm mb-1">Invite Code:</p>
                              <div className="flex items-center justify-center gap-2">
                                <code className="px-2 py-1 bg-background rounded text-sm font-mono">
                                  {currentInviteCode}
                                </code>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(currentInviteCode);
                                    toast({
                                      title: "Copied to clipboard",
                                      description: "Your invite code has been copied to clipboard"
                                    });
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs mt-2">Share this code with others to invite them</p>
                            </div>
                          )}
                          <p className="text-sm mt-4">Share the room name with friends to chat together</p>
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
                        variant={isScreenSharing ? "default" : "outline"}
                        size="icon"
                        onClick={toggleScreenShare}
                        className="rounded-full h-12 w-12"
                      >
                        {isScreenSharing ? (
                          <VideoOff className="h-5 w-5" />
                        ) : (
                          <Monitor className="h-5 w-5" />
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
                      
                      <div className="flex justify-center space-x-4">
                        <Button variant="outline" onClick={() => setInviteInputOpen(true)}>
                          Join with invite code
                        </Button>
                        
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
                                <label className="text-sm font-medium">Room Name</label>
                                <Input
                                  placeholder="Room name"
                                  value={newRoomName}
                                  onChange={(e) => setNewRoomName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Password (Optional)</label>
                                <Input
                                  type="password"
                                  placeholder="Leave empty for public room"
                                  value={newRoomPassword}
                                  onChange={(e) => setNewRoomPassword(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                  Add a password to create a private room
                                </p>
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
