import { Container, Row, Col } from 'react-bootstrap';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="mb-3 mb-md-0">
            <Link href="/" className="text-decoration-none">
              <div className="d-flex align-items-center">
                <img
                  src="/images/logo.png"
                  width="40"
                  height="40"
                  className="me-2"
                  alt="SoulSeer Logo"
                />
                <span className="fs-4 text-light">SoulSeer</span>
              </div>
            </Link>
            <p className="text-muted mt-2 mb-0">
              Connect with gifted psychics for guidance
            </p>
          </Col>
          
          <Col md={4} className="text-md-center mb-3 mb-md-0">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li>
                <Link href="/" className="text-decoration-none text-muted">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-decoration-none text-muted">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-decoration-none text-muted">
                  Contact
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col md={4} className="text-md-end">
            <h5>Connect With Us</h5>
            <div className="d-flex justify-content-md-end">
              <a href="#" className="text-light me-3 fs-5">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-light me-3 fs-5">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-light me-3 fs-5">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" className="text-light fs-5">
                <i className="bi bi-youtube"></i>
              </a>
            </div>
            <p className="text-muted mt-2 mb-0">
              © {new Date().getFullYear()} SoulSeer. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}