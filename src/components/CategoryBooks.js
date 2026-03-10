import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";

const API = "http://localhost:9999";

function CategoryBooks() {

  const { id } = useParams();

  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortType, setSortType] = useState("");

  useEffect(() => {

    const fetchBooks = async () => {

      const res = await axios.get(`${API}/books`);

      const filtered = res.data.filter(
        (b) => Number(b.categoryId) === Number(id)
      );

      setBooks(filtered);
    };

    fetchBooks();

  }, [id]);

  const sortBooks = (type) => {

    setSortType(type);

    let sorted = [...books];

    if (type === "az") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (type === "za") {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    }

    setBooks(sorted);
  };

  return (

    <Container className="mt-4">

      <h2 className="mb-4">Books</h2>

      {/* SORT */}

      {!selectedBook && (

        <Form.Select
          style={{ width: "200px", marginBottom: "20px" }}
          value={sortType}
          onChange={(e) => sortBooks(e.target.value)}
        >

          <option value="">Sort</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>

        </Form.Select>

      )}

      {/* BOOK DETAIL */}

      {selectedBook ? (

        <Row className="align-items-start">

          <Col md={5}>

            <img
              src={selectedBook.image}
              alt={selectedBook.title}
              style={{
                width: "100%",
                borderRadius: "10px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
              }}
            />

          </Col>

          <Col md={7}>

            <Button
              variant="danger"
              style={{ float: "right" }}
              onClick={() => setSelectedBook(null)}
            >
              X
            </Button>

            <h3 className="mb-3">{selectedBook.title}</h3>

            <p><b>Author:</b> {selectedBook.author}</p>

            <p><b>Description:</b> {selectedBook.description}</p>

            <p><b>Status:</b> {selectedBook.status}</p>

            <p><b>Category ID:</b> {selectedBook.categoryId}</p>

          </Col>

        </Row>

      ) : (

        /* BOOK LIST */

        <Row>

          {books.map((book) => (

            <Col md={3} key={book.id} className="mb-4 d-flex">

              <Card
                className="w-100 shadow-sm"
                style={{
                  cursor: "pointer",
                  borderRadius: "10px",
                  transition: "0.2s"
                }}
                onClick={() => setSelectedBook(book)}
              >

                <Card.Img
                  variant="top"
src={book.image}
                  style={{
                    height: "260px",
                    objectFit: "cover"
                  }}
                />

                <Card.Body>

                  <Card.Title
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      height: "40px",
                      overflow: "hidden"
                    }}
                  >
                    {book.title}
                  </Card.Title>

                  <Card.Text
                    style={{
                      fontSize: "14px",
                      color: "#666"
                    }}
                  >
                    {book.author}
                  </Card.Text>

                </Card.Body>

              </Card>

            </Col>

          ))}

        </Row>

      )}

    </Container>

  );
}

export default CategoryBooks;