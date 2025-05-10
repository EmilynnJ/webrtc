import { useState } from 'react';
import { useSession } from '../contexts/SessionContext';

const ControlBar = () => {
  const { 
    toggleAudio, 
    toggleVideo, 
    toggleChat,
    endSession,
    isAudioMuted,
    isVideoOff,
    isChatOpen,
    sessionStatus
  } = useSession();
  
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  const handleEndSession = () => {
    if (showEndConfirm) {
      endSession('user_ended');
      setShowEndConfirm(false);
    } else {
      setShowEndConfirm(true);
      // Auto-hide the confirmation after 3 seconds
      setTimeout(() => setShowEndConfirm(false), 3000);
    }
  };

  return (
    <div className="glass-panel py-3 px-6 flex items-center justify-between">
      {/* Connection status indicator */}
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          sessionStatus === 'connected' 
            ? 'bg-green-500' 
            : sessionStatus === 'connecting' || sessionStatus === 'waiting'
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`}></div>
        <span className="text-sm hidden sm:inline">
          {sessionStatus === 'connected' 
            ? 'Connected' 
            : sessionStatus === 'connecting'
            ? 'Connecting...'
            : sessionStatus === 'waiting'
            ? 'Waiting...'
            : 'Disconnected'}
        </span>
      </div>
      
      {/* Media controls */}
      <div className="flex items-center space-x-4">
        {/* Mute/Unmute Audio */}
        <button 
          onClick={toggleAudio}
          className={`media-control-btn ${isAudioMuted ? 'active' : ''}`}
          aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        
        {/* Toggle Video */}
        <button 
          onClick={toggleVideo}
          className={`media-control-btn ${isVideoOff ? 'active' : ''}`}
          aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        
        {/* Toggle Chat */}
        <button 
          onClick={toggleChat}
          className={`media-control-btn ${isChatOpen ? 'bg-purple-700 hover:bg-purple-600' : ''}`}
          aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
          title={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        
        {/* End Call Button */}
        <button
          onClick={handleEndSession}
          className="end-call-btn"
          aria-label="End session"
          title="End session"
        >
          {showEndConfirm ? (
            <span className="text-sm">Confirm</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ControlBar;