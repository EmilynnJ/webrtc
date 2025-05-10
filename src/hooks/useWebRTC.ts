import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Configuration for WebRTC peer connections
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { 
      urls: 'turn:numb.viagenie.ca',
      username: 'webrtc@live.com',
      credential: 'muazkh'
    }
  ],
  iceCandidatePoolSize: 10
};

type SignalingMessage = {
  type: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  sender?: string;
};

export default function useWebRTC(sessionId: string, userId: string, readerId: string, localStream: MediaStream | null) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [signalingState, setSignalingState] = useState<string>('new');
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isInitiatorRef = useRef(userId !== readerId);

  // Initialize WebRTC
  const initialize = useCallback(async () => {
    if (!localStream) {
      console.error('No local stream available');
      return;
    }
    
    // Create peer connection
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnection.current = pc;
    
    // Set up event listeners
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        const message: SignalingMessage = {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
          sender: userId
        };
        socketRef.current.send(JSON.stringify(message));
      }
    };
    
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      console.log('Connection state changed:', pc.connectionState);
    };
    
    pc.onsignalingstatechange = () => {
      setSignalingState(pc.signalingState);
      console.log('Signaling state changed:', pc.signalingState);
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        // Try to restart ICE connection
        pc.restartIce();
      }
    };
    
    // Set up remote stream
    const newRemoteStream = new MediaStream();
    setRemoteStream(newRemoteStream);
    
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        newRemoteStream.addTrack(track);
      });
    };
    
    // Add local tracks to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
    
    // Setup signaling server connection
    setupSignaling();
    
    return pc;
  }, [localStream, sessionId, userId, readerId]);

  // Setup signaling server connection
  const setupSignaling = useCallback(() => {
    // We'd normally use an environment variable for the signaling server URL
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/api/signaling`
      : `ws://localhost:3000/api/signaling`;
    
    const socket = new WebSocket(`${wsUrl}?sessionId=${sessionId}&userId=${userId}`);
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      
      // Notify that we're ready to connect
      socket.send(JSON.stringify({
        type: 'ready',
        sender: userId
      }));
      
      // If we're the initiator (user), create and send offer
      if (isInitiatorRef.current && peerConnection.current) {
        createAndSendOffer();
      }
    };
    
    socket.onmessage = async (event) => {
      const message: SignalingMessage = JSON.parse(event.data);
      
      if (message.sender === userId) {
        return; // Ignore messages from ourselves
      }
      
      console.log('Received signaling message:', message.type);
      
      try {
        const pc = peerConnection.current;
        if (!pc) return;
        
        if (message.type === 'ready' && isInitiatorRef.current) {
          // If we're the initiator and remote peer is ready, send offer
          await createAndSendOffer();
        }
        else if (message.type === 'offer' && message.sdp) {
          // Remote peer sent us an offer
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
          
          // Create and send answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          socket.send(JSON.stringify({
            type: 'answer',
            sdp: answer,
            sender: userId
          }));
        }
        else if (message.type === 'answer' && message.sdp) {
          // Remote peer sent us an answer
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        }
        else if (message.type === 'ice-candidate' && message.candidate) {
          // Remote peer sent us an ICE candidate
          try {
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return socket;
  }, [sessionId, userId]);

  // Create and send offer
  const createAndSendOffer = async () => {
    const pc = peerConnection.current;
    const socket = socketRef.current;
    
    if (!pc || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      
      socket.send(JSON.stringify({
        type: 'offer',
        sdp: offer,
        sender: userId
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks.forEach(track => {
          track.enabled = enabled;
        });
        setIsAudioMuted(!enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled;
        videoTracks.forEach(track => {
          track.enabled = enabled;
        });
        setIsVideoOff(!enabled);
      }
    }
  }, [localStream]);

  // Close connection
  const close = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
  }, [remoteStream]);

  // Initialize WebRTC when components loads
  useEffect(() => {
    if (localStream && sessionId) {
      initialize();
    }
    
    return () => {
      close();
    };
  }, [localStream, sessionId, initialize, close]);

  return {
    remoteStream,
    isAudioMuted,
    isVideoOff,
    connectionState,
    signalingState,
    toggleAudio,
    toggleVideo,
    close
  };
}