import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import useMediaDevices from '@/hooks/useMediaDevices';
import LoadingSpinner from '@/components/LoadingSpinner';
import SessionRoom from '@/components/session/SessionRoom';
import PreSession from '@/components/session/PreSession';
import { Reader, UserBalance } from '@/types/types';

export default function SessionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessionId, setSessionId] = useState<string>('');
  const [readerId, setReaderId] = useState<string>('');
  const [reader, setReader] = useState<Reader | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'connecting' | 'connected' | 'ended' | 'error'>('waiting');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const { 
    availableDevices, 
    selectedAudioInput, 
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    localStream,
    mediaPermissionStatus,
    requestMediaPermissions
  } = useMediaDevices();

  // Handle URL parameters and authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(router.asPath));
      return;
    }
    
    if (router.isReady && session) {
      const { readerId: queryReaderId } = router.query;
      
      if (!queryReaderId) {
        setError('Missing reader ID');
        setLoading(false);
        return;
      }
      
      setReaderId(queryReaderId as string);
      
      // Generate a session ID if we don't have one yet
      if (!sessionId) {
        setSessionId(uuidv4());
      }
      
      loadInitialData(queryReaderId as string);
    }
  }, [router.isReady, router.query, session, status]);

  // Load reader details and user balance
  const loadInitialData = async (selectedReaderId: string) => {
    try {
      // Fetch reader details
      const readerResponse = await fetch(`/api/readers/${selectedReaderId}`);
      if (!readerResponse.ok) {
        throw new Error('Failed to load reader information');
      }
      const readerData = await readerResponse.json();
      setReader(readerData);
      
      // Fetch user balance
      if (session?.user.role === 'user') {
        const balanceResponse = await fetch(`/api/users/${session.user.id}/balance`);
        if (!balanceResponse.ok) {
          throw new Error('Failed to load balance information');
        }
        const balanceData = await balanceResponse.json();
        setUserBalance(balanceData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading session data:', error);
      setError('Failed to load session data. Please try again.');
      setLoading(false);
    }
  };

  // Start a new session
  const startSession = async () => {
    if (!session || !reader || !userBalance) {
      setError('Missing session information');
      return;
    }
    
    if (userBalance.availableBalance < reader.minimumSessionAmount) {
      setError(`Insufficient balance. You need at least $${reader.minimumSessionAmount.toFixed(2)} to start a session.`);
      return;
    }
    
    try {
      setSessionStatus('connecting');
      
      // Create session in the database
      const createResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: session.user.id,
          readerId: reader.id,
        }),
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create session');
      }
      
      // Update status to connected
      setSessionStatus('connected');
    } catch (error) {
      console.error('Failed to start session:', error);
      setSessionStatus('error');
      setError('Failed to start session. Please try again.');
    }
  };

  // End the current session
  const endSession = async (reason?: string) => {
    try {
      // Update session status in the database
      await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      setSessionStatus('ended');
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-5">
                <i className="bi bi-exclamation-circle text-danger fs-1 mb-3"></i>
                <h2 className="mb-3">Session Error</h2>
                <p className="mb-4">{error}</p>
                <Button variant="primary" onClick={() => router.push('/user/dashboard')}>
                  Return to Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!session || !reader) {
    return <LoadingSpinner />;
  }

  if (sessionStatus === 'connected') {
    return (
      <SessionRoom
        sessionId={sessionId}
        userId={session.user.id}
        userName={session.user.name}
        readerId={reader.id}
        readerName={reader.name}
        ratePerMinute={reader.ratePerMinute}
        localStream={localStream}
        initialBalance={userBalance?.availableBalance || 0}
        onEndSession={endSession}
      />
    );
  }

  return (
    <Container className="py-4">
      <PreSession
        reader={reader}
        userBalance={userBalance}
        mediaPermissionStatus={mediaPermissionStatus}
        availableDevices={availableDevices}
        selectedAudioInput={selectedAudioInput}
        selectedVideoInput={selectedVideoInput}
        setSelectedAudioInput={setSelectedAudioInput}
        setSelectedVideoInput={setSelectedVideoInput}
        requestMediaPermissions={requestMediaPermissions}
        startSession={startSession}
        sessionStatus={sessionStatus}
        onCancel={() => router.push('/user/dashboard')}
      />
    </Container>
  );
}