import { useEffect, useRef } from 'react';
import { useSession } from '../contexts/SessionContext';

interface VideoDisplayProps {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
}

const VideoDisplay = ({ remoteStream, localStream }: VideoDisplayProps) => {
  const { reader, isVideoOff, connectionStatus } = useSession();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-950">
      {/* Remote Video (Reader) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteStream && connectionStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900">
            <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-purple-500">
              {reader?.profileImage ? (
                <img 
                  src={reader.profileImage} 
                  alt={reader?.name || 'Reader'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-900">
                  <span className="text-xl font-bold">{reader?.name?.charAt(0) || 'R'}</span>
                </div>
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {reader?.name || 'Your Reader'}
            </h3>
            <p className="text-purple-400 animate-pulse-slow">
              {connectionStatus === 'connecting' 
                ? 'Connecting to your reader...' 
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting, please wait...'
                : 'Waiting for reader to join...'}
            </p>
          </div>
        )}
      </div>

      {/* Local Video (User) */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="w-36 h-48 rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg bg-gray-900">
          {localStream && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              {isVideoOff ? (
                <>
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm text-gray-400">Camera Off</span>
                </>
              ) : (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 border-r-2"></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDisplay;