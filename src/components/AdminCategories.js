import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Form,
  Modal,
  Container,
  Row,
  Col,
  Card,
  Badge
} from "react-bootstrap";

const API = "http://localhost:9999";

function AdminCategories() {

  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);

  const [showCategory, setShowCategory] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const [name, setName] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data);
  };

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  // ADD CATEGORY
  const handleAddCategory = async () => {

    if (!name.trim()) {
      alert("Please enter category name");
      return;
    }

    const maxId =
      categories.length > 0
        ? Math.max(...categories.map((c) => Number(c.id)))
        : 0;

    const newId = String(maxId + 1);

    await axios.post(`${API}/categories`, {
      id: newId,
      name: name
    });

    setName("");
    setShowCategory(false);
    fetchCategories();
  };

  // ASSIGN BOOK
  const handleAssignBook = async () => {

    if (!selectedBook || !selectedCategory) {
      alert("Please select book and category");
      return;
    }

    const book = books.find(
      (b) => String(b.id) === String(selectedBook)
    );

    await axios.put(`${API}/books/${selectedBook}`, {
      ...book,
      categoryId: String(selectedCategory)
    });

    setShowAssign(false);
    setSelectedBook("");
    setSelectedCategory("");

    fetchBooks();
  };

  // DELETE CATEGORY
  const handleDelete = async (id) => {

    const used = books.some(
      (b) => String(b.categoryId) === String(id)
    );

    if (used) {
      alert("Cannot delete! Category is used by a book.");
      return;
    }

    if (!window.confirm("Delete this category?")) return;

    await axios.delete(`${API}/categories/${id}`);
    fetchCategories();
  };

  return (

    <Container fluid className="p-4">

      {/* HEADER */}

      <div
        style={{
          background: "linear-gradient(90deg,#4facfe,#00f2fe)",
          borderRadius: "10px",
          padding: "20px",
          color: "white",
          marginBottom: "25px"
        }}
      >
        <h2>📚 Category Management</h2>
        <p style={{marginBottom:0}}>
          Manage all book categories in the system
        </p>
      </div>

      {/* STATS */}

      <Row className="mb-4">

        <Col md={6}>

          <Card className="shadow border-0">
            <Card.Body>

              <h6>Total Categories</h6>

              <h3>
                <Badge bg="primary">
                  {categories.length}
                </Badge>
              </h3>

            </Card.Body>
          </Card>

        </Col>

        <Col md={6}>

          <Card className="shadow border-0">
            <Card.Body>

              <h6>Total Books</h6>

              <h3>
                <Badge bg="success">
                  {books.length}
                </Badge>
              </h3>

            </Card.Body>
          </Card>

        </Col>

      </Row>

      {/* MAIN CARD */}

      <Card className="shadow border-0">

        <Card.Body>

          <div className="d-flex justify-content-between mb-3">

            <Button
              variant="primary"
              onClick={() => setShowCategory(true)}
            >
              ➕ Add Category
            </Button>

            <Button
              variant="success"
              onClick={() => setShowAssign(true)}
            >
              📖 Assign Book
            </Button>

          </div>

          <Table
            hover
            bordered
            responsive
            className="align-middle"
          >

            <thead className="table-dark">

              <tr>
                <th style={{width:"80px"}}>ID</th>
                <th>Name</th>
                <th style={{width:"150px"}}>Action</th>
              </tr>

            </thead>

            <tbody>

              {categories.map((c) => (

                <tr key={c.id}>

                  <td>
                    <Badge bg="secondary">
                      {c.id}
                    </Badge>
                  </td>

                  <td className="fw-semibold">
                    {c.name}
                  </td>

                  <td>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      🗑 Delete
                    </Button>

                  </td>

                </tr>

              ))}

            </tbody>

          </Table>

        </Card.Body>

      </Card>

      {/* ADD CATEGORY */}

      <Modal show={showCategory} onHide={() => setShowCategory(false)} centered>

        <Modal.Header closeButton>
          <Modal.Title>Add Category</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form.Control
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setShowCategory(false)}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleAddCategory}
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>

      {/* ASSIGN BOOK */}

      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>

        <Modal.Header closeButton>
          <Modal.Title>Assign Book</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          <Form.Label>Select Book</Form.Label>

          <Form.Select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
          >
            <option value="">Choose book</option>

            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}

          </Form.Select>

          <Form.Label className="mt-3">
            Select Category
          </Form.Label>

          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Choose category</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}

          </Form.Select>

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setShowAssign(false)}
          >
            Cancel
          </Button>

          <Button
            variant="success"
            onClick={handleAssignBook}
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>

    </Container>
  );
}

export default AdminCategories;