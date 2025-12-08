import { Container, Row, Col, Button } from "react-bootstrap";

function Home() {
  return (
    <Container fluid className="py-5 px-0">
      <Row className="align-items-center">
        <Col md={6}>
          <h1 className="fw-bold">Welcome to EduMate</h1>
          <p className="lead text-muted">
            Personalized AI-powered learning designed to help students succeed.
          </p>
          <Button variant="primary" size="lg">Get Started</Button>
        </Col>

        <Col md={6} className="text-center">
          <img
            src="https://placehold.co/450x300"
            alt="EduMate Preview"
            className="img-fluid rounded shadow"
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
