// src/components/UserBookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Alert, Form, Row, Col, Badge, Container, Modal, Table } from 'react-bootstrap';
import {
    FaStar, FaRegStar, FaArrowLeft, FaQuoteLeft, FaUserCircle,
    FaCalendarAlt, FaListOl, FaClock, FaMoneyBillWave, FaTrash
} from 'react-icons/fa';

function UserBookDetails({ auth }) {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [groupedInfo, setGroupedInfo] = useState({ available: 0, total: 0, allIds: [] });
    const [message, setMessage] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [rules, setRules] = useState({ maxBorrowDays: 14, maxBooksPerUser: 3, finePerDay: 5000 });
    const [globalActiveCount, setGlobalActiveCount] = useState(0);

    // Review state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    // Borrow state
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [borrowQuantity, setBorrowQuantity] = useState(1);
    const [borrowDays, setBorrowDays] = useState(2);
    const PRICE_PER_DAY = 5000;

    const fetchAll = async () => {
        try {
            const [booksRes, borrowRes, reviewRes, userRes, rulesRes] = await Promise.all([
                axios.get(`http://localhost:9999/books`),
                axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
                axios.get(`http://localhost:9999/reviews`),
                axios.get(`http://localhost:9999/users`),
                axios.get(`http://localhost:9999/settings/1`).catch(() => ({ data: null }))
            ]);

            if (rulesRes.data) {
                setRules(rulesRes.data);
                setBorrowDays(rulesRes.data.maxBorrowDays);
            }

            const currentBook = booksRes.data.find(b => String(b.id) === String(id));
            if (!currentBook) return;

            setBook(currentBook);

            // Group info
            const group = booksRes.data.filter(b => b.title === currentBook.title && b.author === currentBook.author);
            const allIds = group.map(b => String(b.id));
            setGroupedInfo({
                available: group.filter(b => b.available).length,
                total: group.length,
                allIds: allIds
            });

            // Filter reviews for all books in the group
            const groupReviews = reviewRes.data.filter(r => allIds.includes(String(r.bookId)));
            setReviews(groupReviews);

            // Filter my requests for this group
            const activeRequestsForThisBook = borrowRes.data.filter(b => allIds.includes(String(b.bookId)));
            setMyRequests(activeRequestsForThisBook);

            // Global active requests for the user
            const totalActive = borrowRes.data
                .filter(b => b.status === 'pending' || b.status === 'approved')
                .reduce((sum, r) => sum + (r.quantity || 1), 0);
            setGlobalActiveCount(totalActive);

            setUsers(userRes.data);
        } catch (error) {
            setMessage('Failed to load data');
        }
    };

    useEffect(() => {
        fetchAll();
    }, [id, auth.id]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const handleSubmitReview = async () => {
        if (rating === 0) {
            setMessage("Please select a star rating");
            return;
        }

        try {
            const all = await axios.get("http://localhost:9999/reviews");
            const newId = all.data.length > 0 ? (Math.max(...all.data.map(r => Number(r.id))) + 1).toString() : "1";

            await axios.post("http://localhost:9999/reviews", {
                id: newId,
                userId: auth.id,
                bookId: id,
                rating,
                comment,
                createdAt: new Date().toISOString()
            });

            setMessage("Thank you for your review!");
            setRating(0);
            setComment("");
            fetchAll();
        } catch (error) {
            setMessage("Failed to submit review");
        }
    };

    const handleSaveReply = async (reviewId) => {
        if (!replyContent.trim()) return;
        try {
            const review = reviews.find(r => r.id === reviewId);
            const newReply = {
                id: Date.now(),
                userId: auth.id,
                content: replyContent,
                createdAt: new Date().toISOString(),
                role: auth.role
            };
            
            const updatedReplies = [...(review.replies || []), newReply];
            
            await axios.put(`http://localhost:9999/reviews/${reviewId}`, {
                ...review,
                replies: updatedReplies
            });

            setReplyContent("");
            setReplyingTo(null);
            setMessage("Reply posted!");
            fetchAll();
        } catch (error) {
            setMessage("Failed to post reply");
        }
    };

    const handleConfirmBorrow = async () => {
        // Check global limit
        if (globalActiveCount + borrowQuantity > rules.maxBooksPerUser) {
            setMessage(`You can only borrow a total of ${rules.maxBooksPerUser} books at a time. You currently have ${globalActiveCount} active borrow(s).`);
            return;
        }

        // Check inventory limit for this book group
        const currentActiveQtyForThisBook = myRequests
            .filter(r => r.status === 'pending' || r.status === 'approved')
            .reduce((sum, r) => sum + (r.quantity || 1), 0);

        if (currentActiveQtyForThisBook + borrowQuantity > groupedInfo.total) {
            setMessage(`Total copies of this book cannot exceed total inventory (${groupedInfo.total}). You currently have ${currentActiveQtyForThisBook} active request(s) for this book.`);
            return;
        }

        if (borrowQuantity > groupedInfo.available) {
            setMessage(`Not enough physical stock available. Only ${groupedInfo.available} copies are currently in the library.`);
            return;
        }

        try {
            const allRes = await axios.get('http://localhost:9999/borrows');
            const newId = allRes.data.length > 0 ? (Math.max(...allRes.data.map(b => Number(b.id))) + 1).toString() : "1";

            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + rules.maxBorrowDays);

            await axios.post('http://localhost:9999/borrows', {
                id: newId,
                bookId: book.id,
                userId: auth.id,
                status: 'pending',
                requestDate: new Date().toISOString(),
                returnDate: returnDate.toISOString(),
                quantity: borrowQuantity,
                totalPrice: borrowQuantity * (rules.pricePerBook || 0)
            });

            setMessage('Borrow request submitted successfully!');
            setShowBorrowModal(false);
            fetchAll();
        } catch (error) {
            setMessage('Failed to submit rental request.');
        }
    };

    const handleCancelRequest = async (borrowId) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        try {
            await axios.delete(`http://localhost:9999/borrows/${borrowId}`);
            setMessage("Request cancelled successfully.");
            fetchAll();
        } catch (error) {
            setMessage("Failed to cancel request.");
        }
    };

    const StarRating = ({ current, total = 5, onSelect, onHover }) => {
        return (
            <div className="d-flex gap-1 mb-3">
                {[...Array(total)].map((_, i) => (
                    <span
                        key={i}
                        style={{ cursor: 'pointer', fontSize: '1.5rem', color: (hoverRating || current) > i ? '#ffc107' : '#e4e5e9' }}
                        onMouseEnter={() => onHover && onHover(i + 1)}
                        onMouseLeave={() => onHover && onHover(0)}
                        onClick={() => onSelect && onSelect(i + 1)}
                    >
                        {(hoverRating || current) > i ? <FaStar /> : <FaRegStar />}
                    </span>
                ))}
            </div>
        );
    };

    if (!book) return <Container className="py-5 text-center"><h4>Loading...</h4></Container>;

    return (
        <Container className="py-4">
            <Link to="/user/books" className="text-decoration-none d-flex align-items-center mb-4 text-muted hover-primary">
                <FaArrowLeft className="me-2" /> Back to Library
            </Link>

            {message && <Alert variant="info" className="mb-4 shadow-sm" dismissible onClose={() => setMessage('')}>{message}</Alert>}

            <Row className="mb-5">
                <Col lg={4} className="mb-4">
                    <div className="book-image-container p-4 bg-white rounded shadow-sm">
                        <img src={book.image} alt={book.title} className="img-fluid rounded shadow w-100" style={{ maxHeight: '500px', objectFit: 'contain' }} />
                    </div>
                </Col>
                <Col lg={8}>
                    <div className="ps-lg-4">
                        <div className="mb-2">
                            <Badge bg="primary" className="mb-2">{book.categoryId || 'General'}</Badge>
                            <h1 className="display-5 fw-bold text-dark mb-1">{book.title}</h1>
                            <p className="h5 text-muted mb-4">by <span className="text-primary">{book.author}</span></p>
                        </div>

                        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                            <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill">
                                <FaStar className="text-warning me-2" />
                                <span className="fw-bold">{avgRating}</span>
                                <span className="text-muted ms-1">({reviews.length} reviews)</span>
                            </div>
                            <div className="d-flex align-items-center bg-white border px-3 py-2 rounded-pill shadow-sm">
                                <FaListOl className="text-primary me-2" />
                                <span className="fw-bold text-dark">{groupedInfo.available} / {groupedInfo.total}</span>
                                <span className="text-muted ms-1 small">Available</span>
                            </div>
                            <Badge bg={groupedInfo.available > 0 ? "success" : "danger"} className="px-3 py-2 rounded-pill">
                                {groupedInfo.available > 0 ? "In Stock" : "Currently Out"}
                            </Badge>
                        </div>

                        <div className="mb-4">
                            <h5 className="fw-bold mb-3">Description</h5>
                            <p className="text-muted lh-lg" style={{ fontSize: '1.1rem' }}>
                                {book.description || "No description available for this book."}
                            </p>
                        </div>

                        <div className="d-flex gap-3 mb-4">
                            <Button
                                variant="primary"
                                size="lg"
                                className="px-5 rounded-pill shadow-sm py-3 fw-bold"
                                onClick={() => setShowBorrowModal(true)}
                                disabled={groupedInfo.available === 0}
                            >
                                {groupedInfo.available === 0 ? "Unavailable" : "Borrow Now"}
                            </Button>
                        </div>

                    </div>
                </Col>
            </Row>

            <Row>
                <Col lg={6} className="mb-4">
                    <Card className="border-0 shadow-sm p-4 rounded-4 bg-light">
                        <h4 className="fw-bold mb-4">Leave a Review</h4>
                        <div className="bg-white p-4 rounded-4 shadow-sm">
                            <p className="text-muted small mb-2 fw-bold">RATE THIS BOOK</p>
                            <StarRating
                                current={rating}
                                onSelect={setRating}
                                onHover={setHoverRating}
                            />

                            <Form.Group className="mb-4">
                                <Form.Label className="text-muted small fw-bold">YOUR THOUGHTS</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder="Write another thought about this book..."
                                    className="border-0 bg-light p-3 rounded-3"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </Form.Group>

                            <Button
                                variant="primary"
                                className="w-100 py-3 rounded-pill fw-bold shadow-sm"
                                onClick={handleSubmitReview}
                            >
                                Post Review
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col lg={6}>
                    <h4 className="fw-bold mb-4 d-flex align-items-center">
                        <FaQuoteLeft className="text-primary opacity-25 me-3" />
                        Reader Reviews
                    </h4>

                    {reviews.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-4 border border-dashed border-2">
                            <p className="text-muted mb-0">No reviews yet. Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <div className="review-list">
                            {[...reviews].reverse().map(r => {
                                const u = users.find(x => x.id == r.userId);
                                return (
                                    <Card key={r.id} className="border-0 shadow-sm mb-3 rounded-4 transition-hover overflow-hidden">
                                        <Card.Body className="p-4">
                                            <div className="d-flex align-items-center mb-3">
                                                {u?.avatar ? (
                                                    <img src={u.avatar} alt="avatar" width="45" height="45" className="rounded-circle me-3 border" />
                                                ) : (
                                                    <FaUserCircle className="text-muted me-3" style={{ fontSize: '45px' }} />
                                                )}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="fw-bold mb-0">{u?.fullName || 'Anonymous User'}</h6>
                                                        <span className="text-muted x-small d-flex align-items-center" style={{ fontSize: '0.8rem' }}>
                                                            <FaCalendarAlt className="me-1" />
                                                            {new Date(r.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-warning small">
                                                        {[...Array(5)].map((_, i) => (
                                                            i < r.rating ? <FaStar key={i} /> : <FaRegStar key={i} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <Card.Text className="text-muted fst-italic ps-2 border-start border-3 border-primary bg-light p-3 rounded mb-3">
                                                "{r.comment}"
                                            </Card.Text>

                                            {/* Threaded Replies */}
                                            <div className="replies-thread ms-4">
                                                {/* Migration: Show old adminReply if it exists and no replies array yet */}
                                                {r.adminReply && (!r.replies || r.replies.length === 0) && (
                                                    <div className="reply-item p-3 bg-white rounded-4 border-start border-4 border-info shadow-sm mb-2">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <Badge bg="info" className="me-2 x-small">Admin</Badge>
                                                            <small className="text-muted x-small">
                                                                {r.repliedAt ? new Date(r.repliedAt).toLocaleDateString() : ''}
                                                        </small>
                                                        </div>
                                                        <p className="mb-0 small text-dark">{r.adminReply}</p>
                                                    </div>
                                                )}

                                                {/* New dynamic replies */}
                                                {(r.replies || []).map(reply => {
                                                    const replyUser = users.find(u => String(u.id) === String(reply.userId));
                                                    const isAdmin = reply.role === 'admin';
                                                    return (
                                                        <div key={reply.id} className={`reply-item p-3 rounded-4 mb-2 border-0 shadow-sm ${isAdmin ? 'bg-info bg-opacity-10 border-start border-4 border-info' : 'bg-white'}`}>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <div className="flex-grow-1 d-flex align-items-center">
                                                                    <span className={`fw-bold small me-1 ${isAdmin ? 'text-info' : 'text-dark'}`}>
                                                                        {isAdmin ? 'Library Admin' : (replyUser?.fullName || 'Active Reader')}
                                                                    </span>
                                                                    {isAdmin && <Badge bg="info" className="me-2 rounded-circle p-1" style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>✓</Badge>}
                                                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                        • {new Date(reply.createdAt).toLocaleDateString()}
                                                                    </small>
                                                                </div>
                                                                {String(auth.id) !== String(reply.userId) && (
                                                                    <Button 
                                                                        variant="link" 
                                                                        size="sm" 
                                                                        className="p-0 text-decoration-none text-primary hover-opacity-100 fw-bold"
                                                                        style={{ fontSize: '0.7rem' }}
                                                                        onClick={() => {
                                                                            setReplyingTo(r.id);
                                                                            const targetName = isAdmin ? 'Admin' : (replyUser?.fullName || 'User');
                                                                            setReplyContent(`@${targetName} `);
                                                                        }}
                                                                    >
                                                                        Reply
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <p className="mb-0 small text-dark" style={{ lineHeight: '1.4' }}>
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

                                                {/* Reply Input Area */}
                                                {replyingTo === r.id ? (
                                                    <div className="mt-4 bg-white p-3 rounded-4 border shadow-sm border-primary">
                                                        <Form.Control 
                                                            as="textarea"
                                                            rows={2}
                                                            placeholder="Say something nice..."
                                                            className="border-0 bg-light p-3 rounded-3 mb-2 small"
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button size="sm" variant="light" className="rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }} onClick={() => setReplyingTo(null)}>Cancel</Button>
                                                            <Button size="sm" variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" style={{ fontSize: '0.75rem' }} onClick={() => handleSaveReply(r.id)}>Submit Response</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Only show main reply button if not the author of review
                                                    String(auth.id) !== String(r.userId) && (
                                                        <div className="mt-2 text-end">
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm" 
                                                                className="rounded-pill px-4 fw-bold"
                                                                style={{ fontSize: '0.75rem' }}
                                                                onClick={() => {
                                                                    setReplyingTo(r.id);
                                                                    const authorName = users.find(u => String(u.id) === String(r.userId))?.fullName || 'User';
                                                                    setReplyContent(`@${authorName} `);
                                                                }}
                                                            >
                                                                Post a Response
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Col>
            </Row>

            {/* Borrow Modal */}
            <Modal show={showBorrowModal} onHide={() => setShowBorrowModal(false)} centered size="lg">
                <div className="overflow-hidden rounded-4 border-0">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fw-bold">Borrow Request</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Row>
                            <Col md={5} className="mb-3 mb-md-0">
                                <img src={book.image} alt={book.title} className="img-fluid rounded shadow-sm w-100" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                            </Col>
                            <Col md={7}>
                                <h4 className="fw-bold text-dark">{book.title}</h4>
                                <p className="text-muted mb-1">{book.author}</p>
                                <p className="small text-primary mb-4 fw-bold">{groupedInfo.available} items left in stock</p>

                                <div className="bg-light p-3 rounded-3 mb-4 border">
                                    <Form.Group className="mb-3">
                                        <Form.Label className="text-muted small fw-bold">
                                            <FaListOl className="me-2" /> QUANTITY
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max={groupedInfo.available}
                                            value={borrowQuantity}
                                            onChange={(e) => setBorrowQuantity(Math.min(parseInt(e.target.value) || 1, groupedInfo.available))}
                                            className="rounded-3 border-primary"
                                        />
                                    </Form.Group>

                                    <div className="d-flex justify-content-between mb-3 border-top pt-3">
                                        <span className="text-muted">Borrowing Rule:</span>
                                        <span className="fw-bold text-primary">{rules.maxBorrowDays} Days Max</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center pt-1 mt-2 bg-white p-2 rounded-2 border border-info border-opacity-25 mb-2">
                                        <span className="small mb-0 text-muted">
                                            <FaClock className="me-2 text-info" /> Due Date:
                                        </span>
                                        <span className="small mb-0 fw-bold">
                                            {(() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + rules.maxBorrowDays);
                                                return d.toLocaleDateString();
                                            })()}
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                                        <span className="fw-bold text-dark">
                                            <FaMoneyBillWave className="me-2 text-success" /> Total Price:
                                        </span>
                                        <span className="h5 mb-0 fw-bold text-success">
                                            {(borrowQuantity * (rules.pricePerBook || 0)).toLocaleString()} VND
                                        </span>
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    <Button variant="primary" size="lg" className="rounded-pill fw-bold" onClick={handleConfirmBorrow}>
                                        Confirm Rental Request
                                    </Button>
                                    <Button variant="light" size="sm" className="rounded-pill" onClick={() => setShowBorrowModal(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>
                </div>
            </Modal>

            <style>{`
                .hover-primary:hover { color: var(--bs-primary) !important; }
                .transition-hover:hover {
                    transform: translateY(-5px);
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
                }
                .book-image-container {
                    transition: all 0.5s ease;
                }
                .book-image-container:hover {
                    transform: perspective(1000px) rotateY(-5deg);
                }
            `}</style>
        </Container>
    );
}

export default UserBookDetails;