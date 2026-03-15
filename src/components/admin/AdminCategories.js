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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const getBookCount = (catId) => {
    return books.filter((b) => String(b.categoryId) === String(catId)).length;
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", padding: "30px" }}>
      
      {/* HEADER BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
          borderRadius: "12px",
          padding: "36px 40px",
          color: "white",
          marginBottom: "30px",
          boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)"
        }}
      >
        <h2 style={{ fontSize: "28px", fontWeight: "700", display: "flex", alignItems: "center", gap: "12px", margin: "0 0 8px 0" }}>
          <span style={{ fontSize: "32px" }}>📚</span> Category Management
        </h2>
        <p style={{ margin: 0, fontSize: "15px", opacity: 0.9 }}>
          Organize and manage your library's literary collections.
        </p>
      </div>

      {/* STATS */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <Card.Body style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                background: "#fef3c7",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px"
              }}>
                <span style={{ color: "#d97706" }}>▲</span>
              </div>
              <div>
                <h6 style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>Total Categories</h6>
                <h3 style={{ margin: 0, fontWeight: "bold", color: "#0f172a", fontSize: "32px" }}>
                  {categories.length}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <Card.Body style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                background: "#dbeafe",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px"
              }}>
                <span style={{ color: "#2563eb" }}>📖</span>
              </div>
              <div>
                <h6 style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>Total Books</h6>
                <h3 style={{ margin: 0, fontWeight: "bold", color: "#0f172a", fontSize: "32px" }}>
                  {books.length}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MAIN CARD (Table Area) */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: "12px", overflow: "hidden" }}>
        
        {/* Header Actions */}
        <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
          <h5 style={{ margin: 0, fontWeight: "bold", color: "#0f172a" }}>Category List</h5>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              style={{ background: "#f97316", border: "none", padding: "8px 20px", fontWeight: "600", borderRadius: "8px" }}
              onClick={() => setShowCategory(true)}
            >
              + Add Category
            </Button>
            <Button
              style={{ background: "#10b981", border: "none", padding: "8px 20px", fontWeight: "600", borderRadius: "8px" }}
              onClick={() => setShowAssign(true)}
            >
              📋 Assign Book
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ background: "white" }}>
          <Table hover responsive style={{ margin: 0 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", width: "120px" }}>ID</th>
                <th style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", padding: "16px 24px", borderBottom: "1px solid #e2e8f0" }}>CATEGORY NAME</th>
                <th style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", width: "180px" }}>BOOK COUNT</th>
                <th style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", width: "100px", textAlign: "right" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {currentCategories.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: "20px 24px", color: "#64748b", verticalAlign: "middle", fontSize: "14px" }}>
                    #CAT-{String(c.id).padStart(3, '0')}
                  </td>
                  <td style={{ padding: "20px 24px", fontWeight: "600", color: "#1e293b", verticalAlign: "middle", fontSize: "15px" }}>
                    {c.name}
                  </td>
                  <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                    <span style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                      {getBookCount(c.id)} Books
                    </span>
                  </td>
                  <td style={{ padding: "20px 24px", verticalAlign: "middle", textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "8px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      title="Delete Category"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Footer info block */}
        <div style={{ padding: "16px 24px", background: "#f8fafc", color: "#64748b", fontSize: "14px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            Showing {categories.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, categories.length)} of {categories.length} categories
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{
                padding: "6px 14px",
                border: "1px solid #e2e8f0",
                background: currentPage === 1 ? "#f1f5f9" : "white",
                color: currentPage === 1 ? "#94a3b8" : "#475569",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "13px"
              }}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  padding: "6px 12px",
                  border: page === currentPage ? "1px solid #ea580c" : "1px solid #e2e8f0",
                  background: page === currentPage ? "#ea580c" : "white",
                  color: page === currentPage ? "white" : "#475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px"
                }}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{
                padding: "6px 14px",
                border: "1px solid #e2e8f0",
                background: currentPage === totalPages || totalPages === 0 ? "#f1f5f9" : "white",
                color: currentPage === totalPages || totalPages === 0 ? "#94a3b8" : "#475569",
                borderRadius: "6px",
                cursor: currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "13px"
              }}
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* ADD CATEGORY MODAL */}
      <Modal show={showCategory} onHide={() => setShowCategory(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e2e8f0" }}>
          <Modal.Title style={{ fontWeight: "bold", fontSize: "18px" }}>Add New Category</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group>
            <Form.Label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Category Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Science Fiction"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "none", padding: "0 24px 24px 24px" }}>
          <Button variant="light" onClick={() => setShowCategory(false)} style={{ fontWeight: "600", borderRadius: "8px", padding: "10px 20px" }}>
            Cancel
          </Button>
          <Button style={{ background: "#f97316", border: "none", fontWeight: "600", borderRadius: "8px", padding: "10px 24px" }} onClick={handleAddCategory}>
            Save Category
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ASSIGN BOOK MODAL */}
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e2e8f0" }}>
          <Modal.Title style={{ fontWeight: "bold", fontSize: "18px" }}>Assign Book to Category</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Select Book</Form.Label>
            <Form.Select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="">Choose a book...</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Select Destination Category</Form.Label>
            <Form.Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="">Choose a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "none", padding: "0 24px 24px 24px" }}>
          <Button variant="light" onClick={() => setShowAssign(false)} style={{ fontWeight: "600", borderRadius: "8px", padding: "10px 20px" }}>
            Cancel
          </Button>
          <Button style={{ background: "#10b981", border: "none", fontWeight: "600", borderRadius: "8px", padding: "10px 24px" }} onClick={handleAssignBook}>
            Assign Book
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default AdminCategories;