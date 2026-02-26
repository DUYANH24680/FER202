// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import AdminBookList from './components/AdminBookList';
import BorrowRequests from './components/BorrowRequests';
import UserAvailableBooks from './components/UserAvailableBooks';
import BorrowHistory from './components/BorrowHistory';
import Register from './components/Register';
import Login from './components/Login';
import BookDetails from './components/BookDetails';
import AdminUserList from './components/AdminUserList';
import { ProtectedRoute } from './utils/ProtectedRoute';
import AdminBookStatus from './components/AdminBookStatus';
import AdminCategories from './components/AdminCategories';
import AdminImport from './components/AdminImport';
import AdminInventoryReport from './components/AdminInventoryReport';
import AdminSearchPro from './components/AdminSearchPro';
function App() {
    const [auth, setAuth] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setAuth(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = () => {
        setAuth(null);
        localStorage.removeItem('user');
    };

    return (
        <Router>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand>Home</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse>
                        <Nav className="me-auto">
                            {!auth ? (
                                <>
                                    <Nav.Link as={Link} to="/register">Register</Nav.Link>
                                    <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                </>
                            ) : auth.role === 'admin' ? (
                                <>
                                    <Nav.Link as={Link} to="/admin/books">Manage Books</Nav.Link>
                                    <Nav.Link as={Link} to="/admin/requests">Borrow Requests</Nav.Link>
                                    <Nav.Link as={Link} to="/admin/userlist">User List</Nav.Link>
                                    <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                                    <Nav.Link as={Link} to="/admin/books">Manage Books</Nav.Link>
        <Nav.Link as={Link} to="/admin/requests">Borrow Requests</Nav.Link>
    <Nav.Link as={Link} to="/admin/userlist">User List</Nav.Link>

    <Nav.Link as={Link} to="/admin/status">Book Status</Nav.Link>
    <Nav.Link as={Link} to="/admin/categories">Categories</Nav.Link>
    <Nav.Link as={Link} to="/admin/import">Import</Nav.Link>
    <Nav.Link as={Link} to="/admin/report">Inventory Report</Nav.Link>
    <Nav.Link as={Link} to="/admin/search">Advanced Search</Nav.Link>

    <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                                </>
                            ) : (
                                <>
                                    <Nav.Link as={Link} to="/user/books">Available Books</Nav.Link>
                                    <Nav.Link as={Link} to="/user/history">My History</Nav.Link>
                                    <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container className="mt-4">
                <Routes>
                    <Route path="/" element={<Navigate to={auth ? (auth.role === 'admin' ? '/admin/books' : '/user/books') : '/login'} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login setAuth={setAuth} />} />

                    <Route path="/admin/books" element={
                        <ProtectedRoute auth={auth} allowedRole="admin">
                            <AdminBookList />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/requests" element={
                        <ProtectedRoute auth={auth} allowedRole="admin">
                            <BorrowRequests />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/userlist" element={
                        <ProtectedRoute auth={auth} allowedRole="admin">
                            <AdminUserList />
                        </ProtectedRoute>
                    } />

                    <Route path="/user/books" element={
                        <ProtectedRoute auth={auth} allowedRole="user">
                            <UserAvailableBooks auth={auth} />
                        </ProtectedRoute>
                    } />
                    <Route path="/user/history" element={
                        <ProtectedRoute auth={auth} allowedRole="user">
                            <BorrowHistory auth={auth} />
                        </ProtectedRoute>
                    } />
                    <Route path="/user/books/:id" element={
                        <ProtectedRoute auth={auth} allowedRole="user">
                            <BookDetails auth={auth} />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/status" element={
    <ProtectedRoute auth={auth} allowedRole="admin">
        <AdminBookStatus />
    </ProtectedRoute>
} />

<Route path="/admin/categories" element={
    <ProtectedRoute auth={auth} allowedRole="admin">
        <AdminCategories />
    </ProtectedRoute>
} />

<Route path="/admin/import" element={
    <ProtectedRoute auth={auth} allowedRole="admin">
        <AdminImport />
    </ProtectedRoute>
} />

<Route path="/admin/report" element={
    <ProtectedRoute auth={auth} allowedRole="admin">
        <AdminInventoryReport />
    </ProtectedRoute>
} />

<Route path="/admin/search" element={
    <ProtectedRoute auth={auth} allowedRole="admin">
        <AdminSearchPro />
    </ProtectedRoute>
} />
                </Routes>
            </Container>
        </Router>
    );
}

export default App;
