import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (session) {
      if (session.user.role === 'reader') {
        router.push('/reader/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [session, router]);

  return (
    <Container className="py-5">
      <Row className="align-items-center mb-5">
        <Col md={6}>
          <h1 className="display-4 mb-3">Connect with Your Spiritual Guide</h1>
          <p className="lead mb-4">
            SoulSeer connects you with talented psychics for personalized 
            readings through secure video, voice, or chat sessions.
          </p>
          {!session && (
            <div className="d-flex gap-3">
              <Link href="/auth/signup" passHref>
                <Button variant="primary" size="lg">Sign Up Free</Button>
              </Link>
              <Link href="/auth/login" passHref>
                <Button variant="outline-primary" size="lg">Login</Button>
              </Link>
            </div>
          )}
        </Col>
        <Col md={6}>
          <div className="p-3 rounded-4 bg-light">
            <img 
              src="/images/hero-image.jpg" 
              alt="Psychic Reading" 
              className="img-fluid rounded-3"
              style={{ opacity: 0.85 }} 
            />
          </div>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col className="text-center">
          <h2 className="mb-4">How It Works</h2>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-search fs-1 text-primary"></i>
              </div>
              <Card.Title>Find Your Reader</Card.Title>
              <Card.Text>
                Browse our diverse community of psychic readers and find the perfect match for your needs.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-camera-video fs-1 text-primary"></i>
              </div>
              <Card.Title>Connect Instantly</Card.Title>
              <Card.Text>
                Start a secure video, voice, or chat session with your chosen reader whenever you need guidance.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-cash-coin fs-1 text-primary"></i>
              </div>
              <Card.Title>Pay Per Minute</Card.Title>
              <Card.Text>
                Only pay for the time you use with our transparent pay-per-minute billing system.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}