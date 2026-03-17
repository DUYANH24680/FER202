import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {  Button, Alert, Form } from 'react-bootstrap';
import { FaBook, FaCheck } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function UserAvailableBooks({ auth }) {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('');

    useEffect(() => {
        const fetchBooks = async () => {
            const [booksRes, borrowsRes] = await Promise.all([
                axios.get('http://localhost:9999/books'),
                axios.get(`http://localhost:9999/borrows?userId=${auth.id}`)
            ]);
            setBooks(booksRes.data);
            setFilteredBooks(booksRes.data);
            setBorrowed(borrowsRes.data);
        };
        fetchBooks();
    }, [auth.id]);

    const uniqueTitles = [...new Set(books.map(book => book.title))];
    const uniqueAuthors = [...new Set(books.map(book => book.author))];

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        filterBooks(query, selectedTitle, selectedAuthor);
    };

    const handleTitleChange = (event) => {
        const title = event.target.value;
        setSelectedTitle(title);
        filterBooks(searchQuery, title, selectedAuthor);
    };

    const handleAuthorChange = (event) => {
        const author = event.target.value;
        setSelectedAuthor(author);
        filterBooks(searchQuery, selectedTitle, author);
    };

    const filterBooks = (query, title, author) => {
        const filtered = books.filter(book => {
            const matchesQuery = book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query);
            const matchesTitle = title === '' || book.title === title;
            const matchesAuthor = author === '' || book.author === author;
            return matchesQuery && matchesTitle && matchesAuthor;
        });
        setFilteredBooks(filtered);
    };

    const handleRequestBorrow = async (e, bookId) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const existingBorrow = borrowed.find(b =>
                b.bookId === bookId && ['pending', 'approved'].includes(b.status)
            );

            if (existingBorrow) {
                setMessage('You already have a pending or approved request for this book');
                return;
            }

            const allUsers = await axios.get('http://localhost:9999/borrows');
            const nextId = allUsers.data.length > 0
                ? Math.max(...allUsers.data.map(user => Number(user.id))) + 1
                : 1;


            const newUser = {
                id: nextId,
                bookId,
                userId: auth.id,
                status: 'pending',
                requestDate: new Date().toISOString()
            };

            await axios.post('http://localhost:9999/borrows', newUser);

            setMessage('Borrow request submitted successfully');


            const borrowsRes = await axios.get(`http://localhost:9999/borrows?userId=${auth.id}`);
            setBorrowed(borrowsRes.data);
        } catch (error) {
            setMessage('Failed to submit borrow request');
        }
    };


    const BookCard = ({ book }) => {
        const isRequested = borrowed.some(b =>
            b.bookId === book.id && ['pending', 'approved'].includes(b.status)
        );

        return (
            <div className="col-md-3 mb-4">
                <div className="card h-100 shadow-sm hover-shadow">
                    {book.image && (
                        <img
                            className="card-img-top"
                            src={book.image}
                            alt={`Cover of ${book.title}`}
                            style={{ height: '250px', objectFit: 'contain' }}
                        />
                    )}
                    <div className="card-body" style={{ padding: '10px' }}>
                        <Link
                            to={`/user/books/${book.id}`}
                            className="text-decoration-none"
                        >
                            <h5 className="card-title font-weight-bold" style={{ fontSize: '1.1rem' }}>{book.title}</h5>
                            <p className="card-text" style={{ fontSize: '0.9rem' }}>{book.author}</p>
                        </Link>
                        <Button
                            onClick={(e) => handleRequestBorrow(e, book.id)}
                            disabled={isRequested}
                            variant={isRequested ? "secondary" : "primary"}
                            className="w-100"
                            style={{ transition: 'background-color 0.3s' }}
                        >
                            {isRequested ? <><FaCheck /> Already Requested</> : <><FaBook /> Request Borrow</>}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center">Available Books</h2>

            <div className="row">
                {/* Filter Section */}
                <div className="col-md-3">
                    <Form className="mb-4">
                        <Form.Group controlId="search">
                            <Form.Control
                                type="text"
                                placeholder="Search by title or author"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </Form.Group>
                    </Form>

                    <Form.Group className="mb-3">
                        <Form.Label>Filter by Title:</Form.Label>
                        <Form.Select value={selectedTitle} onChange={handleTitleChange}>
                            <option value="">All Titles</option>
                            {uniqueTitles.map((title, index) => (
                                <option key={index} value={title}>{title}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Filter by Author:</Form.Label>
                        <Form.Check
                            type="radio"
                            label="All Authors"
                            value=""
                            checked={selectedAuthor === ''}
                            onChange={handleAuthorChange}
                        />
                        {uniqueAuthors.map((author, index) => (
                            <Form.Check
                                key={index}
                                type="radio"
                                label={author}
                                value={author}
                                checked={selectedAuthor === author}
                                onChange={handleAuthorChange}
                            />
                        ))}
                    </Form.Group>
                </div>

                {/* Book List Section */}
                <div className="col-md-9">
                    {message &&
                        <Alert variant="info" onClose={() => setMessage('')} dismissible>
                            {message}
                        </Alert>
                    }
                    <div className="row">
                        {filteredBooks.map(book => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserAvailableBooks;