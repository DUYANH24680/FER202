import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Badge, Container, Row, Col, Card } from "react-bootstrap";

const API = "http://localhost:9999";

function AdminBookStatus() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  const updateBook = async (book, newData) => {
    await axios.put(`${API}/books/${book.id}`, {
      ...book,
      ...newData
    });
    fetchBooks();
  };

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <h2 className="fw-bold">📦 Manage Book Status</h2>
            </Col>
          </Row>

          <Table striped hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th width="320">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  <td className="fw-semibold">{book.title}</td>
                  <td>
                    {book.status === "lost" && <Badge bg="danger">Lost</Badge>}
                    {book.status === "damaged" && <Badge bg="warning">Damaged</Badge>}
                    {!book.status && book.available && (
                      <Badge bg="success">Available</Badge>
                    )}
                    {!book.status && !book.available && (
                      <Badge bg="secondary">Borrowed</Badge>
                    )}
                  </td>
                  <td>
                    <Button size="sm" className="me-2"
                      onClick={() =>
                        updateBook(book, { available: !book.available })
                      }
                    >
                      Toggle
                    </Button>
                    <Button size="sm" variant="warning" className="me-2"
                      onClick={() =>
                        updateBook(book, { status: "damaged", available: false })
                      }
                    >
                      Damaged
                    </Button>
                    <Button size="sm" variant="danger" className="me-2"
                      onClick={() =>
                        updateBook(book, { status: "lost", available: false })
                      }
                    >
                      Lost
                    </Button>
                    <Button size="sm" variant="secondary"
                      onClick={() =>
                        updateBook(book, { status: null, available: true })
                      }
                    >
                      Reset
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminBookStatus;