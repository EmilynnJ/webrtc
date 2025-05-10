import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form } from 'react-bootstrap';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ReaderProfile, Session } from '@/types/types';

export default function ReaderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [readerProfile, setReaderProfile] = useState<ReaderProfile | null>(null);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');

  // Protect route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/reader/dashboard');
    } else if (session && session.user.role === 'user') {
      router.push('/user/dashboard');
    }
  }, [session, status, router]);

  // Load reader data
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'reader') {
      const fetchData = async () => {
        try {
          // Fetch reader profile
          const profileResponse = await fetch(`/api/readers/${session.user.id}`);
          const profileData = await profileResponse.json();
          
          if (profileResponse.ok) {
            setReaderProfile(profileData);
            setIsOnline(profileData.status === 'online');
            setIsStreaming(!!profileData.isStreaming);
            setStreamTitle(profileData.streamTitle || '');
          }
          
          // Fetch past sessions
          const sessionsResponse = await fetch(`/api/readers/${session.user.id}/sessions`);
          const sessionsData = await sessionsResponse.json();
          
          if (sessionsResponse.ok) {
            setPastSessions(sessionsData.sessions);
          }
        } catch (error) {
          console.error('Failed to fetch reader data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [session, status]);

  // Update online status
  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      
      const response = await fetch(`/api/readers/${session?.user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus ? 'online' : 'offline' }),
      });
      
      if (!response.ok) {
        // Revert on failure
        setIsOnline(!newStatus);
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update your status. Please try again.');
    }
  };

  // Start/stop streaming
  const toggleStreaming = async () => {
    try {
      const newStreamingState = !isStreaming;
      setIsStreaming(newStreamingState);
      
      if (newStreamingState && !streamTitle.trim()) {
        setStreamTitle('Live Psychic Reading Session');
      }
      
      const response = await fetch(`/api/readers/${session?.user.id}/stream`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isStreaming: newStreamingState,
          streamTitle: streamTitle || 'Live Psychic Reading Session'
        }),
      });
      
      if (!response.ok) {
        // Revert on failure
        setIsStreaming(!newStreamingState);
        throw new Error('Failed to update streaming status');
      }
      
      if (newStreamingState) {
        router.push('/reader/stream');
      }
    } catch (error) {
      console.error('Error updating streaming status:', error);
      alert('Failed to update your streaming status. Please try again.');
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (!session || session.user.role !== 'reader') {
    return null;
  }

  return (
    <Container className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Reader Dashboard</h1>
        </Col>
        <Col xs="auto">
          <Form.Check
            type="switch"
            id="online-status-switch"
            label={isOnline ? "You're Online" : "You're Offline"}
            checked={isOnline}
            onChange={toggleOnlineStatus}
            className="form-switch-lg"
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <img
                  src={readerProfile?.profileImage || '/images/default-profile.jpg'}
                  alt={session.user.name}
                  className="rounded-circle"
                  width="120"
                  height="120"
                  style={{ objectFit: 'cover' }}
                />
                <Badge 
                  bg={isOnline ? 'success' : 'secondary'}
                  className="position-absolute bottom-0 end-0 p-2 rounded-circle"
                >
                  <span className="visually-hidden">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </Badge>
              </div>
              <h3>{session.user.name}</h3>
              <p className="text-muted mb-1">{readerProfile?.specialty || 'Psychic Reader'}</p>
              <p className="text-primary fw-bold mb-3">
                ${readerProfile?.ratePerMinute.toFixed(2) || '0.00'}/min
              </p>
              <div className="d-flex justify-content-center mb-3">
                <div className="text-warning">
                  {/* Star rating */}
                  {Array(5).fill(0).map((_, i) => (
                    <i 
                      key={i} 
                      className={`bi bi-star${i < Math.floor(readerProfile?.rating || 0) ? '-fill' : 
                        i < (readerProfile?.rating || 0) ? '-half' : ''}`}
                    ></i>
                  ))}
                </div>
                <span className="text-muted ms-2">
                  ({readerProfile?.totalReviews || 0} reviews)
                </span>
              </div>
              <div className="mb-3">
                <Button 
                  variant="outline-primary" 
                  href="/reader/profile"
                  className="me-2"
                >
                  Edit Profile
                </Button>
                <Button 
                  variant={isStreaming ? "danger" : "primary"} 
                  onClick={toggleStreaming}
                >
                  {isStreaming ? "End Stream" : "Go Live"}
                </Button>
              </div>
              {!isStreaming && (
                <Form.Group className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Stream Title"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                  />
                </Form.Group>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h4 className="mb-3">Earnings Overview</h4>
              <Row className="g-3">
                <Col md={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="text-center">
                      <h6 className="mb-1">Today</h6>
                      <h3 className="mb-0 text-primary">
                        ${readerProfile?.earnings?.today.toFixed(2) || '0.00'}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="text-center">
                      <h6 className="mb-1">This Week</h6>
                      <h3 className="mb-0 text-primary">
                        ${readerProfile?.earnings?.week.toFixed(2) || '0.00'}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body className="text-center">
                      <h6 className="mb-1">This Month</h6>
                      <h3 className="mb-0 text-primary">
                        ${readerProfile?.earnings?.month.toFixed(2) || '0.00'}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h4 className="mb-3">Recent Sessions</h4>
              {pastSessions.length === 0 ? (
                <p className="text-muted">You haven't completed any sessions yet.</p>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastSessions.map((session) => (
                        <tr key={session.id}>
                          <td>{session.userName}</td>
                          <td>{new Date(session.startTime).toLocaleDateString()}</td>
                          <td>{Math.round(session.duration / 60)} minutes</td>
                          <td>${session.amountCharged.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}