import { io, Socket } from 'socket.io-client';

// Get chat server URL from environment variables (can be same as signaling server)
const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL || 'https://soulseer-signaling.onrender.com';

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export const setupChatService = (sessionId: string, userId: string) => {
  let socket: Socket | null = null;
  
  // Message handler, to be set by consumer
  let messageHandler: (message: ChatMessage) => void = () => {};
  
  // Connect to chat server
  const connect = (): void => {
    try {
      // Create socket connection
      socket = io(`${CHAT_SERVER_URL}/chat`, {
        query: {
          sessionId,
          userId
        },
        transports: ['websocket', 'polling']
      });
      
      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to chat service');
        
        // Join the chat room
        socket.emit('join-chat', { sessionId, userId });
      });
      
      socket.on('connect_error', (error) => {
        console.error('Chat connection error:', error);
      });
      
      // Handle incoming chat messages
      socket.on('chat-message', (message: ChatMessage) => {
        // Don't process messages from self (already handled in UI)
        if (message.sender !== userId) {
          messageHandler(message);
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log('Disconnected from chat service:', reason);
      });
    } catch (error) {
      console.error('Error setting up chat service:', error);
    }
  };
  
  // Send chat message
  const sendMessage = (message: ChatMessage): void => {
    if (socket && socket.connected) {
      socket.emit('chat-message', {
        sessionId,
        message
      });
    } else {
      console.warn('Cannot send message: chat service not connected');
    }
  };
  
  // Disconnect from chat server
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
    set onMessage(handler: (message: ChatMessage) => void) {
      messageHandler = handler;
    }
  };
};