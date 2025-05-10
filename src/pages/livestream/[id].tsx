import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Reader, Gift } from '@/types/types';

export default function LivestreamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { id } = router.query;
  const [reader, setReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Date;
    isGift?: boolean;
    giftValue?: number;
  }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableGifts, setAvailableGifts] = useState<Gift[]>([]);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Protect route and load data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(router.asPath));
      return;
    }
    
    if (router.isReady && id) {
      fetchReaderData();
      fetchAvailableGifts();
      initializeSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [router.isReady, id, session, status]);

  // Fetch reader data
  const fetchReaderData = async () => {
    try {
      const response = await fetch(`/api/readers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load reader information');
      }
      
      const data = await response.json();
      setReader(data);
      setLoading(false);
      
      // Check if stream is active
      if (!data.isStreaming) {
        router.push('/user/dashboard');
      }
    } catch (error) {
      console.error('Error loading stream data:', error);
      setLoading(false);
      router.push('/user/dashboard');
    }
  };

  // Fetch available gifts
  const fetchAvailableGifts = async () => {
    try {
      const response = await fetch('/api/gifts');
      if (response.ok) {
        const data = await response.json();
        setAvailableGifts(data.gifts);
      }
    } catch (error) {
      console.error('Error loading gifts:', error);
    }
  };

  // Initialize WebSocket connection
  const initializeSocket = () => {
    // We would normally use environment variables for the WebSocket URL
    const wsUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.host}/api/livestream`
      : `ws://localhost:3000/api/livestream`;
    
    const socket = new WebSocket(`${wsUrl}?streamId=${id}&userId=${session?.user.id}`);
    
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
        setChatMessages(prev => [...prev, {
          ...data.message,
          isGift: true
        }]);
        
        // Display gift animation
        showGiftAnimation(data.message.giftName);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    socketRef.current = socket;
  };

  // Send chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socketRef.current) return;
    
    const message = {
      userId: session?.user.id,
      userName: session?.user.name,
      message: newMessage,
      timestamp: new Date()
    };
    
    socketRef.current.send(JSON.stringify({
      type: 'chat',
      message
    }));
    
    setNewMessage('');
  };

  // Send gift
  const sendGift = async (gift: Gift) => {
    if (!socketRef.current) return;
    
    try {
      // Process payment for gift
      const paymentResponse = await fetch('/api/payments/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: gift.id,
          readerId: id,
          amount: gift.value
        }),
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Payment failed');
      }
      
      // If payment successful, send gift message
      const giftMessage = {
        userId: session?.user.id,
        userName: session?.user.name,
        message: `sent a ${gift.name}!`,
        giftName: gift.name,
        giftValue: gift.value,
        timestamp: new Date(),
        isGift: true
      };
      
      socketRef.current.send(JSON.stringify({
        type: 'gift',
        message: giftMessage
      }));
      
      // Close gift menu
      setShowGiftMenu(false);
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift. Please try again.');
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (!reader) {
    return (
      <Container className="py-5 text-center">
        <h2>Stream not found</h2>
        <p>This live stream may have ended or is not available.</p>
        <Button variant="primary" onClick={() => router.push('/user/dashboard')}>
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="px-0 livestream-container">
      <Row className="g-0">
        <Col lg={9} className="stream-video-container">
          <div className="stream-video-wrapper">
            {/* Stream Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="stream-video"
            />
            
            {/* Stream Info Overlay */}
            <div className="stream-info">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <img
                    src={reader.profileImage || '/images/default-profile.jpg'}
                    alt={reader.name}
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                  />
                  <div>
                    <h5 className="mb-0">{reader.name}</h5>
                    <small>{reader.specialty}</small>
                  </div>
                </div>
                <div>
                  <Badge bg="danger" className="me-2">LIVE</Badge>
                  <Badge bg="dark">
                    <i className="bi bi-people-fill me-1"></i>
                    {viewerCount}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Col>
        
        <Col lg={3} className="stream-chat-container">
          <Card className="h-100 border-0 rounded-0">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Live Chat</h5>
            </Card.Header>
            <Card.Body className="p-0 d-flex flex-column">
              {/* Chat Messages */}
              <div 
                className="chat-messages p-3 flex-grow-1 overflow-auto"
                ref={chatContainerRef}
              >
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted my-4">
                    <p>No messages yet</p>
                    <p>Be the first to say hello!</p>
                  </div>
                )}
                
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`chat-message mb-2 ${msg.isGift ? 'gift-message' : ''}`}
                  >
                    <div className="fw-bold">{msg.userName}</div>
                    <div className="d-flex">
                      <div className={msg.isGift ? 'text-primary' : ''}>
                        {msg.message}
                        {msg.isGift && msg.giftValue && (
                          <span className="ms-1 badge bg-primary">${msg.giftValue.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gift Menu */}
              {showGiftMenu && (
                <div className="gift-menu p-2 border-top">
                  <div className="d-flex justify-content-between mb-2">
                    <h6 className="mb-0">Send a Gift</h6>
                    <Button 
                      variant="link" 
                      className="p-0 text-muted" 
                      onClick={() => setShowGiftMenu(false)}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {availableGifts.map(gift => (
                      <Button
                        key={gift.id}
                        variant="outline-primary"
                        className="gift-button"
                        onClick={() => sendGift(gift)}
                      >
                        <div className="gift-icon">
                          {gift.name === 'Star' ? '⭐' : 
                           gift.name === 'Heart' ? '❤️' : 
                           gift.name === 'Crystal Ball' ? '🔮' : '🎁'}
                        </div>
                        <div className="gift-name">{gift.name}</div>
                        <div className="gift-price">${gift.value.toFixed(2)}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Chat Input */}
              <div className="chat-input p-2 border-top">
                <Form onSubmit={sendMessage}>
                  <div className="d-flex">
                    <Button
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => setShowGiftMenu(!showGiftMenu)}
                    >
                      <i className="bi bi-gift"></i>
                    </Button>
                    <Form.Control
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" className="ms-2">
                      <i className="bi bi-send"></i>
                    </Button>
                  </div>
                </Form>
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
        
        .stream-chat-container {
          height: 100%;
          overflow: hidden;
        }
        
        .chat-messages {
          height: 100%;
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
        
        .gift-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 70px;
          height: 70px;
          padding: 0.5rem;
        }
        
        .gift-icon {
          font-size: 1.5rem;
        }
        
        .gift-name {
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .gift-price {
          font-size: 0.7rem;
          font-weight: bold;
        }
      `}</style>
    </Container>
  );
}