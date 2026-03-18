import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button, Alert, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FaBook, FaCheck, FaTimesCircle } from 'react-icons/fa';

function UserBookDetails({ auth }) {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const bookRes = await axios.get(`http://localhost:9999/books/${id}`);
                setBook(bookRes.data);

                // Fetch Category Name
                if (bookRes.data.categoryId) {
                    const catRes = await axios.get(`http://localhost:9999/categories/${bookRes.data.categoryId}`);
                    setCategoryName(catRes.data.name);
                }

                const borrowsRes = await axios.get(`http://localhost:9999/borrows?userId=${auth.id}`);
                setBorrowed(borrowsRes.data);
            } catch (error) {
                setMessage('Failed to load details');
            }
        };
        fetchDetails();
    }, [id, auth.id]);

    const handleRequestBorrow = async () => {
        try {
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
                >
                    <span>✨ {message}</span>
                    <Button variant="link" className="p-0 text-decoration-none text-muted" onClick={() => setMessage('')}>✕</Button>
                </Alert>
            )}

            <div className="mb-4">
                <Button variant="link" onClick={() => window.history.back()} className="text-decoration-none p-0 text-muted fw-500 mb-3">
                    ← Back to library
                </Button>
            </div>

            <Row className="g-4 card-premium border-0 p-5 shadow-sm m-0" style={{ background: "white" }}>
                <Col lg={4} className="text-center">
                    <div className="card-premium p-2 border-0 bg-light shadow-none mb-4">
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
                        <Badge 
                            bg="primary" 
                            className="mb-3 px-3 py-2 text-uppercase" 
                            style={{ letterSpacing: "1px", fontSize: "11px" }}
                        >
                            {categoryName || 'General Collection'}
                        </Badge>
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
        </div>
    );
}

export default UserBookDetails;
