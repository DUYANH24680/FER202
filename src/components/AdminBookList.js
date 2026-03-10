import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';

const API = "http://localhost:9999";

function AdminBookList() {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    
    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCat, setSelectedCat] = useState("");
    
    // Edit States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resBooks, resCats] = await Promise.all([
                axios.get(`${API}/books`),
                axios.get(`${API}/categories`)
            ]);
            setBooks(resBooks.data);
            setFilteredBooks(resBooks.data);
            setCategories(resCats.data);
        } catch (err) {
            setError('Failed to load data from server');
        } finally {
            setLoading(false);
        }
    };

    // Logic: Search by Series, Title, Barcode AND Filter by Category
    useEffect(() => {
        const filtered = books.filter(b => {
            const matchesSearch = 
                b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.series?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCat = selectedCat === "" || Number(b.categoryId) === Number(selectedCat);
            
            return matchesSearch && matchesCat;
        });
        setFilteredBooks(filtered);
    }, [searchTerm, selectedCat, books]);

    const handleOpenEdit = () => {
        setEditData(selectedBook);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`${API}/books/${editData.id}`, editData);
            setShowEditModal(false);
            setSelectedBook(editData); // Update Detail view immediately
            fetchData(); // Refresh main list
        } catch (err) {
            setError('Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Are you sure you want to delete book with Barcode: ${selectedBook.barcode}?`)) {
            try {
                await axios.delete(`${API}/books/${id}`);
                setSelectedBook(null); // Exit detail view
                fetchData();
            } catch (err) {
                setError('Delete failed');
            }
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Manage Books</h2>
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {!selectedBook ? (
                /* GRID VIEW LISTING */
                <>
                    <Row className="mb-4">
                        <Col md={7}>
                            <Form.Control 
                                placeholder="Search by Series, Title, or Barcode..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                        <Col md={5}>
                            <Form.Select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                    <Row>
                        {filteredBooks.map((book) => (
                            <Col md={3} key={book.id} className="mb-4 d-flex">
                                <Card className="w-100 shadow-sm border-0 h-100 card-hover" style={{ cursor: "pointer" }} onClick={() => setSelectedBook(book)}>
                                    <Card.Img variant="top" src={book.image} style={{ height: "260px", objectFit: "cover" }} />
                                    <Card.Body>
                                        <Card.Title style={{ fontSize: "15px", fontWeight: "600", height: "40px", overflow: "hidden" }}>{book.title}</Card.Title>
                                        <Card.Text className="text-muted small mb-1">{book.author}</Card.Text>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <code className="small text-primary">{book.barcode}</code>
                                            <Badge bg={book.available ? "success" : "secondary"}>
                                                {book.available ? "Available" : "Borrowed"}
                                            </Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            ) : (
                /* FULL DETAIL VIEW */
                <Row className="align-items-start bg-white p-4 rounded shadow-sm border">
                    <Col md={5}>
                        <img src={selectedBook.image} alt={selectedBook.title} className="w-100 rounded shadow" style={{ maxHeight: '500px', objectFit: 'contain' }} />
                    </Col>
                    <Col md={7}>
                        <Button variant="outline-secondary" className="float-end" onClick={() => setSelectedBook(null)}>Back to List</Button>
                        <h3 className="mb-3 text-primary">{selectedBook.title}</h3>
                        
                        <Row className="mb-2">
                            <Col xs={4}><strong>Series:</strong></Col>
                            <Col>{selectedBook.series || "N/A"}</Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={4}><strong>Author:</strong></Col>
                            <Col>{selectedBook.author}</Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={4}><strong>Barcode:</strong></Col>
                            <Col><code className="bg-dark text-white px-2 py-1 rounded">{selectedBook.barcode}</code></Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={4}><strong>Category:</strong></Col>
                            <Col>{categories.find(c => Number(c.id) === Number(selectedBook.categoryId))?.name || "N/A"}</Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={4}><strong>Status:</strong></Col>
                            <Col>{selectedBook.status || "Good"}</Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={4}><strong>Description:</strong></Col>
                            <Col>{selectedBook.description || "No description available."}</Col>
                        </Row>
                        <Row className="mb-3">
                            <Col xs={4}><strong>Available:</strong></Col>
                            <Col>{selectedBook.available ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</Col>
                        </Row>
                        
                        <div className="mt-4 border-top pt-3">
                            <Button variant="warning" className="me-3 px-4 fw-bold" onClick={handleOpenEdit}>Edit Book</Button>
                            <Button variant="danger" className="px-4 fw-bold" onClick={() => handleDelete(selectedBook.id)}>Delete Book</Button>
                        </div>
                    </Col>
                </Row>
            )}

            {/* EDIT MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>Edit Item: {selectedBook?.barcode}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label className="fw-bold">Series</Form.Label>
                                <Form.Control value={editData.series || ''} onChange={(e) => setEditData({...editData, series: e.target.value})} />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-bold">Barcode</Form.Label>
                                <Form.Control value={editData.barcode || ''} onChange={(e) => setEditData({...editData, barcode: e.target.value})} />
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Title</Form.Label>
                            <Form.Control value={editData.title || ''} onChange={(e) => setEditData({...editData, title: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={editData.description || ''} onChange={(e) => setEditData({...editData, description: e.target.value})} />
                        </Form.Group>
                        <Form.Check 
                            type="switch"
                            id="available-switch"
                            label="Available for Borrow" 
                            checked={editData.available || false} 
                            onChange={(e) => setEditData({...editData, available: e.target.checked})} 
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default AdminBookList;