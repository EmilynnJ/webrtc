import { useState } from 'react';
import { Button, Badge } from 'react-bootstrap';

interface ControlBarProps {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  connectionState: string;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleChat: () => void;
  endSession: () => void;
}

export default function ControlBar({
  isAudioMuted,
  isVideoOff,
  isChatOpen,
  connectionState,
  toggleAudio,
  toggleVideo,
  toggleChat,
  endSession
}: ControlBarProps) {
  const [confirmEndSession, setConfirmEndSession] = useState(false);
  
  // Handle end session button click
  const handleEndSessionClick = () => {
    if (confirmEndSession) {
      endSession();
    } else {
      setConfirmEndSession(true);
      
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setConfirmEndSession(false);
      }, 3000);
    }
  };

  return (
    <div className="bg-dark bg-opacity-75 p-3 d-flex align-items-center justify-content-between">
      {/* Connection status */}
      <div className="d-flex align-items-center">
        <Badge bg={connectionState === 'connected' ? 'success' : 'warning'} className="d-flex align-items-center">
          <div 
            className={`rounded-circle me-1 ${connectionState === 'connected' ? 'bg-success' : 'bg-warning'}`}
            style={{ width: '8px', height: '8px' }}
          ></div>
          {connectionState === 'connected' ? 'Connected' : 'Connecting...'}
        </Badge>
      </div>
      
      {/* Media controls */}
      <div className="d-flex gap-2">
        {/* Microphone button */}
        <Button
          variant={isAudioMuted ? 'danger' : 'light'}
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '44px', height: '44px' }}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          <i className={`bi ${isAudioMuted ? 'bi-mic-mute' : 'bi-mic'}`}></i>
        </Button>
        
        {/* Camera button */}
        <Button
          variant={isVideoOff ? 'danger' : 'light'}
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '44px', height: '44px' }}
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          <i className={`bi ${isVideoOff ? 'bi-camera-video-off' : 'bi-camera-video'}`}></i>
        </Button>
        
        {/* Chat button */}
        <Button
          variant={isChatOpen ? 'primary' : 'light'}
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '44px', height: '44px' }}
          onClick={toggleChat}
          title={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <i className="bi bi-chat-text"></i>
        </Button>
        
        {/* End call button */}
        <Button
          variant="danger"
          className="rounded-circle d-flex align-items-center justify-content-center ms-2"
          style={{ width: '44px', height: '44px' }}
          onClick={handleEndSessionClick}
          title="End session"
        >
          {confirmEndSession ? (
            <i className="bi bi-check-lg"></i>
          ) : (
            <i className="bi bi-telephone-x"></i>
          )}
        </Button>
      </div>
      
      {/* Spacer to balance the layout */}
      <div style={{ width: '100px' }}></div>
    </div>
  );
}