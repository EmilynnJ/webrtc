import { useEffect, useRef, useState } from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import useWebRTC from '@/hooks/useWebRTC';
import useSessionTimer from '@/hooks/useSessionTimer';
import VideoDisplay from './VideoDisplay';
import ChatPanel from './ChatPanel';
import ControlBar from './ControlBar';
import SessionInfo from './SessionInfo';

interface SessionRoomProps {
  sessionId: string;
  userId: string;
  userName: string;
  readerId: string;
  readerName: string;
  ratePerMinute: number;
  localStream: MediaStream | null;
  initialBalance: number;
  onEndSession: (reason?: string) => void;
}

export default function SessionRoom({
  sessionId,
  userId,
  userName,
  readerId,
  readerName,
  ratePerMinute,
  localStream,
  initialBalance,
  onEndSession
}: SessionRoomProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState(initialBalance);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebRTC connection
  const {
    remoteStream,
    isAudioMuted,
    isVideoOff,
    connectionState,
    toggleAudio,
    toggleVideo,
    close: closeWebRTC
  } = useWebRTC(sessionId, userId, readerId, localStream);
  
  // Initialize session timer
  const {
    sessionDuration,
    amountCharged,
    billingActive,
    startTimer,
    stopTimer
  } = useSessionTimer(ratePerMinute);
  
  // Start timer when connection is established
  useEffect(() => {
    if (connectionState === 'connected' && !billingActive) {
      startTimer();
    }
  }, [connectionState, billingActive, startTimer]);
  
  // Update remaining balance as session progresses
  useEffect(() => {
    setRemainingBalance(initialBalance - amountCharged);
  }, [initialBalance, amountCharged]);
  
  // Monitor balance and end call if insufficient funds
  useEffect(() => {
    if (billingActive && remainingBalance <= 0) {
      handleEndSession('insufficient_funds');
    }
  }, [remainingBalance, billingActive]);
  
  // Request fullscreen when entering the session
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenEnabled) {
          await containerRef.current.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch (error) {
        console.warn('Fullscreen request failed:', error);
      }
    };
    
    requestFullscreen();
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle escape key (exit fullscreen) to properly end session
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isFullScreen]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      closeWebRTC();
    };
  }, [stopTimer, closeWebRTC]);
  
  // Handler for ending the session
  const handleEndSession = (reason?: string) => {
    stopTimer();
    closeWebRTC();
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    onEndSession(reason);
  };
  
  // Toggle chat panel
  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div 
      ref={containerRef}
      className="position-relative d-flex flex-column vh-100 bg-dark"
    >
      <div className="flex-grow-1 d-flex overflow-hidden position-relative">
        {/* Main video area */}
        <div className={`flex-grow-1 ${isChatOpen ? 'chat-open' : ''}`}>
          <VideoDisplay 
            remoteStream={remoteStream} 
            localStream={localStream}
            readerName={readerName}
            connectionState={connectionState}
          />
          
          {/* Session info overlay */}
          <SessionInfo 
            sessionDuration={sessionDuration}
            amountCharged={amountCharged}
            remainingBalance={remainingBalance}
            ratePerMinute={ratePerMinute}
          />
        </div>
        
        {/* Chat panel */}
        {isChatOpen && (
          <div className="chat-panel">
            <ChatPanel 
              sessionId={sessionId}
              userId={userId}
              userName={userName}
              readerId={readerId}
              readerName={readerName}
            />
          </div>
        )}
      </div>
      
      {/* Control bar */}
      <ControlBar 
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isChatOpen={isChatOpen}
        connectionState={connectionState}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        toggleChat={handleToggleChat}
        endSession={() => handleEndSession('user_ended')}
      />
      
      <style jsx global>{`
        .chat-open {
          width: calc(100% - 300px);
        }
        
        .chat-panel {
          width: 300px;
          background-color: #f8f9fa;
          border-left: 1px solid #dee2e6;
        }
        
        @media (max-width: 768px) {
          .chat-open {
            width: 30%;
          }
          
          .chat-panel {
            width: 70%;
          }
        }
      `}</style>
    </div>
  );
}