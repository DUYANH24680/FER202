// src/components/BookDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Alert } from 'react-bootstrap';

function BookDetails({ auth }) {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);

    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                const res = await axios.get(`http://localhost:9999/books/${id}`);
                setBook(res.data);
            } catch (error) {
                setMessage('Failed to load book details');
            }
        };

        const fetchBorrowedBooks = async () => {
            const res = await axios.get(`http://localhost:9999/borrows?userId=${auth.id}`);
            setBorrowed(res.data);
        };

        fetchBookDetails();
        fetchBorrowedBooks();
    }, [id, auth.id]);

    const handleRequestBorrow = async () => {
        try {
            const existingBorrow = borrowed.find(b =>
                b.bookId === book.id && ['pending', 'approved'].includes(b.status)
            );

            if (existingBorrow) {
                setMessage('You already have a pending or approved request for this book');
                return;
            }

            await axios.post('http://localhost:9999/borrows', {
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

    if (message) {
        return <Alert variant="info" onClose={() => setMessage('')} dismissible>{message}</Alert>;
    }

    if (!book) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <Card className="border-0 shadow-sm">
                <div className="row">
                    {/* Book Image */}
                    <div className="col-md-4">
                        {book.image && (
                            <Card.Img
                                variant="top"
                                src={book.image}
                                alt={`Cover of ${book.title}`}
                                style={{ height: '400px', objectFit: 'contain' }}
                            />
                        )}
                    </div>

                    {/* Book Information */}
                    <div className="col-md-8">
                        <Card.Body>
                            <h3 className="font-weight-bold">{book.title}</h3>
                            <p className="text-muted">Author: {book.author}</p>
                            <p><strong>Describe:</strong> <br />{book.decription}</p>
                            <Button variant="primary" onClick={handleRequestBorrow}>
                                Request Borrow
                            </Button>
                        </Card.Body>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default BookDetails;
