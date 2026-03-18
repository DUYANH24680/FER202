import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Container, Row, Col, Button, Form, Alert, Spinner, Badge, Modal } from 'react-bootstrap';

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
        <div className="p-4 bg-transparent">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title mb-1">📖 Manage Books</h1>
                    <p className="text-muted mb-0">Total Books: <strong>{books.length}</strong> | Collection Groups: <strong>{filteredGroups.length}</strong></p>
                </div>
                <Button variant="primary" className="btn-primary">
                    + Add New Book
                </Button>
            </div>

            {error && <Alert variant="danger" className="border-0 shadow-sm" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {!selectedGroup ? (
                <>
                    <div className="card-premium p-4 border-0 mb-4" style={{ background: "white" }}>
                        <Row>
                            <Col md={7}>
                                <Form.Group>
                                    <Form.Label className="small fw-600 text-muted">Search Collection</Form.Label>
                                    <Form.Control 
                                        placeholder="Search by title or author..." 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                        className="border-0 bg-light"
                                        style={{ height: "45px", borderRadius: "10px" }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="small fw-600 text-muted">Category Filter</Form.Label>
                                    <Form.Select 
                                        value={selectedCat} 
                                        onChange={(e) => setSelectedCat(e.target.value)}
                                        className="border-0 bg-light"
                                        style={{ height: "45px", borderRadius: "10px" }}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <Row className="g-4">
                        {filteredGroups.map(group => (
                            <Col md={3} xl={2} key={group.title}>
                                <div 
                                    className="card-premium h-100 border-0 p-0 overflow-hidden d-flex flex-column" 
                                    onClick={() => setSelectedGroup(group)} 
                                    style={{ cursor: 'pointer', background: "white" }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <img 
                                            src={group.image} 
                                            alt="book" 
                                            style={{ height: '240px', width: "100%", objectFit: 'cover' }} 
                                        />
                                        <Badge 
                                            className="position-absolute" 
                                            bg="dark" 
                                            style={{ top: "10px", right: "10px", opacity: 0.8 }}
                                        >
                                            Qty: {group.quantity}
                                        </Badge>
                                    </div>
                                    <div className="p-3 flex-grow-1 d-flex flex-column">
                                        <h6 className="fw-bold mb-1 text-truncate" title={group.title}>{group.title}</h6>
                                        <p className="small text-muted mb-3 text-truncate">{group.author}</p>
                                        <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                                            <span className="small fw-600 text-primary">View Details</span>
                                            <span className="text-muted" style={{ fontSize: "18px" }}>→</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </>
            ) : (
                <div className="card-premium p-4 border-0" style={{ background: "white" }}>
                    <div className="mb-4">
                        <Button variant="link" onClick={() => setSelectedGroup(null)} className="text-decoration-none p-0 text-muted fw-500">
                             ← Back to collection
                        </Button>
                    </div>
                    <Row className="g-5">
                        <Col lg={4}>
                            <div className="card-premium p-2 border-0 bg-light shadow-none">
                                <img src={selectedGroup.image} alt="book" className="w-100 rounded" style={{ maxHeight: '500px', objectFit: 'contain' }} />
                            </div>
                        </Col>
                        <Col lg={8}>
                            <div className="mb-4">
                                <Badge bg="primary" className="mb-2" style={{ textTransform: "uppercase", letterSpacing: "1px", padding: "5px 12px" }}>
                                    {categories.find(c => Number(c.id) === Number(selectedGroup.categoryId))?.name || "Uncategorized"}
                                </Badge>
                                <h1 className="fw-bold">{selectedGroup.title}</h1>
                                <p className="lead text-muted">{selectedGroup.author}</p>
                            </div>
                            
                            <div className="mb-4">
                                <h6 className="fw-bold text-uppercase small text-muted mb-2">Description</h6>
                                <p className="text-muted" style={{ lineHeight: "1.6" }}>{selectedGroup.description || "No description provided."}</p>
                            </div>

                            <hr className="my-4 op-10" />
                            
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-bold mb-0">Inventory Copies ({selectedGroup.quantity})</h5>
                                    <Form.Control 
                                        size="sm" 
                                        placeholder="Filter by barcode..." 
                                        className="w-auto border-0 bg-light px-3 py-2" 
                                        style={{borderRadius: "8px"}}
                                        value={barcodeSearch} 
                                        onChange={(e)=>setBarcodeSearch(e.target.value)} 
                                    />
                                </div>
                                <div className="border rounded-3 overflow-hidden shadow-sm">
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table hover borderless className="mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="small fw-600 text-muted p-3">Barcode</th>
                                                    <th className="small fw-600 text-muted p-3">Condition</th>
                                                    <th className="small fw-600 text-muted p-3">Availability</th>
                                                    <th className="small fw-600 text-muted p-3 text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedGroup.inventory.filter(i => i.barcode.toLowerCase().includes(barcodeSearch.toLowerCase())).map(item => (
                                                    <tr key={item.id} className="border-top align-middle">
                                                        <td className="p-3"><code className="text-danger fw-bold">{item.barcode}</code></td>
                                                        <td className="p-3"><small className="text-muted">{item.status}</small></td>
                                                        <td className="p-3">
                                                            <Badge pill bg={item.available ? "success" : "secondary"} className="px-3">
                                                                {item.available ? "In Stock" : "Checked Out"}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-end">
                                                            <div className="d-flex gap-2 justify-content-end">
                                                                <Button 
                                                                    variant="outline-primary" 
                                                                    size="sm" 
                                                                    onClick={()=>toggleStatus(item)}
                                                                    className="border-0 fw-600"
                                                                >
                                                                    Update
                                                                </Button>
                                                                <Button 
                                                                    variant="outline-danger" 
                                                                    size="sm" 
                                                                    onClick={()=>handleDeleteItem(item.id)}
                                                                    className="border-0 fw-600"
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="d-flex gap-3 pt-3">
                                <Button variant="warning" className="px-4 fw-bold shadow-sm" style={{borderRadius: "8px"}} onClick={()=>{setEditData(selectedGroup); setShowEditModal(true)}}>Edit Basic Info</Button>
                                <Button variant="danger" className="px-4 fw-bold shadow-sm" style={{borderRadius: "8px"}} onClick={()=>handleDeleteGroup(selectedGroup.title)}>Remove Collection</Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <Modal show={showEditModal} onHide={()=>setShowEditModal(false)} centered size="lg">
                <Modal.Header closeButton style={{background: "#f8fafc"}}><Modal.Title className="fw-bold">Update Book Information</Modal.Title></Modal.Header>
                <Modal.Body className="p-4">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label className="fw-600">Series Name</Form.Label><Form.Control value={editData.series || ''} onChange={(e)=>setEditData({...editData, series: e.target.value})} /></Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label className="fw-600">Author</Form.Label><Form.Control value={editData.author || ''} onChange={(e)=>setEditData({...editData, author: e.target.value})} /></Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-600">Category Tag</Form.Label>
                        <Form.Select value={editData.categoryId || ''} onChange={(e)=>setEditData({...editData, categoryId: e.target.value})}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-0"><Form.Label className="fw-600">Full Description</Form.Label><Form.Control as="textarea" rows={5} value={editData.description || ''} onChange={(e)=>setEditData({...editData, description: e.target.value})} /></Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={()=>setShowEditModal(false)} className="px-4">Cancel</Button>
                    <Button variant="primary" onClick={handleSaveEdit} className="px-4 btn-primary">Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AdminBookList;