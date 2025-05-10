import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import LoadingSpinner from '@/components/LoadingSpinner';
import useMediaDevices from '@/hooks/useMediaDevices';

export default function ReaderStreamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [recentGifts, setRecentGifts] = useState<{
    id: string;
    userName: string;
    giftName: string;
    giftValue: number;
    timestamp: Date;
  }[]>([]);
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Date;
    isGift?: boolean;
  }[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    localStream,
    mediaPermissionStatus,
    requestMediaPermissions
  } = useMediaDevices();
  
  // Protect route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/reader/stream');
    } else if (session && session.user.role !== 'reader') {
      router.push('/user/dashboard');
    } else if (status === 'authenticated') {
      checkStreamStatus();
    }
  }, [session, status, router]);

  // Check if stream is active
  const checkStreamStatus = async () => {
    try {
      const response = await fetch(`/api/readers/${session?.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reader profile');
      }
      
      const data = await response.json();
      
      if (data.isStreaming) {
        setStreamActive(true);
        initializeSocket();
        
        // If we have permissions, request video preview
        if (mediaPermissionStatus === 'granted') {
          setupVideoPreview();
        }
      } else {
        router.push('/reader/dashboard');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking stream status:', error);
      setLoading(false);
    }
  };

  // Initialize socket connection
  const initializeSocket = () => {
    // We would normally use environment variables for the WebSocket URL
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/api/livestream`
      : `ws://localhost:3000/api/livestream`;
    
    const socket = new WebSocket(`${wsUrl}?streamId=${session?.user.id}&isReader=true`);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'viewerCount') {
        setViewerCount(data.count);
      }
      else if (data.type === 'chat') {
        setChatMessages(prev => [...prev, data.message]);
      }
      else if (data.type === 'gift') {
        // Add to chat messages
        setChatMessages(prev => [...prev, {
          ...data.message,
          isGift: true
        }]);
        
        // Add to recent gifts
        setRecentGifts(prev => [
          {
            id: data.message.id || Date.now().toString(),
            userName: data.message.userName,
            giftName: data.message.giftName,
            giftValue: data.message.giftValue,
            timestamp: new Date(data.message.timestamp)
          },
          ...prev.slice(0, 9) // Keep only most recent 10
        ]);
        
        // Update earnings
        setEarnings(prev => prev + data.message.giftValue);
        
        // Show gift animation
        showGiftAnimation(data.message.giftName);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    socketRef.current = socket;
  };

  // Setup video preview
  const setupVideoPreview = () => {
    if (videoPreviewRef.current && localStream) {
      videoPreviewRef.current.srcObject = localStream;
    }
  };

  // Show gift animation
  const showGiftAnimation = (giftName: string) => {
    // Create and animate gift element
    const giftElement = document.createElement('div');
    giftElement.className = 'gift-animation';
    giftElement.innerText = giftName === 'Star' ? '⭐' : 
                           giftName === 'Heart' ? '❤️' : 
                           giftName === 'Crystal Ball' ? '🔮' : '🎁';
    
    document.body.appendChild(giftElement);
    
    // Use random position
    const randomX = Math.random() * (window.innerWidth - 100);
    giftElement.style.left = `${randomX}px`;
    
    // Animate rising
    let pos = window.innerHeight;
    const interval = setInterval(() => {
      if (pos < -100) {
        clearInterval(interval);
        document.body.removeChild(giftElement);
      } else {
        pos -= 5;
        giftElement.style.top = `${pos}px`;
      }
    }, 20);
  };

  // End the stream
  const endStream = async () => {
    try {
      if (confirm('Are you sure you want to end your stream?')) {
        const response = await fetch(`/api/readers/${session?.user.id}/stream`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isStreaming: false }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to end stream');
        }
        
        // Close socket
        if (socketRef.current) {
          socketRef.current.close();
        }
        
        // Redirect to dashboard
        router.push('/reader/dashboard');
      }
    } catch (error) {
      console.error('Error ending stream:', error);
      alert('Failed to end your stream. Please try again.');
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Setup video preview when localStream is available
  useEffect(() => {
    if (streamActive && localStream) {
      setupVideoPreview();
    }
  }, [streamActive, localStream]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (mediaPermissionStatus === 'denied') {
    return (
      <Container className="py-5">
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5">
            <i className="bi bi-camera-video-off fs-1 text-danger mb-3"></i>
            <h2 className="mb-3">Camera Access Required</h2>
            <p className="mb-4">
              You need to allow camera and microphone access to start a live stream.
              Please check your browser settings and try again.
            </p>
            <Button variant="primary" onClick={() => router.push('/reader/dashboard')}>
              Return to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (mediaPermissionStatus === 'prompt') {
    return (
      <Container className="py-5">
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5">
            <i className="bi bi-camera-video fs-1 text-primary mb-3"></i>
            <h2 className="mb-3">Camera Permission Needed</h2>
            <p className="mb-4">
              To start streaming, we need access to your camera and microphone.
            </p>
            <Button variant="primary" onClick={requestMediaPermissions}>
              Allow Camera Access
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0 livestream-container">
      <Row className="g-0">
        <Col lg={9} className="stream-video-container">
          <div className="stream-video-wrapper">
            {/* Stream Video Preview */}
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="stream-video"
            />
            
            {/* Stream Info Overlay */}
            <div className="stream-info">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg="danger">LIVE</Badge>
                  <Badge bg="dark" className="ms-2">
                    <i className="bi bi-people-fill me-1"></i>
                    {viewerCount}
                  </Badge>
                </div>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={endStream}
                >
                  End Stream
                </Button>
              </div>
            </div>
          </div>
        </Col>
        
        <Col lg={3} className="stream-sidebar">
          <Card className="h-100 border-0 rounded-0">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Stream Dashboard</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Stream Stats */}
              <div className="p-3 border-bottom">
                <h6>Stream Statistics</h6>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="text-muted">Viewers</div>
                    <div className="fs-4">{viewerCount}</div>
                  </div>
                  <div>
                    <div className="text-muted">Earnings</div>
                    <div className="fs-4 text-success">${earnings.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              {/* Recent Gifts */}
              <div className="p-3 border-bottom">
                <h6>Recent Gifts</h6>
                {recentGifts.length === 0 ? (
                  <p className="text-muted small">No gifts received yet</p>
                ) : (
                  <div className="recent-gifts">
                    {recentGifts.map((gift) => (
                      <div key={gift.id} className="gift-item d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <div className="fw-bold">{gift.userName}</div>
                          <div className="small text-muted">
                            {gift.giftName} • {new Date(gift.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-success fw-bold">
                          ${gift.giftValue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Chat Messages */}
              <div className="h-100">
                <h6 className="p-3 mb-0 border-bottom">Live Chat</h6>
                <div 
                  className="chat-messages p-3 overflow-auto"
                  ref={chatContainerRef}
                  style={{ maxHeight: '300px' }}
                >
                  {chatMessages.length === 0 ? (
                    <p className="text-muted small">No messages yet</p>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`chat-message mb-2 ${msg.isGift ? 'gift-message' : ''}`}
                      >
                        <div className="fw-bold">{msg.userName}</div>
                        <div>{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .livestream-container {
          height: calc(100vh - 56px);
        }
        
        .stream-video-container {
          height: 100%;
          background-color: #000;
        }
        
        .stream-video-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .stream-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .stream-info {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
          color: white;
        }
        
        .stream-sidebar {
          height: 100%;
          overflow: hidden;
        }
        
        .gift-message {
          font-weight: bold;
          color: #6f42c1;
        }
        
        .gift-animation {
          position: fixed;
          font-size: 2rem;
          z-index: 1000;
          animation: float 3s ease-out;
        }
        
        @keyframes float {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          20% {
            transform: scale(1.5);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </Container>
  );
}