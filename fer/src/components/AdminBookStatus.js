import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Badge } from "react-bootstrap";

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
    <div>
      <h2>Manage Book Status</h2>

      <Table bordered>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {books.map(book => (
            <tr key={book.id}>
              <td>{book.title}</td>
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
                <Button
                  size="sm"
                  onClick={() =>
                    updateBook(book, { available: !book.available })
                  }
                >
                  Toggle
                </Button>{" "}
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() =>
                    updateBook(book, { status: "damaged", available: false })
                  }
                >
                  Damaged
                </Button>{" "}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    updateBook(book, { status: "lost", available: false })
                  }
                >
                  Lost
                </Button>{" "}
                <Button
                  size="sm"
                  variant="secondary"
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
    </div>
  );
}

export default AdminBookStatus;