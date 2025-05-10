import { useState, useEffect, useCallback } from 'react';
import { setupChatService } from '../services/chatService';

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

const useChat = (sessionId: string, userId: string) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatService, setChatService] = useState<any>(null);
  
  // Set up chat service
  useEffect(() => {
    if (!sessionId || !userId) return;
    
    const service = setupChatService(sessionId, userId);
    
    // Handle incoming messages
    service.onMessage = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };
    
    // Connect to the chat service
    service.connect();
    setChatService(service);
    
    // Clean up on unmount
    return () => {
      service.disconnect();
    };
  }, [sessionId, userId]);
  
  // Send a message
  const sendMessage = useCallback((message: string) => {
    if (!chatService) return;
    
    const newMessage: ChatMessage = {
      sender: userId,
      message,
      timestamp: Date.now()
    };
    
    chatService.sendMessage(newMessage);
    
    // Add to local state immediately for responsive UI
    setChatMessages(prev => [...prev, newMessage]);
  }, [chatService, userId]);
  
  return {
    chatMessages,
    sendMessage
  };
};

export default useChat;