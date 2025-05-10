import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Reader, UserBalance } from '@/types/types';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);

  // Protect route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/user/dashboard');
    } else if (session && session.user.role === 'reader') {
      router.push('/reader/dashboard');
    }
  }, [session, status, router]);

  // Load available readers and user balance
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'user') {
      const fetchData = async () => {
        try {
          // Fetch readers
          const readersResponse = await fetch('/api/readers');
          const readersData = await readersResponse.json();
          
          if (readersResponse.ok) {
            setReaders(readersData.readers);
          }
          
          // Fetch user balance
          const balanceResponse = await fetch(`/api/users/${session.user.id}/balance`);
          const balanceData = await balanceResponse.json();
          
          if (balanceResponse.ok) {
            setUserBalance(balanceData);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (!session || session.user.role !== 'user') {
    return null;
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Welcome, {session.user.name}</h1>
        </Col>
        <Col xs="auto">
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div>
                <h6 className="mb-0">Current Balance</h6>
                <h3 className="mb-0 text-primary">
                  ${userBalance?.availableBalance.toFixed(2) || '0.00'}
                </h3>
              </div>
              <Button variant="outline-primary" size="sm" className="ms-3">
                Add Funds
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h4 className="mb-3">Available Readers</h4>
              
              {readers.length === 0 ? (
                <p className="text-muted">No readers are currently available. Please check back later.</p>
              ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                  {readers.map((reader) => (
                    <Col key={reader.id}>
                      <Card className="h-100 reader-card border-0 shadow-sm">
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                            src={reader.profileImage || '/images/default-profile.jpg'}
                            alt={reader.name}
                            style={{ height: '160px', objectFit: 'cover' }}
                          />
                          <Badge 
                            bg={reader.status === 'online' ? 'success' : 'secondary'}
                            className="position-absolute top-0 end-0 m-2"
                          >
                            {reader.status === 'online' ? 'Available' : 'Offline'}
                          </Badge>
                        </div>
                        <Card.Body>
                          <Card.Title>{reader.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {reader.specialty}
                          </Card.Subtitle>
                          <div className="d-flex align-items-center mb-2">
                            <div className="text-warning me-1">
                              {/* Star rating */}
                              {Array(5).fill(0).map((_, i) => (
                                <i 
                                  key={i} 
                                  className={`bi bi-star${i < Math.floor(reader.rating) ? '-fill' : 
                                    i < reader.rating ? '-half' : ''}`}
                                ></i>
                              ))}
                            </div>
                            <small className="text-muted ms-1">
                              ({reader.totalReviews})
                            </small>
                          </div>
                          <p className="text-primary fw-bold mb-2">
                            ${reader.ratePerMinute.toFixed(2)}/min
                          </p>
                          <Link 
                            href={`/session?readerId=${reader.id}`}
                            passHref
                          >
                            <Button 
                              variant="primary" 
                              className="w-100"
                              disabled={reader.status !== 'online'}
                            >
                              Start Session
                            </Button>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h4 className="mb-3">Live Streams</h4>
              
              <Row xs={1} md={2} lg={3} className="g-4">
                {readers
                  .filter(reader => reader.isStreaming)
                  .map((reader) => (
                    <Col key={reader.id}>
                      <Card className="h-100 border-0 shadow-sm livestream-card">
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                            src={reader.streamThumbnail || '/images/default-stream.jpg'}
                            alt={`${reader.name}'s stream`}
                            style={{ height: '160px', objectFit: 'cover' }}
                          />
                          <Badge 
                            bg="danger"
                            className="position-absolute top-0 end-0 m-2"
                          >
                            LIVE
                          </Badge>
                          <div className="position-absolute bottom-0 start-0 m-2 bg-dark bg-opacity-75 text-white px-2 py-1 rounded">
                            <small>
                              <i className="bi bi-people-fill me-1"></i>
                              {reader.viewerCount || 0}
                            </small>
                          </div>
                        </div>
                        <Card.Body>
                          <Card.Title>{reader.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {reader.streamTitle || 'Live Reading Session'}
                          </Card.Subtitle>
                          <Link 
                            href={`/livestream/${reader.id}`}
                            passHref
                          >
                            <Button variant="outline-primary" className="w-100">
                              Join Stream
                            </Button>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                  
                {readers.filter(reader => reader.isStreaming).length === 0 && (
                  <Col xs={12}>
                    <p className="text-muted">No live streams available at the moment.</p>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}