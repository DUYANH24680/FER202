import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Table, Container, Card } from "react-bootstrap";

const API = "http://localhost:9999";

function AdminSearchPro() {
  const [books, setBooks] = useState([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  const filtered = books.filter(b =>
    (b.title?.toLowerCase().includes(keyword.toLowerCase()) || '') ||
    (b.author?.toLowerCase().includes(keyword.toLowerCase()) || '')
  );

  return (
    <Container className="mt-4">
      <Card className="shadow">
        <Card.Body>
          <h2 className="fw-bold mb-3">🔎 Advanced Search</h2>

          <Form.Control
            className="mb-3"
            placeholder="Search by title or author..."
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Table striped hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Title</th>
                <th>Author</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td className="fw-semibold">{b.title}</td>
                  <td>{b.author}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminSearchPro;