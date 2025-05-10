import { useRef, useEffect, useState } from 'react';
import { useSession } from '../contexts/SessionContext';

interface ChatPanelProps {
  readerName: string;
}

const ChatPanel = ({ readerName }: ChatPanelProps) => {
  const { chatMessages, sendChatMessage, userId } = useSession();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };
  
  // Format timestamps from message
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-semibold text-white">Chat with {readerName}</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-3">
          {chatMessages.length === 0 ? (
            <p className="text-center text-gray-500 my-6">
              No messages yet. Start the conversation!
            </p>
          ) : (
            chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${msg.sender === userId ? 'items-end' : 'items-start'}`}
              >
                <div className={`chat-bubble ${
                  msg.sender === userId 
                    ? 'chat-bubble-sender' 
                    : 'chat-bubble-receiver'
                }`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))
          )}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;