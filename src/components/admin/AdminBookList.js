import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge, ListGroup, Modal } from 'react-bootstrap';

const API = "http://localhost:9999";

function AdminBookList() {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCat, setSelectedCat] = useState("");
    const [barcodeSearch, setBarcodeSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});

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
            setCategories(resCats.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const groups = books.reduce((acc, book) => {
            const title = book.title;
            if (!acc[title]) {
                acc[title] = { ...book, quantity: 0, inventory: [] };
            }
            acc[title].quantity += 1;
            // Added 'status' to each inventory item
            acc[title].inventory.push({ 
                id: book.id, 
                barcode: book.barcode, 
                available: book.available,
                status: book.status || "Good" 
            });
            return acc;
        }, {});

        const groupedArray = Object.values(groups).filter(group => {
            const matchesSearch = group.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 group.author.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = selectedCat === "" || Number(group.categoryId) === Number(selectedCat);
            return matchesSearch && matchesCat;
        });
        setFilteredGroups(groupedArray);
    }, [searchTerm, selectedCat, books]);

    const toggleStatus = async (item) => {
        try {
            await axios.patch(`${API}/books/${item.id}`, { available: !item.available });
            await fetchData();
            const updatedGroup = filteredGroups.find(g => g.title === selectedGroup.title);
            setSelectedGroup(updatedGroup);
        } catch (err) { setError('Update failed'); }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm("Delete this barcode copy?")) {
            try {
                await axios.delete(`${API}/books/${id}`);
                await fetchData();
                setSelectedGroup(null);
            } catch (err) { setError('Delete failed'); }
        }
    };

    const handleDeleteGroup = async (title) => {
        if (window.confirm(`Delete all copies of "${title}"?`)) {
            try {
                const targets = books.filter(b => b.title === title);
                await Promise.all(targets.map(b => axios.delete(`${API}/books/${b.id}`)));
                setSelectedGroup(null);
                fetchData();
            } catch (err) { setError('Delete failed'); }
        }
    };

    const handleSaveEdit = async () => {
        try {
            const targets = books.filter(b => b.title === selectedGroup.title);
            await Promise.all(targets.map(b => axios.patch(`${API}/books/${b.id}`, {
                series: editData.series,
                author: editData.author,
                description: editData.description,
                categoryId: editData.categoryId
            })));
            setShowEditModal(false);
            setSelectedGroup(null);
            fetchData();
        } catch (err) { setError('Update failed'); }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Manage Books</h2>
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {!selectedGroup ? (
                <>
                    <Row className="mb-4">
                        <Col md={7}><Form.Control placeholder="Search by title or author..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></Col>
                        <Col md={5}><Form.Select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select></Col>
                    </Row>
                    <Row>
                        {filteredGroups.map(group => (
                            <Col md={3} key={group.title} className="mb-4">
                                <Card className="h-100 shadow-sm border-0" onClick={() => setSelectedGroup(group)} style={{cursor:'pointer'}}>
                                    <Card.Img variant="top" src={group.image} style={{height:'260px', objectFit:'cover'}} />
                                    <Card.Body>
                                        <Card.Title className="small fw-bold">{group.title}</Card.Title>
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <span className="small text-muted">Qty: <strong>{group.quantity}</strong></span>
                                            <Badge bg="info">Details</Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            ) : (
                <div className="bg-white p-4 rounded shadow-sm border">
                    <Row className="align-items-start">
                        <Col md={4} className="text-center">
                            <img src={selectedGroup.image} alt="book" className="w-100 rounded shadow mb-3" style={{maxHeight: '400px', objectFit: 'contain'}} />
                            <Button variant="outline-secondary" className="w-100" onClick={() => setSelectedGroup(null)}>Back to List</Button>
                        </Col>
                        <Col md={8}>
                            <h3 className="text-primary fw-bold">{selectedGroup.title}</h3>
                            <p className="mb-2"><strong>Series:</strong> {selectedGroup.series || "N/A"} | <strong>Author:</strong> {selectedGroup.author}</p>
                            <p className="mb-2"><strong>Category:</strong> {categories.find(c => Number(c.id) === Number(selectedGroup.categoryId))?.name || "N/A"}</p>
                            
                            {/* REMOVED GENERAL STATUS HERE */}

                            <div className="bg-light p-3 rounded mb-3 border">
                                <strong>Description:</strong>
                                <p className="mb-0 small text-muted mt-1">{selectedGroup.description || "No description available."}</p>
                            </div>
                            
                            <hr />
                            
                            <h5>Barcode List ({selectedGroup.quantity} copies)</h5>
                            <Form.Control size="sm" placeholder="Find barcode..." className="mb-2" value={barcodeSearch} onChange={(e)=>setBarcodeSearch(e.target.value)} />
                            <ListGroup style={{maxHeight:'180px', overflowY:'auto'}} className="mb-3 border">
                                {selectedGroup.inventory.filter(i => i.barcode.toLowerCase().includes(barcodeSearch.toLowerCase())).map(item => (
                                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <code className="text-danger fw-bold">{item.barcode}</code>
                                            <small className="ms-3 text-muted">Status: {item.status}</small>
                                        </div>
                                        <div>
                                            <Button variant={item.available ? "success" : "secondary"} size="sm" className="me-2 py-0 px-2" onClick={()=>toggleStatus(item)}>
                                                {item.available ? "Available" : " Not Available"}
                                            </Button>
                                            <Button variant="link" className="text-danger p-0 text-decoration-none small" onClick={()=>handleDeleteItem(item.id)}>Delete</Button>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                            
                            <div className="d-flex gap-2">
                                <Button variant="warning" className="fw-bold px-4" onClick={()=>{setEditData(selectedGroup); setShowEditModal(true)}}>Edit Group</Button>
                                <Button variant="danger" className="fw-bold px-4" onClick={()=>handleDeleteGroup(selectedGroup.title)}>Delete Group</Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <Modal show={showEditModal} onHide={()=>setShowEditModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Edit Group Information</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3"><Form.Label>Series</Form.Label><Form.Control value={editData.series || ''} onChange={(e)=>setEditData({...editData, series: e.target.value})} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Author</Form.Label><Form.Control value={editData.author || ''} onChange={(e)=>setEditData({...editData, author: e.target.value})} /></Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select value={editData.categoryId || ''} onChange={(e)=>setEditData({...editData, categoryId: e.target.value})}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={4} value={editData.description || ''} onChange={(e)=>setEditData({...editData, description: e.target.value})} /></Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={()=>setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default AdminBookList;