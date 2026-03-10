import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  Table,
  Container,
  Card,
  Row,
  Col,
  Image,
  Button,
  Modal
} from "react-bootstrap";

import { useNavigate } from "react-router-dom";

const API = "http://localhost:9999";

function AdminSearchPro() {

  const [books, setBooks] = useState([]);
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("title");

  const [showCategory, setShowCategory] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    try {

      const booksRes = await axios.get(`${API}/books`);
      const seriesRes = await axios.get(`${API}/series`);
      const catRes = await axios.get(`${API}/categories`);

      setBooks(booksRes.data);
      setSeries(seriesRes.data);
      setCategories(catRes.data);

    } catch (err) {

      console.error("Fetch error:", err);

    }

  };

  const getSeriesName = (seriesId) => {

    const s = series.find((x) => x.id === seriesId);

    return s ? s.name : "Unknown";

  };

  const filtered = books.filter((b) => {

    if (!keyword) return true;

    const search = keyword.toLowerCase();

    if (filter === "title") {
      return b.title?.toLowerCase().includes(search);
    }

    if (filter === "author") {
      return b.author?.toLowerCase().includes(search);
    }

    if (filter === "series") {

      const seriesName = getSeriesName(b.seriesId) || "";

      return seriesName.toLowerCase().includes(search);

    }

    return true;

  });

  const openCategory = (id) => {

    setShowCategory(false);

    navigate(`/category/${id}`);

  };

  return (

    <Container className="mt-4">

      <Card className="shadow">

        <Card.Body>

          <h2 className="fw-bold mb-4">🔎 Advanced Search</h2>

          <Row className="mb-3">

            <Col md={8}>

              <Form.Control
                placeholder="Search books..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

            </Col>

            <Col md={2}>

              <Form.Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="series">Series</option>
              </Form.Select>

            </Col>

            <Col md={2}>

              <Button
                variant="dark"
                className="w-100"
                onClick={() => setShowCategory(true)}
              >
                Category
              </Button>

            </Col>

          </Row>

          <Table striped hover responsive>

            <thead className="table-dark">

              <tr>
                <th>Cover</th>
                <th>Title</th>
                <th>Author</th>
                <th>Series</th>

              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 && (

                <tr>
                  <td colSpan="4" className="text-center">
                    No books found
                  </td>
                </tr>

              )}

              {filtered.map((b) => (

                <tr key={b.id}>

                  <td>

                    <Image
                      src={b.image}
                      width={50}
                      height={70}
                      rounded
                    />

                  </td>

                  <td className="fw-semibold">

                    {b.title}

                  </td>

                  <td>

                    {b.author}

                  </td>

                  <td>

                    {getSeriesName(b.seriesId)}

                  </td>

                </tr>

              ))}

            </tbody>

          </Table>

        </Card.Body>

      </Card>

      {/* CATEGORY MODAL */}

      <Modal
        show={showCategory}
        onHide={() => setShowCategory(false)}
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>Select Category</Modal.Title>

        </Modal.Header>

        <Modal.Body>

          <Row>

            {categories.map((cat) => (

              <Col md={6} key={cat.id} className="mb-2">

                <Button
                  variant="outline-dark"
                  className="w-100"
                  onClick={() => openCategory(cat.id)}
                >
                  {cat.name}
                </Button>

              </Col>

            ))}

          </Row>

        </Modal.Body>

      </Modal>

    </Container>

  );

}

export default AdminSearchPro;