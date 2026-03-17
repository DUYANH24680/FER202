import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Alert, Form } from 'react-bootstrap';
import { FaBook, FaCheck, FaTimesCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function UserAvailableBooks({ auth }) {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const [booksRes, borrowsRes, catsRes] = await Promise.all([
                axios.get('http://localhost:9999/books'),
                axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
                axios.get('http://localhost:9999/categories')
            ]);
            setBooks(booksRes.data);
            setFilteredBooks(booksRes.data);
            setBorrowed(borrowsRes.data);
            setCategories(catsRes.data);
        };
        fetchData();
    }, [auth.id]);

    const uniqueAuthors = [...new Set(books.map(book => book.author))];

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        filterBooks(query, selectedCategory, selectedAuthor);
    };

    const handleCategoryChange = (event) => {
        const catId = event.target.value;
        setSelectedCategory(catId);
        filterBooks(searchQuery, catId, selectedAuthor);
    };

    const handleAuthorChange = (event) => {
        const author = event.target.value;
        setSelectedAuthor(author);
        filterBooks(searchQuery, selectedCategory, author);
    };

    const filterBooks = (query, catId, author) => {
        const filtered = books.filter(book => {
            const matchesQuery = book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query);
            const matchesCategory = catId === '' || book.categoryId === catId;
            const matchesAuthor = author === '' || book.author === author;
            return matchesQuery && matchesCategory && matchesAuthor;
        });
        setFilteredBooks(filtered);
    };

    const handleRequestBorrow = async (e, bookId) => {
        e.preventDefault();
        try {
            const res = await axios.get('http://localhost:9999/borrows');
            const nextId = res.data.length > 0 ? Math.max(...res.data.map(b => Number(b.id))) + 1 : 1;

            const newBorrow = {
                id: String(nextId),
                bookId,
                userId: auth.id,
                status: 'pending',
                requestDate: new Date().toISOString()
            };

            await axios.post('http://localhost:9999/borrows', newBorrow);
            setMessage('Borrow request submitted successfully');
            
            const borrowsRes = await axios.get(`http://localhost:9999/borrows?userId=${auth.id}`);
            setBorrowed(borrowsRes.data);
        } catch (error) {
            setMessage('Failed to submit borrow request');
        }
    };

    const BookCard = ({ book }) => {
        const isRequested = borrowed.some(b => b.bookId === book.id && ['pending', 'approved'].includes(b.status));
        const isAvailable = book.available === true;

        let renderButton;
        if (!isAvailable) {
            renderButton = <Button variant="danger" disabled className="w-100"><FaTimesCircle /> Not Available</Button>;
        } else if (isRequested) {
            renderButton = <Button variant="secondary" disabled className="w-100"><FaCheck /> Already Requested</Button>;
        } else {
            renderButton = (
                <Button variant="primary" className="w-100" onClick={(e) => handleRequestBorrow(e, book.id)}>
                    <FaBook /> Request Borrow
                </Button>
            );
        }

        return (
            <div className="col-md-3 mb-4">
                <div className="card h-100 shadow-sm">
                    {book.image && <img className="card-img-top" src={book.image} alt={book.title} style={{ height: '250px', objectFit: 'contain' }} />}
                    <div className="card-body">
                        <Link to={`/user/books/${book.id}`} className="text-decoration-none text-dark">
                            <h5 className="card-title" style={{ fontSize: '1rem' }}>{book.title}</h5>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>{book.author}</p>
                        </Link>
                        {renderButton}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center">Available Books</h2>
            <div className="row">
                <div className="col-md-3">
                    <Form.Control type="text" placeholder="Search..." className="mb-3" value={searchQuery} onChange={handleSearch} />
                    <Form.Group className="mb-3">
                        <Form.Label>Filter by Categories:</Form.Label>
                        <Form.Select value={selectedCategory} onChange={handleCategoryChange}>
                            <option value="">All Categories</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Filter by Author:</Form.Label>
                        <Form.Check type="radio" label="All Authors" checked={selectedAuthor === ''} onChange={() => handleAuthorChange({target: {value: ''}})} />
                        {uniqueAuthors.map((a, i) => <Form.Check key={i} type="radio" label={a} checked={selectedAuthor === a} onChange={() => handleAuthorChange({target: {value: a}})} />)}
                    </Form.Group>
                </div>
                <div className="col-md-9">
                    {message && <Alert variant="info" dismissible onClose={() => setMessage('')}>{message}</Alert>}
                    <div className="row">{filteredBooks.map(book => <BookCard key={book.id} book={book} />)}</div>
                </div>
            </div>
        </div>
    );
}
export default UserAvailableBooks;