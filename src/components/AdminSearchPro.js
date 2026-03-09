import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  Table,
  Container,
  Card,
  Row,
  Col,
  Image
} from "react-bootstrap";

const API = "http://localhost:9999";

function AdminSearchPro() {

  const [books, setBooks] = useState([]);
  const [series, setSeries] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("title");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const booksRes = await axios.get(`${API}/books`);
    const seriesRes = await axios.get(`${API}/series`);

    setBooks(booksRes.data);
    setSeries(seriesRes.data);

  };

  const getSeriesName = (seriesId) => {

    const s = series.find((x) => x.id === seriesId);
    return s ? s.name : "";

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

    if (filter === "category") {
      return b.category?.toLowerCase().includes(search);
    }

    if (filter === "series") {

      const seriesName = getSeriesName(b.seriesId);

      return seriesName?.toLowerCase().includes(search);

    }

    return true;

  });

  return (

    <Container className="mt-4">

      <Card className="shadow">
        <Card.Body>

          <h2 className="fw-bold mb-4">🔎 Advanced Search</h2>

          <Row className="mb-3">

            <Col md={9}>
              <Form.Control
                placeholder="Search books..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </Col>

            <Col md={3}>
              <Form.Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="title">Search by Title</option>
                <option value="author">Search by Author</option>
                <option value="category">Search by Category</option>
                <option value="series">Search by Series</option>
              </Form.Select>
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

                  <td className="fw-semibold">{b.title}</td>

                  <td>{b.author}</td>

                  <td>{getSeriesName(b.seriesId)}</td>

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