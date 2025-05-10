import { Container, Spinner } from 'react-bootstrap';

export default function LoadingSpinner() {
  return (
    <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted">Loading...</p>
    </Container>
  );
}