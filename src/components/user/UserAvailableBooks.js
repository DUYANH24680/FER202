import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Alert, Form, Row, Col, InputGroup, Card, Modal, Badge } from 'react-bootstrap';
import { FaBook, FaCheck, FaHeart, FaStar, FaFire, FaClock, FaMoneyBillWave, FaListOl } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function UserAvailableBooks({ auth }) {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [popularBooks, setPopularBooks] = useState([]);
    const [favoriteBooks, setFavoriteBooks] = useState([]);
    const [message, setMessage] = useState('');
    const [borrowed, setBorrowed] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('title');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [wishlist, setWishlist] = useState([]);
    const [rules, setRules] = useState({ maxBorrowDays: 14, maxBooksPerUser: 3, finePerDay: 5000 });
    const [globalActiveCount, setGlobalActiveCount] = useState(0);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [borrowQuantity, setBorrowQuantity] = useState(1);
    const [borrowDays, setBorrowDays] = useState(1);
    const PRICE_PER_DAY = 5000;           // Placeholder price

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [booksRes, borrowsRes, wishlistRes, categoriesRes, allBorrowsRes, rulesRes] = await Promise.all([
                    axios.get('http://localhost:9999/books'),
                    axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
                    axios.get(`http://localhost:9999/wishlists?userId=${auth.id}`),
                    axios.get('http://localhost:9999/categories'),
                    axios.get('http://localhost:9999/borrows'),
                    axios.get('http://localhost:9999/settings/1').catch(() => ({ data: null }))
                ]);

                if (rulesRes.data) setRules(rulesRes.data);

                const booksData = booksRes.data;
                const wishlistData = wishlistRes.data;
                const allBorrowsData = allBorrowsRes.data;

                // Group books by Title and Author (or base barcode if title varies)
                const groupedMap = booksData.reduce((acc, book) => {
                    const key = `${book.title}|${book.author}`;
                    if (!acc[key]) {
                        acc[key] = { 
                            ...book, 
                            availableCount: 0, 
                            totalCount: 0,
                            allIds: [] 
                        };
                    }
                    acc[key].totalCount += 1;
                    if (book.available) acc[key].availableCount += 1;
                    acc[key].allIds.push(book.id);
                    return acc;
                }, {});

                const groupedBooks = Object.values(groupedMap);

                setBooks(groupedBooks);
                setFilteredBooks(groupedBooks);
                setBorrowed(borrowsRes.data);
                setWishlist(wishlistData);
                setCategories(categoriesRes.data);

                const totalActive = borrowsRes.data
                    .filter(b => b.status === 'pending' || b.status === 'approved')
                    .reduce((sum, r) => sum + (r.quantity || 1), 0);
                setGlobalActiveCount(totalActive);

                // Calculate favorites: match any ID in the group to wishlist
                const favorites = groupedBooks.filter(group => 
                    group.allIds.some(id => wishlistData.some(w => w.bookId == id))
                );
                setFavoriteBooks(favorites);

                // Calculate popular books: sum borrows for all copies in the group
                const groupBorrowCounts = {};
                allBorrowsData.forEach(borrow => {
                    // Find which group this bookId belongs to
                    const group = groupedBooks.find(g => g.allIds.includes(String(borrow.bookId)));
                    if (group) {
                        const key = `${group.title}|${group.author}`;
                        groupBorrowCounts[key] = (groupBorrowCounts[key] || 0) + 1;
                    }
                });

                const sortedPopular = [...groupedBooks].sort((a, b) => {
                    const countA = groupBorrowCounts[`${a.title}|${a.author}`] || 0;
                    const countB = groupBorrowCounts[`${b.title}|${b.author}`] || 0;
                    return countB - countA;
                }).slice(0, 8);
                setPopularBooks(sortedPopular);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [auth.id]);

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        filterBooks(query, searchField, selectedCategory);
    };

    const handleSearchFieldChange = (event) => {
        const field = event.target.value;
        setSearchField(field);
        filterBooks(searchQuery, field, selectedCategory);
    };

    const handleCategoryChange = (event) => {
        const categoryId = event.target.value;
        setSelectedCategory(categoryId);
        filterBooks(searchQuery, searchField, categoryId);
    };

    const filterBooks = (query, field, categoryId) => {
        const filtered = books.filter(book => {
            const matchesQuery = !query || (book[field] && book[field].toString().toLowerCase().includes(query));
            // Use loose equality to handle potential string/number ID mismatches
            const matchesCategory = !categoryId || book.categoryId == categoryId;
            return matchesQuery && matchesCategory;
        });
        setFilteredBooks(filtered);
    };

    const openBorrowModal = (book) => {
        setSelectedBook(book);
        setBorrowQuantity(1);
        setBorrowDays(2);
        setShowModal(true);
    };

    const handleConfirmBorrow = async () => {
        if (!selectedBook) return;

        // Check global limit
        if (globalActiveCount + borrowQuantity > rules.maxBooksPerUser) {
            setMessage(`You can only borrow a total of ${rules.maxBooksPerUser} books at a time. You currently have ${globalActiveCount} active borrow(s).`);
            return;
        }

        // Check inventory limit for this group
        const currentActiveQtyForThisBook = borrowed
            .filter(b => selectedBook.allIds.includes(String(b.bookId)) && (b.status === 'pending' || b.status === 'approved'))
            .reduce((sum, r) => sum + (r.quantity || 1), 0);

        if (currentActiveQtyForThisBook + borrowQuantity > selectedBook.totalCount) {
            setMessage(`Total copies of this book cannot exceed total inventory (${selectedBook.totalCount}). You currently have ${currentActiveQtyForThisBook} active request(s) for this book.`);
            return;
        }

        try {
            const allBorrows = await axios.get('http://localhost:9999/borrows');
            const nextId = allBorrows.data.length > 0
                ? (Math.max(...allBorrows.data.map(b => Number(b.id))) + 1).toString()
                : "1";

            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + rules.maxBorrowDays);

            const newBorrow = {
                id: nextId,
                bookId: selectedBook.id,
                userId: auth.id,
                status: 'pending',
                requestDate: new Date().toISOString(),
                returnDate: returnDate.toISOString(),
                quantity: borrowQuantity,
                totalPrice: borrowQuantity * (rules.pricePerBook || 0)
            };

            await axios.post('http://localhost:9999/borrows', newBorrow);
            setMessage('Borrow request submitted successfully');
            setShowModal(false);

            const borrowsRes = await axios.get(`http://localhost:9999/borrows?userId=${auth.id}`);
            const updatedBorrows = borrowsRes.data;
            setBorrowed(updatedBorrows);
            setGlobalActiveCount(updatedBorrows
                .filter(b => b.status === 'pending' || b.status === 'approved')
                .reduce((sum, r) => sum + (r.quantity || 1), 0)
            );
        } catch (error) {
            setMessage('Failed to submit borrow request');
        }
    };

    const handleAddWishlist = async (e, bookId) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Find the group this ID belongs to
            const group = books.find(g => g.allIds.includes(String(bookId)));
            const isAnyInWishlist = group && group.allIds.some(id => wishlist.some(w => w.bookId == id));

            if (isAnyInWishlist) {
                setMessage("Book already in wishlist ❤️");
                return;
            }

            const res = await axios.get("http://localhost:9999/wishlists");
            const nextId = res.data.length > 0
                ? (Math.max(...res.data.map(w => Number(w.id))) + 1).toString()
                : "1";

            const newWishlist = {
                id: nextId,
                userId: auth.id,
                bookId: bookId,
                createdAt: new Date().toISOString()
            };

            await axios.post("http://localhost:9999/wishlists", newWishlist);
            setMessage("Added to wishlist ❤️");

            const wishlistRes = await axios.get(`http://localhost:9999/wishlists?userId=${auth.id}`);
            const updatedWishlist = wishlistRes.data;
            setWishlist(updatedWishlist);
            
            const favorites = books.filter(item => 
                item.allIds.some(id => updatedWishlist.some(w => w.bookId == id))
            );
            setFavoriteBooks(favorites);

        } catch (error) {
            setMessage("Failed to add wishlist");
        }
    };

    const BookCard = ({ book }) => {
        const isRequested = borrowed.some(b =>
            book.allIds.includes(String(b.bookId)) && ['pending', 'approved'].includes(b.status)
        );
        const isFavorite = wishlist.some(w => book.allIds.includes(String(w.bookId)));

        return (
            <Col xl={3} lg={4} md={6} sm={6} className="mb-4">
                <Card className="h-100 shadow-sm transition-hover border-0 overflow-hidden">
                    <div className="position-relative">
                        {book.image && (
                            <Card.Img
                                variant="top"
                                src={book.image}
                                alt={book.title}
                                style={{ height: '220px', objectFit: 'contain', padding: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}
                            />
                        )}
                        <div className="position-absolute top-0 end-0 p-2">
                            <Badge bg={book.availableCount > 0 ? "success" : "danger"} className="shadow-sm">
                                {book.availableCount > 0 ? `${book.availableCount} Available` : "Out of Stock"}
                            </Badge>
                        </div>
                    </div>
                    <Card.Body className="d-flex flex-column p-3">
                        <Link to={`/user/books/${book.id}`} className="text-decoration-none text-dark mb-2">
                            <Card.Title className="h6 fw-bold mb-1 text-truncate" title={book.title}>{book.title}</Card.Title>
                            <Card.Text className="small text-muted mb-0">
                                {book.author}
                            </Card.Text>
                        </Link>
                        
                        <div className="mt-2 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="x-small text-muted" style={{ fontSize: '11px' }}>Inventory Status</span>
                                <span className="x-small text-dark fw-bold" style={{ fontSize: '11px' }}>
                                    {book.availableCount} / {book.totalCount}
                                </span>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                                <div 
                                    className={`progress-bar ${book.availableCount === 0 ? 'bg-danger' : 'bg-primary'}`} 
                                    role="progressbar" 
                                    style={{ width: `${(book.availableCount / book.totalCount) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-auto pt-2">
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    openBorrowModal(book);
                                }}
                                disabled={book.availableCount === 0}
                                variant={book.availableCount === 0 ? "light" : "primary"}
                                size="sm"
                                className="w-100 mb-2 rounded-pill fw-bold"
                            >
                                {book.availableCount === 0 ? "Unavailable" : "Borrow Now"}
                            </Button>
                            
                            <Button
                                onClick={(e) => handleAddWishlist(e, book.id)}
                                variant={isFavorite ? "danger" : "outline-danger"}
                                size="sm"
                                className="w-100 rounded-pill"
                            >
                                {isFavorite ? "❤️ In Favorites" : "🤍 Add to Favorites"}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    return (
        <div className="container py-4">
            <header className="mb-5 text-center">
                <h1 className="display-4 font-weight-bold text-primary">Home</h1>
                <p className="lead text-muted">Find your next great read today</p>
            </header>

            {message && (
                <Alert variant="info" className="mb-4" onClose={() => setMessage('')} dismissible>
                    {message}
                </Alert>
            )}

            <Row className="mb-5">
                <Col md={10} lg={8} className="mx-auto">
                    <InputGroup className="shadow-sm border rounded-pill overflow-hidden bg-white px-2">
                        <Form.Select 
                            className="border-0 bg-transparent text-primary fw-bold"
                            style={{ maxWidth: '140px' }} 
                            value={searchField}
                            onChange={handleSearchFieldChange}
                        >
                            <option value="title">By Title</option>
                            <option value="series">By Series</option>
                            <option value="author">By Author</option>
                        </Form.Select>
                        <div className="vr my-2 mx-2"></div>
                        <Form.Control
                            className="border-0 shadow-none px-3"
                            placeholder={`Looking for a specific ${searchField}?`}
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        <Button variant="primary" className="rounded-pill my-1 px-4">Search</Button>
                    </InputGroup>
                </Col>
            </Row>

            <Row>
                <Col md={3}>
                    <div className="bg-white p-4 rounded shadow-sm mb-4 border sticky-top" style={{ top: '100px', zIndex: 10 }}>
                        <h5 className="mb-4 fw-bold text-dark"><FaListOl className="me-2 text-primary" /> Categories</h5>
                        <Form.Group>
                            <Form.Check
                                type="radio"
                                label="Browse All"
                                name="category"
                                id="cat-all"
                                value=""
                                checked={selectedCategory === ''}
                                onChange={handleCategoryChange}
                                className="mb-3 custom-radio"
                            />
                            {categories.map((cat) => (
                                <Form.Check
                                    key={cat.id}
                                    type="radio"
                                    label={cat.name}
                                    name="category"
                                    id={`cat-${cat.id}`}
                                    value={cat.id}
                                    checked={selectedCategory === cat.id}
                                    onChange={handleCategoryChange}
                                    className="mb-2 custom-radio"
                                />
                            ))}
                        </Form.Group>
                    </div>
                </Col>

                <Col md={9}>
                    {/* Hide Popular Books when a Category is selected */}
                    {selectedCategory === '' && (
                        <section className="mb-5 animate-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold m-0"><FaFire className="text-danger me-2" /> Hot & Popular</h3>
                                <div className="border-bottom flex-grow-1 ms-4 opacity-25"></div>
                            </div>
                            <Row>
                                {popularBooks.map(book => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </Row>
                        </section>
                    )}

                    <section className="mb-5 animate-in">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="fw-bold m-0">
                                {selectedCategory ? `Results for Category` : "Available Books"}
                            </h3>
                            <div className="border-bottom flex-grow-1 ms-4 opacity-25"></div>
                        </div>
                        {filteredBooks.length > 0 ? (
                            <Row>
                                {filteredBooks.map(book => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </Row>
                        ) : (
                            <div className="text-center py-5 bg-white rounded shadow-sm border">
                                <p className="text-muted mb-0">No books found matching your criteria.</p>
                            </div>
                        )}
                    </section>
                    
                    {/* Favorite Books Moved to Bottom */}
                    {favoriteBooks.length > 0 && (
                        <section className="mb-5 animate-in">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold m-0"><FaStar className="text-warning me-2" /> Your Favorites</h3>
                                <div className="border-bottom flex-grow-1 ms-4 opacity-25"></div>
                            </div>
                            <Row>
                                {favoriteBooks.map(book => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </Row>
                        </section>
                    )}
                </Col>
            </Row>

            {/* Borrow Request Modal */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)}
                centered
                size="lg"
                backdrop="static"
                contentClassName="border-0 shadow-lg"
            >
                <div className="modal-overlay-custom">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fw-bold text-primary">Confirm Rental Request</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        {selectedBook && (
                            <Row className="align-items-center">
                                <Col md={5} className="text-center">
                                    <img 
                                        src={selectedBook.image} 
                                        alt={selectedBook.title} 
                                        className="img-fluid rounded shadow-sm"
                                        style={{ maxHeight: '300px' }}
                                    />
                                </Col>
                                <Col md={7}>
                                    <h4 className="fw-bold mb-1">{selectedBook.title}</h4>
                                    <p className="text-muted mb-4">{selectedBook.author}</p>
                                    
                                    <div className="bg-light p-3 rounded-3 mb-4 border">
                                        <Form.Group className="mb-3">
                                            <Form.Label className="text-muted small fw-bold">
                                                <FaListOl className="me-2" /> QUANTITY
                                            </Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                min="1"
                                                max={selectedBook.availableCount}
                                                value={borrowQuantity}
                                                onChange={(e) => setBorrowQuantity(Math.min(parseInt(e.target.value) || 1, selectedBook.availableCount))}
                                                className="rounded-3 border-primary"
                                            />
                                            <Form.Text className="text-muted small">
                                                * Maximum available in stock: {selectedBook.availableCount}
                                            </Form.Text>
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
                                    
                                    <div className="text-info small mb-4">
                                        <i className="bi bi-info-circle me-1"></i> Your request will be sent to the librarian for approval.
                                    </div>

                                    <div className="d-grid gap-2">
                                        <Button 
                                            variant="primary" 
                                            size="lg" 
                                            className="rounded-pill fw-bold"
                                            onClick={handleConfirmBorrow}
                                        >
                                            Submit Rental Request
                                        </Button>
                                        <Button 
                                            variant="light" 
                                            size="sm" 
                                            className="rounded-pill"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                </div>
            </Modal>
            
            <style>{`
                .transition-hover:hover {
                    transform: translateY(-8px) scale(1.02);
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
                }
                .custom-radio .form-check-input:checked {
                    background-color: var(--bs-primary);
                    border-color: var(--bs-primary);
                }
                .animate-in {
                    animation: fadeInUp 0.6s ease-out;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .modal-overlay-custom {
                    position: relative;
                    z-index: 1050;
                }
            `}</style>
        </div>
    );
}

export default UserAvailableBooks;