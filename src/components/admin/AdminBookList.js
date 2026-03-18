import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Container, Row, Col, Button, Form, Alert, Spinner, Badge, Modal, Card } from 'react-bootstrap';

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

    // Reviews & Replies state
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resBooks, resCats, resReviews, resUsers] = await Promise.all([
                axios.get(`${API}/books`),
                axios.get(`${API}/categories`),
                axios.get(`${API}/reviews`),
                axios.get(`${API}/users`)
            ]);
            setBooks(resBooks.data);
            setCategories(resCats.data);
            setReviews(resReviews.data);
            setUsers(resUsers.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const groups = books.reduce((acc, book) => {
            const key = `${book.title}_${book.author}`;
            if (!acc[key]) {
                acc[key] = { ...book, quantity: 0, availableCount: 0, damagedCount: 0, lostCount: 0, inventory: [] };
            }
            acc[key].quantity += 1;
            if (book.available && !book.status) { // Only count as available if no specific status (i.e., 'Good')
                acc[key].availableCount += 1;
            }
            if (book.status === 'damaged') {
                acc[key].damagedCount += 1;
            }
            if (book.status === 'lost') {
                acc[key].lostCount += 1;
            }
            // Added 'status' to each inventory item
            acc[key].inventory.push({
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
            if (selectedGroup) {
                const updatedGroup = filteredGroups.find(g => g.title === selectedGroup.title);
                setSelectedGroup(updatedGroup);
            }
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

    const handleSaveReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            const review = reviews.find(r => r.id === reviewId);
            const newReply = {
                id: Date.now(),
                userId: "admin",
                content: replyText,
                createdAt: new Date().toISOString(),
                role: 'admin'
            };
            const updatedReplies = [...(review.replies || []), newReply];

            await axios.put(`${API}/reviews/${reviewId}`, {
                ...review,
                replies: updatedReplies,
                adminReply: replyText, // Compatibility
                repliedAt: new Date().toISOString()
            });
            setReplyText("");
            setReplyingTo(null);
            fetchData();
        } catch (err) { setError('Failed to save reply'); }
    };

    const handleDeleteReview = async (reviewId) => {
        if (window.confirm("Delete this review?")) {
            try {
                await axios.delete(`${API}/reviews/${reviewId}`);
                fetchData();
            } catch (err) { setError('Failed to delete review'); }
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <div className="p-4 bg-transparent">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title mb-1">📖 Manage Books</h1>
                    <p className="text-muted mb-0">Total Books: <strong>{books.length}</strong> | Collection Groups: <strong>{filteredGroups.length}</strong></p>
                </div>
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
                                        <div 
                                            className="position-absolute d-flex flex-column gap-1 align-items-end" 
                                            style={{ top: "10px", right: "10px", padding: 0, zIndex: 10 }}
                                        >
                                            <div className={`p-1 px-2 rounded-2 ${group.availableCount > 0 ? "bg-dark" : "bg-danger"} text-white`} style={{ fontSize: "11px", opacity: 0.9, fontWeight: "700" }}>
                                                {group.availableCount > 0 ? `Available: ${group.availableCount} / ${group.quantity}` : `Qty: 0 / ${group.quantity} (Out of Stock)`}
                                            </div>
                                            {group.damagedCount > 0 && (
                                                <div className="bg-warning text-dark p-1 px-2 rounded-2 d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: "10px", fontWeight: "800" }}>
                                                    ⚠️ DAMAGED: {group.damagedCount}
                                                </div>
                                            )}
                                            {group.lostCount > 0 && (
                                                <div className="bg-danger text-white p-1 px-2 rounded-2 d-flex align-items-center gap-1 shadow-sm" style={{ fontSize: "10px", fontWeight: "800" }}>
                                                    🚨 LOST: {group.lostCount}
                                                </div>
                                            )}
                                        </div>
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
                                </div>
                                <div className="border rounded-3 overflow-hidden shadow-sm">
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <Table hover borderless className="mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="small fw-600 text-muted p-3">Barcode</th>
                                                    <th className="small fw-600 text-muted p-3">Condition</th>
                                                    <th className="small fw-600 text-muted p-3">Availability</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedGroup.inventory.filter(i => i.barcode.toLowerCase().includes(barcodeSearch.toLowerCase())).map(item => (
                                                    <tr key={item.id} className="border-top align-middle">
                                                        <td className="p-3"><code className="text-danger fw-bold">{item.barcode}</code></td>
                                                        <td className="p-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                {item.status === "Good" && <span className="text-success small">✅</span>}
                                                                {item.status === "damaged" && <span className="text-warning small">⚠️</span>}
                                                                {item.status === "lost" && <span className="text-danger small">🚨</span>}
                                                                <small className={`fw-bold ${item.status === 'damaged' ? 'text-warning' : item.status === 'lost' ? 'text-danger' : 'text-muted'}`}>
                                                                    {item.status.toUpperCase()}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge pill bg={item.available && !["damaged", "lost"].includes(item.status) ? "success" : "secondary"} className="px-3" style={{ fontSize: "11px" }}>
                                                                {item.available && !["damaged", "lost"].includes(item.status) ? "IN STOCK" : item.status === "damaged" ? "UNAVAILABLE" : item.status === "lost" ? "MISSING" : "CHECKED OUT"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-3 pt-3 mb-5">
                                <Button variant="warning" className="px-4 fw-bold shadow-sm" style={{ borderRadius: "8px" }} onClick={() => { setEditData(selectedGroup); setShowEditModal(true) }}>Edit Basic Info</Button>
                                <Button variant="danger" className="px-4 fw-bold shadow-sm" style={{ borderRadius: "8px" }} onClick={() => handleDeleteGroup(selectedGroup.title)}>Remove Collection</Button>
                            </div>

                            <hr className="my-5" />

                            <div className="reviews-section">
                                <h5 className="fw-bold mb-4">💬 Customer Reviews for this Group</h5>
                                {(() => {
                                    const groupReviews = reviews.filter(r => selectedGroup.inventory.some(i => String(i.id) === String(r.bookId)));
                                    if (groupReviews.length === 0) return <p className="text-muted fst-italic">No reviews yet for this book collection.</p>;

                                    return groupReviews.reverse().map(rev => {
                                        const user = users.find(u => String(u.id) === String(rev.userId));
                                        return (
                                            <Card key={rev.id} className="border-0 shadow-sm mb-4 rounded-4" style={{ background: "#f8fafc" }}>
                                                <Card.Body className="p-4">
                                                    <div className="d-flex justify-content-between mb-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="me-3">
                                                                <img
                                                                    src={user?.avatar || "https://via.placeholder.com/40"}
                                                                    alt="avatar"
                                                                    className="rounded-circle"
                                                                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold mb-0">{user?.fullName || "Anonymous"}</h6>
                                                                <div className="text-warning small">
                                                                    {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-end">
                                                            <small className="text-muted d-block">{new Date(rev.createdAt).toLocaleDateString()}</small>
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-0 mt-1 small text-decoration-none"
                                                                onClick={() => handleDeleteReview(rev.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-3 rounded-3 border mb-3">
                                                        <p className="mb-0 text-dark">{rev.comment}</p>
                                                    </div>

                                                    {/* Display Replies */}
                                                    {/* Display Replies */}
                                                    <div className="ms-md-4 mt-3 ps-3 border-start border-2 border-light">
                                                        {(rev.replies || []).map(reply => {
                                                            const replyUser = users.find(u => String(u.id) === String(reply.userId));
                                                            const isAdmin = reply.role === 'admin';
                                                            return (
                                                                <div key={reply.id} className={`p-3 rounded-4 mb-2 border-0 shadow-sm ${isAdmin ? 'bg-primary bg-opacity-10 border-start border-4 border-primary' : 'bg-white'}`}>
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <div className="d-flex align-items-center">
                                                                            <Badge bg={isAdmin ? "primary" : "secondary"} className="me-2 rounded-pill px-2" style={{ fontSize: '0.6rem' }}>
                                                                                {isAdmin ? 'ADMIN' : 'USER'}
                                                                            </Badge>
                                                                            <span className="fw-bold small me-2">{isAdmin ? 'System Admin' : (replyUser?.fullName || 'User')}</span>
                                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(reply.createdAt).toLocaleDateString()}</small>
                                                                        </div>
                                                                        {/* Reply Action for Admin */}
                                                                        {!isAdmin && (
                                                                            <Button
                                                                                variant="link"
                                                                                size="sm"
                                                                                className="p-0 text-decoration-none text-primary fw-bold"
                                                                                style={{ fontSize: '0.7rem' }}
                                                                                onClick={() => {
                                                                                    setReplyingTo(rev.id);
                                                                                    const targetName = replyUser?.fullName || "User";
                                                                                    setReplyText(`@${targetName} `);
                                                                                }}
                                                                            >
                                                                                Reply
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    <p className="mb-0 text-dark small">
                                                                        {reply.content.startsWith('@') ? (
                                                                            <>
                                                                                <span className="text-primary fw-600 me-1" style={{ background: 'rgba(13, 110, 253, 0.08)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                                    {reply.content.split(' ')[0]}
                                                                                </span>
                                                                                {reply.content.substring(reply.content.indexOf(' ') + 1)}
                                                                            </>
                                                                        ) : reply.content}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}

                                                        {replyingTo === rev.id ? (
                                                            <div className="bg-white p-3 rounded-4 border shadow-sm mt-3 border-primary">
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={3}
                                                                    placeholder="Write your professional response..."
                                                                    className="mb-2 border-0 bg-light p-3 small rounded-3"
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                    autoFocus
                                                                />
                                                                <div className="d-flex justify-content-end gap-2">
                                                                    <Button size="sm" variant="light" className="rounded-pill px-3 fw-bold" onClick={() => setReplyingTo(null)}>Cancel</Button>
                                                                    <Button size="sm" variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => handleSaveReply(rev.id)}>Send Reply</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 text-end">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="rounded-pill px-4 fw-bold"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    onClick={() => {
                                                                        setReplyingTo(rev.id);
                                                                        const targetName = user?.fullName || "User";
                                                                        setReplyText(`@${targetName} `);
                                                                    }}
                                                                >
                                                                    Add System Reply
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        );
                                    });
                                })()}
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
                <Modal.Header closeButton style={{ background: "#f8fafc" }}><Modal.Title className="fw-bold">Update Book Information</Modal.Title></Modal.Header>
                <Modal.Body className="p-4">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label className="fw-600">Series Name</Form.Label><Form.Control value={editData.series || ''} onChange={(e) => setEditData({ ...editData, series: e.target.value })} /></Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label className="fw-600">Author</Form.Label><Form.Control value={editData.author || ''} onChange={(e) => setEditData({ ...editData, author: e.target.value })} /></Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-600">Category Tag</Form.Label>
                        <Form.Select value={editData.categoryId || ''} onChange={(e) => setEditData({ ...editData, categoryId: e.target.value })}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-0"><Form.Label className="fw-600">Full Description</Form.Label><Form.Control as="textarea" rows={5} value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} /></Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowEditModal(false)} className="px-4">Cancel</Button>
                    <Button variant="primary" onClick={handleSaveEdit} className="px-4 btn-primary">Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AdminBookList;