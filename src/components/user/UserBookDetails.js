// src/components/UserBookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Alert, Form } from 'react-bootstrap';

function UserBookDetails({ auth }) {

    const { id } = useParams();

    const [book, setBook] = useState(null);
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);

    // ===== REVIEW =====
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

                setBook(bookRes.data);
                setBorrowed(borrowRes.data);
                setReviews(reviewRes.data);
                setUsers(userRes.data);

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

    // ================= BORROW =================
    const handleRequestBorrow = async () => {
        try {
            const existingBorrow = borrowed.find(b =>
                b.bookId === book.id &&
                ['pending', 'approved'].includes(b.status)
            );

            if (existingBorrow) {
                setMessage('You already have a pending or approved request for this book');
                return;
            }

            const all = await axios.get('http://localhost:9999/borrows');

            const newId =
                all.data.length > 0
                    ? Math.max(...all.data.map(x => Number(x.id))) + 1
                    : 1;

            await axios.post('http://localhost:9999/borrows', {
                id: newId,
                bookId: book.id,
                userId: auth.id,
                status: 'pending',
                requestDate: new Date().toISOString()
            });

            setMessage('Borrow request submitted successfully');

        } catch (error) {
            setMessage('Failed to submit borrow request');
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

                const newId =
                    all.data.length > 0
                        ? Math.max(...all.data.map(r => Number(r.id))) + 1
                        : 1;

                await axios.post("http://localhost:9999/reviews", {
                    id: newId,
                    userId: auth.id,
                    bookId: id,
                    rating,
                    comment,
                    createdAt: new Date().toISOString()
                });
            }

            setMessage("Review submitted!");

            // reload reviews
            const res = await axios.get(`http://localhost:9999/reviews?bookId=${id}`);
            setReviews(res.data);

        } catch (error) {
            setMessage("Failed to submit review");
        }
    };

    // ================= UI =================

    if (message) {
        return (
            <Alert variant="info" onClose={() => setMessage('')} dismissible>
                {message}
            </Alert>
        );
    }

    if (!book) return <div>Loading...</div>;

    return (
        <div className="container mt-4">

            {/* ================= BOOK ================= */}
            <Card className="border-0 shadow-sm mb-4">
                <div className="row">
                    <div className="col-md-4">
                        {book.image && (
                            <Card.Img
                                src={book.image}
                                style={{ height: '400px', objectFit: 'contain' }}
                            />
                        )}
                    </div>

                    <div className="col-md-8">
                        <Card.Body>
                            <h3>{book.title}</h3>
                            <p className="text-muted">Author: {book.author}</p>
                            <p>{book.decription}</p>

                            <h5>⭐ {avgRating} / 5 ({reviews.length} reviews)</h5>

                            <Button variant="primary" onClick={handleRequestBorrow}>
                                Request Borrow
                            </Button>
                        </Card.Body>
                    </div>
                </div>
            </Card>

            {/* ================= REVIEW ================= */}
            <Card className="p-3 shadow-sm">

                <h4>Write your review</h4>

                <Form.Select
                    className="mb-2"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                >
                    <option value="0">Select rating</option>
                    <option value="1">⭐ 1</option>
                    <option value="2">⭐⭐ 2</option>
                    <option value="3">⭐⭐⭐ 3</option>
                    <option value="4">⭐⭐⭐⭐ 4</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5</option>
                </Form.Select>

                <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Write your comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-2"
                />

                <Button variant="success" onClick={handleSubmitReview}>
                    Submit Review
                </Button>

                <hr />

                <h5>All Reviews</h5>

                {reviews.length === 0 ? (
                    <p>No reviews yet</p>
                ) : (
                    reviews.map(r => {
                        const u = users.find(x => x.id == r.userId);

                        return (
                            <div key={r.id} className="mb-3 border-bottom pb-2">

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <img
                                        src={u?.avatar}
                                        alt="avatar"
                                        width="40"
                                        style={{ borderRadius: "50%" }}
                                    />

                                    <div>
                                        <b>{u?.fullName}</b>
                                        <p>{"⭐".repeat(r.rating)}</p>
                                        <p>{r.comment}</p>
                                    </div>
                                </div>

                            </div>
                        );
                    })
                )}

            </Card>

        </div>
    );
}

export default UserBookDetails;