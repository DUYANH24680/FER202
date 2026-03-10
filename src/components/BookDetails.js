import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Button, Alert } from 'react-bootstrap';
import { FaBook, FaCheck, FaTimesCircle } from 'react-icons/fa';

function BookDetails({ auth }) {
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

    if (!book) return <div className="container mt-4">Loading...</div>;

    const isRequested = borrowed.some(b => b.bookId === book.id && ['pending', 'approved'].includes(b.status));
    const isAvailable = book.available === true;

    return (
        <div className="container mt-4">
            {message && <Alert variant="info" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            <Card className="border-0 shadow-sm p-4">
                <div className="row">
                    <div className="col-md-4 text-center">
                        <img src={book.image} alt={book.title} style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} />
                    </div>
                    <div className="col-md-8">
                        <Card.Body>
                            <h2 className="font-weight-bold">{book.title}</h2>
                            <p className="text-muted mb-1"><strong>Author:</strong> {book.author}</p>
                            <p className="text-primary mb-3"><strong>Category:</strong> {categoryName || 'N/A'}</p>
                            <hr />
                            <p><strong>Description:</strong></p>
                            <p>{book.description || 'No description available.'}</p>
                            
                            <div className="mt-4">
                                {!isAvailable ? (
                                    <Button variant="danger" size="lg" disabled><FaTimesCircle /> Not Available</Button>
                                ) : isRequested ? (
                                    <Button variant="secondary" size="lg" disabled><FaCheck /> Already Requested</Button>
                                ) : (
                                    <Button variant="primary" size="lg" onClick={handleRequestBorrow}><FaBook /> Request Borrow</Button>
                                )}
                            </div>
                        </Card.Body>
                    </div>
                </div>
            </Card>
        </div>
    );
}
export default BookDetails;