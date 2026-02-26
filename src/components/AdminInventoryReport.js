import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Card } from "react-bootstrap";

const API = "http://localhost:9999";

function AdminInventoryReport() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  const total = books.length;
  const available = books.filter(b => b.available).length;
  const damaged = books.filter(b => b.status === "damaged").length;
  const lost = books.filter(b => b.status === "lost").length;

  return (
    <Container className="mt-4">
      <h2 className="fw-bold mb-4">📊 Inventory Report</h2>

      <Row>
        <Col md={3}>
          <Card className="text-center shadow border-0 bg-primary text-white">
            <Card.Body>
              <h5>Total Books</h5>
              <h2>{total}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center shadow border-0 bg-success text-white">
            <Card.Body>
              <h5>Available</h5>
              <h2>{available}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center shadow border-0 bg-warning text-dark">
            <Card.Body>
              <h5>Damaged</h5>
              <h2>{damaged}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center shadow border-0 bg-danger text-white">
            <Card.Body>
              <h5>Lost</h5>
              <h2>{lost}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminInventoryReport;