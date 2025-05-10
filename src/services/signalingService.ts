import { io, Socket } from 'socket.io-client';

// Get signaling server URL from environment variables
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || 'https://soulseer-signaling.onrender.com';

export const setupSignaling = (sessionId: string, userId: string, readerId: string) => {
  let socket: Socket | null = null;
  
  // Message handler, to be set by consumer
  let messageHandler: (message: any) => void = () => {};
  
  // Connect to signaling server
  const connect = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Create socket connection
        socket = io(SIGNALING_SERVER_URL, {
          query: {
            sessionId,
            userId,
            readerId,
            role: 'user' // Always user in this context
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        // Handle connection events
        socket.on('connect', () => {
          console.log('Connected to signaling server');
          
          // Join the session room
          socket.emit('join-session', { sessionId, userId, readerId });
          
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          console.error('Signaling connection error:', error);
          reject(error);
        });
        
        // Handle incoming WebRTC signaling messages
        socket.on('webrtc-message', (message) => {
          messageHandler(message);
        });
        
        // Handle session status updates
        socket.on('session-status', (status) => {
          console.log('Session status update:', status);
          // Could implement additional handling if needed
        });
        
        // Handle disconnection
        socket.on('disconnect', (reason) => {
          console.log('Disconnected from signaling server:', reason);
        });
      } catch (error) {
        console.error('Error setting up signaling:', error);
        reject(error);
      }
    });
  };
  
  // Send message through signaling server
  const sendMessage = (message: any): void => {
    if (socket && socket.connected) {
      socket.emit('webrtc-message', {
        sessionId,
        userId,
        readerId,
        message
      });
    } else {
      console.warn('Cannot send message: signaling not connected');
    }
  };
  
  // Disconnect from signaling server
  const disconnect = (): void => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
  
  return {
    connect,
    sendMessage,
    disconnect,
    set onMessage(handler: (message: any) => void) {
      messageHandler = handler;
    }
  };
};