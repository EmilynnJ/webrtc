import { useEffect, useRef } from 'react';

interface VideoDisplayProps {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  readerName: string;
  connectionState: string;
}

export default function VideoDisplay({
  remoteStream,
  localStream,
  readerName,
  connectionState
}: VideoDisplayProps) {
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
    <div className="position-relative h-100 w-100">
      {/* Remote video (big) */}
      <div className="position-absolute inset-0 h-100 w-100 bg-black">
        {remoteStream && connectionState === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-100 w-100 object-cover"
          />
        ) : (
          <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-white">
            <div className="mb-3">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                <i className="bi bi-person-fill text-primary" style={{ fontSize: '48px' }}></i>
              </div>
            </div>
            <h3>{readerName}</h3>
            <p className="text-muted">
              {connectionState === 'connecting' ? (
                <>
                  <span className="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  Connecting...
                </>
              ) : connectionState === 'disconnected' ? (
                'Disconnected. Trying to reconnect...'
              ) : (
                'Waiting for reader to join...'
              )}
            </p>
          </div>
        )}
      </div>
      
      {/* Local video (small) */}
      <div className="position-absolute bottom-4 end-4 shadow-lg" style={{ width: '160px', height: '120px', zIndex: 10 }}>
        <div className="h-100 w-100 rounded overflow-hidden border border-white">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-100 w-100 object-cover"
            />
          ) : (
            <div className="h-100 w-100 bg-dark d-flex align-items-center justify-content-center text-white">
              <i className="bi bi-camera-video-off"></i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}