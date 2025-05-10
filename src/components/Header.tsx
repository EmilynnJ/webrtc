import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Navbar, Container, Nav, NavDropdown, Button } from 'react-bootstrap';

export default function Header() {
  const { data: session, status } = useSession();
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-0">
      <Container>
        <Link href="/" passHref legacyBehavior>
          <Navbar.Brand>
            <img
              src="/images/logo.png"
              width="30"
              height="30"
              className="d-inline-block align-top me-2"
              alt="SoulSeer Logo"
            />
            SoulSeer
          </Navbar.Brand>
        </Link>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            {status === 'loading' ? (
              <Nav.Item>
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </Nav.Item>
            ) : !session ? (
              <>
                <Link href="/auth/login" passHref legacyBehavior>
                  <Nav.Link>Login</Nav.Link>
                </Link>
                <Link href="/auth/signup" passHref legacyBehavior>
                  <Nav.Link className="ms-2">
                    <Button variant="primary" size="sm">Sign Up</Button>
                  </Nav.Link>
                </Link>
              </>
            ) : (
              <>
                {session.user.role === 'user' ? (
                  <Link href="/user/dashboard" passHref legacyBehavior>
                    <Nav.Link>Dashboard</Nav.Link>
                  </Link>
                ) : (
                  <Link href="/reader/dashboard" passHref legacyBehavior>
                    <Nav.Link>Reader Dashboard</Nav.Link>
                  </Link>
                )}
                
                <NavDropdown title={session.user.name} id="user-dropdown" align="end">
                  <Link href="/profile" passHref legacyBehavior>
                    <NavDropdown.Item>My Profile</NavDropdown.Item>
                  </Link>
                  
                  {session.user.role === 'user' && (
                    <Link href="/user/balance" passHref legacyBehavior>
                      <NavDropdown.Item>Add Funds</NavDropdown.Item>
                    </Link>
                  )}
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={() => signOut({ callbackUrl: '/' })}>
                    Sign Out
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}