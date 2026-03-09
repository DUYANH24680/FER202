import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Image
} from "react-bootstrap";

const API = "http://localhost:9999";

function AdminInventoryReport() {

  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState(null);

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

  const getFilteredBooks = () => {

    if (filter === "all") return books;

    if (filter === "available")
      return books.filter(b => b.available);

    if (filter === "damaged")
      return books.filter(b => b.status === "damaged");

    if (filter === "lost")
      return books.filter(b => b.status === "lost");

    return [];

  };

  const getStatusBadge = (book) => {

    if (book.status === "lost")
      return <Badge bg="danger">Lost</Badge>;

    if (book.status === "damaged")
      return <Badge bg="warning">Damaged</Badge>;

    if (book.available)
      return <Badge bg="success">Available</Badge>;

    return <Badge bg="secondary">Borrowed</Badge>;

  };

  return (

    <Container className="mt-4">

      <h2 className="fw-bold mb-4">
        📊 Inventory Report
      </h2>

      {/* DASHBOARD */}

      <Row className="mb-4">

        <Col md={3}>
  <Card
    className="text-center shadow border-0 bg-primary text-white"
    style={{ cursor: "pointer" }}
    onClick={() => setFilter("all")}
  >
    <Card.Body>
      <h5>Total Books</h5>
      <h2>{total}</h2>
    </Card.Body>
  </Card>
</Col>

        <Col md={3}>
          <Card
            className="text-center shadow border-0 bg-success text-white"
            style={{ cursor: "pointer" }}
            onClick={() => setFilter("available")}
          >
            <Card.Body>
              <h5>Available</h5>
              <h2>{available}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className="text-center shadow border-0 bg-warning"
            style={{ cursor: "pointer" }}
            onClick={() => setFilter("damaged")}
          >
            <Card.Body>
              <h5>Damaged</h5>
              <h2>{damaged}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className="text-center shadow border-0 bg-danger text-white"
            style={{ cursor: "pointer" }}
            onClick={() => setFilter("lost")}
          >
            <Card.Body>
              <h5>Lost</h5>
              <h2>{lost}</h2>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* BOOK LIST */}

      {filter && (

        <Card className="shadow border-0">

          <Card.Body>

            <h4 className="mb-3">
              Book List
            </h4>

            <Table hover responsive>

              <thead className="table-dark">
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Status Date</th>
                  <th>Comment</th>
                </tr>
              </thead>

              <tbody>

                {getFilteredBooks().map(book => (

                  <tr key={book.id}>

                    <td>
                      <Image
                        src={book.image}
                        width={60}
                        height={80}
                        rounded
                        style={{ objectFit: "cover" }}
                      />
                    </td>

                    <td className="fw-semibold">
                      {book.title}
                    </td>

                    <td>
                      {getStatusBadge(book)}
                    </td>

                    <td>
                      {book.statusDate || "N/A"}
                    </td>

                    <td>
                      {book.comment || "-"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </Table>

          </Card.Body>

        </Card>

      )}

      {/* CSS */}

      <style>{`

        .card:hover {
          transform: translateY(-5px);
          transition: 0.25s;
        }

      `}</style>

    </Container>

  );

}

export default AdminInventoryReport;