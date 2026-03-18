import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button, Alert, Row, Col, Badge, Spinner, Card, Form } from 'react-bootstrap';
import { FaBook, FaCheck, FaTimesCircle, FaStar } from 'react-icons/fa';

function UserBookDetails({ auth }) {
    const { id } = useParams();

    const [book, setBook] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    // ================= LOAD DATA =================
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [bookRes, borrowRes, reviewRes, userRes] = await Promise.all([
                    axios.get(`http://localhost:9999/books/${id}`),
                    axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
                    axios.get(`http://localhost:9999/reviews?bookId=${id}`),
                    axios.get(`http://localhost:9999/users`)
                ]);

                const bookData = bookRes.data;
                setBook(bookData);
                setBorrowed(borrowRes.data);
                setReviews(reviewRes.data);
                setUsers(userRes.data);

                // Fetch Category Name if categoryId exists
                if (bookData.categoryId) {
                    try {
                        const catRes = await axios.get(`http://localhost:9999/categories/${bookData.categoryId}`);
                        setCategoryName(catRes.data.name);
                    } catch (e) {
                        console.error("Category not found");
                    }
                }

            } catch (error) {
                setMessage('Failed to load data');
            }
        };

        fetchAll();
    }, [id, auth.id]);

    // ================= AVG RATING =================
    const avgRating =
        reviews.length > 0
            ? (
                reviews.reduce((sum, r) => sum + r.rating, 0) /
                reviews.length
            ).toFixed(1)
            : 0;

    // ================= AUTO FILL REVIEW =================
    useEffect(() => {
        const myReview = reviews.find(r => r.userId === auth.id);
        if (myReview) {
            setRating(myReview.rating);
            setComment(myReview.comment);
        }
    }, [reviews, auth.id]);

    // ================= BORROW LOGIC =================
    const handleRequestBorrow = async () => {
        try {
            // Check if already requested
            const isAlreadyRequested = borrowed.some(b => 
                String(b.bookId) === String(book.id) && ['pending', 'approved'].includes(b.status)
            );
            if (isAlreadyRequested) {
                setMessage('You already have a request for this book');
                return;
            }

            const res = await axios.get('http://localhost:9999/borrows');
            const nextId = res.data.length > 0 ? Math.max(...res.data.map(b => Number(b.id))) + 1 : 1;

            await axios.post('http://localhost:9999/borrows', {
                id: String(nextId),
                bookId: book.id,
                userId: auth.id,
                status: 'pending',
                requestDate: new Date().toISOString()
            });

            setMessage('Borrow request submitted successfully');
            
            // Refresh borrowed list
            const borrowsRes = await axios.get(`http://localhost:9999/borrows?userId=${auth.id}`);
            setBorrowed(borrowsRes.data);
        } catch (error) {
            setMessage('Failed to submit request');
        }
    };

    // ================= SUBMIT REVIEW =================
    const handleSubmitReview = async () => {
        if (rating === 0) {
            setMessage("Please select rating");
            return;
        }

        try {
            const existing = reviews.find(r => r.userId === auth.id);

            if (existing) {
                // UPDATE
                await axios.put(`http://localhost:9999/reviews/${existing.id}`, {
                    ...existing,
                    rating,
                    comment
                });
            } else {
                // CREATE
                const all = await axios.get("http://localhost:9999/reviews");
                const newId = all.data.length > 0 ? Math.max(...all.data.map(r => Number(r.id))) + 1 : 1;

                await axios.post("http://localhost:9999/reviews", {
                    id: String(newId),
                    userId: auth.id,
                    bookId: id,
                    rating,
                    comment,
                    createdAt: new Date().toISOString()
                });
            }

            setMessage("Review submitted!");
            const res = await axios.get(`http://localhost:9999/reviews?bookId=${id}`);
            setReviews(res.data);

        } catch (error) {
            setMessage("Failed to submit review");
        }
    };

    if (!book) return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;

    const isRequested = borrowed.some(b => String(b.bookId) === String(book.id) && ['pending', 'approved'].includes(b.status));
    const isAvailable = book.available === true;

    return (
        <div className="p-4 bg-transparent">
            {message && (
                <Alert 
                    variant="info" 
                    className="border-0 shadow-sm mb-4 d-flex align-items-center justify-content-between"
                    style={{ borderRadius: "12px" }}
                    onClose={() => setMessage('')}
                    dismissible
                >
                    <span>✨ {message}</span>
                </Alert>
            )}

            <div className="mb-4">
                <Button variant="link" onClick={() => window.history.back()} className="text-decoration-none p-0 text-muted fw-500 mb-3">
                    ← Back to library
                </Button>
            </div>

            <Row className="g-4 card-premium border-0 p-5 shadow-sm m-0 mb-5" style={{ background: "white" }}>
                <Col lg={4} className="text-center">
                    <div className="p-2 border-0 bg-light rounded-4 mb-4">
                        <img 
                            src={book.image} 
                            alt={book.title} 
                            className="w-100 rounded shadow-sm" 
                            style={{ maxHeight: '550px', objectFit: 'contain' }} 
                        />
                    </div>
                </Col>
                <Col lg={8} className="ps-lg-5">
                    <div className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <Badge 
                                bg="primary" 
                                className="px-3 py-2 text-uppercase" 
                                style={{ letterSpacing: "1px", fontSize: "11px" }}
                            >
                                {categoryName || 'General Collection'}
                            </Badge>
                            {avgRating > 0 && (
                                <Badge 
                                    bg="warning" 
                                    text="dark"
                                    className="px-3 py-2" 
                                    style={{ fontSize: "11px" }}
                                >
                                    <FaStar className="me-1" /> {avgRating} / 5
                                </Badge>
                            )}
                        </div>
                        <h1 className="fw-bold mb-2" style={{ fontSize: "42px", color: "var(--text-main)" }}>
                            {book.title}
                        </h1>
                        <p className="lead text-muted mb-0">by <span className="fw-600 text-dark">{book.author}</span></p>
                    </div>

                    <div className="bg-light p-4 rounded-4 mb-4 border border-opacity-10">
                        <h6 className="fw-bold text-uppercase small text-muted mb-3">Library Description</h6>
                        <p className="text-muted mb-0" style={{ lineHeight: "1.8", fontSize: "16px" }}>
                            {book.description || 'This treasure from our collection awaits its next reader. Discover its secrets and dive into its immersive narrative.'}
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-4 mb-5">
                        <div>
                            <span className="small text-muted d-block text-uppercase fw-600 mb-1">Status</span>
                            {isAvailable ? (
                                <Badge pill bg="success" className="px-3 py-2">Available Now</Badge>
                            ) : (
                                <Badge pill bg="danger" className="px-3 py-2">Currently Loaned</Badge>
                            )}
                        </div>
                        <div style={{ width: "1px", height: "40px", background: "var(--border-color)" }}></div>
                        <div>
                            <span className="small text-muted d-block text-uppercase fw-600 mb-1">Serial Number</span>
                            <code className="text-secondary fw-bold">LIB-{book.id}</code>
                        </div>
                    </div>

                    <div className="pt-3">
                        {!isAvailable ? (
                            <Button variant="danger" size="lg" className="px-5 py-3 fw-bold disabled w-100 w-md-auto" style={{ borderRadius: "12px" }}>
                                <FaTimesCircle className="me-2" /> Book Currently Unavailable
                            </Button>
                        ) : isRequested ? (
                            <Button variant="outline-primary" size="lg" className="px-5 py-3 fw-bold disabled w-100 w-md-auto" style={{ borderRadius: "12px" }}>
                                <FaCheck className="me-2" /> Request Submitted
                            </Button>
                        ) : (
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="btn-primary px-5 py-3 shadow-lg w-100 w-md-auto" 
                                style={{ borderRadius: "12px", border: "none" }}
                                onClick={handleRequestBorrow}
                            >
                                <FaBook className="me-2" /> Borrow This Book
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>

            {/* ================= REVIEWS SECTION ================= */}
            <div className="px-2">
                <Row className="g-4">
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: "20px" }}>
                            <h4 className="fw-bold mb-4">Write a Review</h4>
                            <Form.Group className="mb-4">
                                <Form.Label className="small text-muted text-uppercase fw-600">Select Rating</Form.Label>
                                <Form.Select
                                    className="p-3 border-0 bg-light rounded-3"
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                >
                                    <option value="0">Choose stars...</option>
                                    {[5, 4, 3, 2, 1].map(num => (
                                        <option key={num} value={num}>{"⭐".repeat(num)} {num} Star{num > 1 ? 's' : ''}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small text-muted text-uppercase fw-600">Your Feedback</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder="Tell others what you thought about this book..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="p-3 border-0 bg-light rounded-3"
                                    style={{ resize: "none" }}
                                />
                            </Form.Group>

                            <Button 
                                variant="dark" 
                                className="w-100 py-3 fw-bold rounded-3 border-0 shadow-sm" 
                                onClick={handleSubmitReview}
                                style={{ background: "var(--primary-dark)" }}
                            >
                                Post Review
                            </Button>
                        </Card>
                    </Col>
                    
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
                            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                                <h4 className="fw-bold m-0">Reader Reviews ({reviews.length})</h4>
                                {avgRating > 0 && <span className="fw-bold text-primary fs-4">⭐ {avgRating}</span>}
                            </div>

                            {reviews.length === 0 ? (
                                <div className="text-center py-5">
                                    <p className="text-muted fs-5 mb-0">No reviews yet. Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-4">
                                    {reviews.map(r => {
                                        const u = users.find(x => x.id == r.userId);
                                        return (
                                            <div key={r.id} className="p-4 rounded-4 bg-light bg-opacity-50 border border-light shadow-sm">
                                                <div className="d-flex align-items-center gap-3 mb-3">
                                                    <img
                                                        src={u?.avatar || "https://i.pravatar.cc/150?u=unknown"}
                                                        alt="avatar"
                                                        width="50"
                                                        height="50"
                                                        className="rounded-circle shadow-sm border border-2 border-white"
                                                    />
                                                    <div>
                                                        <h6 className="fw-bold mb-0">{u?.fullName || "Library Guest"}</h6>
                                                        <div className="text-warning small mt-1">
                                                            {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                                                        </div>
                                                    </div>
                                                    <div className="ms-auto small text-muted">
                                                        {new Date(r.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <p className="mb-0 text-muted" style={{ fontSize: "15px", lineHeight: "1.6" }}>
                                                    {r.comment}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default UserBookDetails;