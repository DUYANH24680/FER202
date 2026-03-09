import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';

function AdminBookList() {
    const [books, setBooks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentBook, setCurrentBook] = useState({ id: null, title: '', author: '', available: true, image: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await axios.get('http://localhost:9999/books');
                setBooks(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch books');
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    // Function to handle Add and Edit Book
    const handleSaveBook = async () => {
        setLoading(true);
        try {
            if (!currentBook.title || !currentBook.author) {
                setError('Title and Author are required');
                return;
            }

            if (currentBook.id) {
                // Update Book
                await axios.put(`http://localhost:9999/books/${currentBook.id}`, currentBook);
            } else {
                // Add New Book
                await axios.post('http://localhost:9999/books', currentBook);
            }
            setShowModal(false);
            setCurrentBook({ id: null, title: '', author: '', available: true, image: '' }); // Reset form
            // Re-fetch books after adding/updating
            const res = await axios.get('http://localhost:9999/books');
            setBooks(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to save book');
        } finally {
            setLoading(false);
        }
    };

    // Function to handle Delete Book
    const handleDeleteBook = async (bookId) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            setLoading(true);
            try {
                await axios.delete(`http://localhost:9999/books/${bookId}`);
                // Re-fetch books after deletion
                const res = await axios.get('http://localhost:9999/books');
                setBooks(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to delete book');
            } finally {
                setLoading(false);
            }
        }
    };

    // // Open modal for adding a new book
    // const openAddBookModal = () => {
    //     setCurrentBook({ id: null, title: '', author: '', available: true, image: '' });
    //     setShowModal(true);
    // };

    // Open modal for editing an existing book
    const openEditBookModal = (book) => {
        setCurrentBook(book);
        setShowModal(true);
    };

    return (
        <div>
            <h2>Manage Books</h2>
            {/* <Button className="me-2 mb-2" variant="primary" onClick={openAddBookModal}>Add Book</Button> */}
            {error && <Alert variant="danger">{error}</Alert>}

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Available</th>
                        <th>Image</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="text-center">
                                <Spinner animation="border" /> Loading...
                            </td>
                        </tr>
                    ) : (
                        books.map((book) => (
                            <tr key={book.id}>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.available ? 'Yes' : 'No'}</td>
                                <td>
                                    <img src={book.image} alt={book.title} style={{ width: '50px' }} />
                                </td>
                                <td>
                                    <Button className="me-2" variant="warning" onClick={() => openEditBookModal(book)}>Edit</Button>
                                    <Button className="me-2" variant="danger" onClick={() => handleDeleteBook(book.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentBook.id ? 'Edit' : 'Add'} Book</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentBook.title}
                                onChange={(e) => setCurrentBook({ ...currentBook, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Author</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentBook.author}
                                onChange={(e) => setCurrentBook({ ...currentBook, author: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Available</Form.Label>
                            <Form.Check
                                type="checkbox"
                                checked={currentBook.available}
                                onChange={(e) => setCurrentBook({ ...currentBook, available: e.target.checked })}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Image URL</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentBook.image}
                                onChange={(e) => setCurrentBook({ ...currentBook, image: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleSaveBook}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AdminBookList;
