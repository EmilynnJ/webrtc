import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import VideoDisplay from './VideoDisplay';
import ChatPanel from './ChatPanel';
import ControlBar from './ControlBar';
import SessionInfo from './SessionInfo';
import ErrorPage from './ErrorPage';

const SessionRoom = () => {
  const navigate = useNavigate();
  const {
    sessionStatus,
    remoteStream,
    localStream,
    reader,
    isChatOpen,
    endSession
  } = useSession();
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure we're in a valid session state
    if (sessionStatus !== 'connected' && sessionStatus !== 'connecting') {
      navigate('/pre-session');
    }
    
    // Request fullscreen when entering the session
    const requestFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenEnabled) {
          await containerRef.current.requestFullscreen();
        }
      } catch (error) {
        console.warn('Fullscreen request failed:', error);
      }
    };
    
    // Handle escape key to properly end the session
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        e.preventDefault();
        if (confirm('Are you sure you want to exit fullscreen? This will end your session.')) {
          endSession('user_ended');
        }
      }
    };
    
    requestFullscreen();
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [sessionStatus, navigate, endSession]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && sessionStatus === 'connected') {
        // When user exits fullscreen, show a confirmation dialog
        if (confirm('Exiting fullscreen will end your session. Continue?')) {
          endSession('user_ended');
        } else {
          // User canceled, request fullscreen again
          containerRef.current?.requestFullscreen().catch(err => {
            console.warn('Failed to re-enter fullscreen:', err);
          });
        }
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [sessionStatus, endSession]);

  if (sessionStatus === 'error') {
    return <ErrorPage 
      title="Connection Error"
      message="We couldn't establish a connection to your reader. Please try again."
    />;
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-screen bg-gray-900 flex flex-col overflow-hidden"
    >
      <div className="flex flex-1 relative">
        {/* Video Display */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${isChatOpen ? 'lg:w-2/3' : 'w-full'}`}>
          <VideoDisplay 
            remoteStream={remoteStream} 
            localStream={localStream}
          />
          
          {/* Session Info (Timer, Balance, etc.) */}
          <SessionInfo />
        </div>
        
        {/* Chat Panel - conditionally visible */}
        {isChatOpen && (
          <div className="w-full lg:w-1/3 h-full glass-panel border-l border-purple-900/50">
            <ChatPanel readerName={reader?.name || 'Reader'} />
          </div>
        )}
      </div>
      
      {/* Control Bar (always visible at bottom) */}
      <ControlBar />
    </div>
  );
};

export default SessionRoom;