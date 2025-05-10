import { useState, useEffect, useRef } from 'react';
import { Form, Button } from 'react-bootstrap';

interface ChatPanelProps {
  sessionId: string;
  userId: string;
  userName: string;
  readerId: string;
  readerName: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export default function ChatPanel({
  sessionId,
  userId,
  userName,
  readerId,
  readerName
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  
  // Set up WebSocket connection
  useEffect(() => {
    // We'd normally use an environment variable for the WebSocket URL
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/api/chat`
      : `ws://localhost:3000/api/chat`;
    
    const ws = new WebSocket(`${wsUrl}?sessionId=${sessionId}&userId=${userId}`);
    websocketRef.current = ws;
    
    ws.onopen = () => {
      console.log('Chat WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat') {
        setMessages(prev => [...prev, data.message]);
      }
    };
    
    ws.onclose = () => {
      console.log('Chat WebSocket connection closed');
    };
    
    return () => {
      ws.close();
    };
  }, [sessionId, userId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !websocketRef.current) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: userName,
      message: message.trim(),
      timestamp: Date.now()
    };
    
    websocketRef.current.send(JSON.stringify({
      type: 'chat',
      message: newMessage
    }));
    
    // Add to local state immediately for responsive UI
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="d-flex flex-column h-100 bg-white">
      <div className="p-3 border-bottom bg-light">
        <h5 className="mb-0">Chat with {readerName}</h5>
      </div>
      
      <div className="flex-grow-1 p-3 overflow-auto">
        {messages.length === 0 ? (
          <div className="text-center text-muted my-4">
            <p>No messages yet</p>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`mb-3 ${msg.senderId === userId ? 'text-end' : ''}`}
            >
              <div 
                className={`d-inline-block px-3 py-2 rounded-3 ${
                  msg.senderId === userId 
                    ? 'bg-primary text-white' 
                    : 'bg-light'
                }`}
                style={{ maxWidth: '80%', textAlign: 'left' }}
              >
                <div className="fw-bold small">
                  {msg.senderId === userId ? 'You' : msg.senderName}
                </div>
                <div>{msg.message}</div>
              </div>
              <div className="text-muted small mt-1">
                {formatTime(msg.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-top">
        <Form onSubmit={sendMessage}>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="me-2"
            />
            <Button type="submit" disabled={!message.trim()}>
              <i className="bi bi-send"></i>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}