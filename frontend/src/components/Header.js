import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

function Header() {
  return (
    <Navbar
      expand="lg"
      style={{ backgroundColor: "#0047AB" }} // ✅ COBALT BLUE
      variant="dark"
    >
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
          EduMate
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="text-white">Home</Nav.Link>
            <Nav.Link as={Link} to="/features" className="text-white">Features</Nav.Link>
            <Nav.Link as={Link} to="/about" className="text-white">About</Nav.Link>
            <Nav.Link as={Link} to="/contact" className="text-white">Contact</Nav.Link>

            <Nav.Link
              as={Link}
              to="/login"
              className="btn btn-light ms-3 px-3 fw-semibold"
              style={{ color: "#0047AB" }}
            >
              Login
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
