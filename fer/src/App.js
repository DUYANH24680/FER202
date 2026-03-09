// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import AdminBookList from "./components/AdminBookList";
import UserAvailableBooks from "./components/UserAvailableBooks";
import Register from "./components/Register";
import Login from "./components/Login";
import { ProtectedRoute } from "./utils/ProtectedRoute";
import ManageRules from "./components/ManageRules";
import ManageLateBorrows from "./components/ManageLateBorrows";
import ManageUser from "./components/ManageUser";

function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setAuth(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("user");
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
                  <Nav.Link as={Link} to="/register">
                    Register
                  </Nav.Link>
                  <Nav.Link as={Link} to="/login">
                    Login
                  </Nav.Link>
                </>
              ) : auth.role === "admin" ? (
                <>
                  <Nav.Link as={Link} to="/admin/books">
                    Manage Books
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/requests">
                    Borrow Requests
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/userlist">
                    User List
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/managerule">
                    Manage Rule
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/late-borrows">
                    ⚠ Late Returns
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/user/books">
                    Available Books
                  </Nav.Link>
                  <Nav.Link as={Link} to="/user/history">
                    My History
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={
                  auth
                    ? auth.role === "admin"
                      ? "/admin/books"
                      : "/user/books"
                    : "/login"
                }
              />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setAuth={setAuth} />} />

          <Route
            path="/admin/books"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <AdminBookList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin"></ProtectedRoute>
            }
          />
          

          <Route
            path="/admin/managerule"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <ManageRules />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/late-borrows"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <ManageLateBorrows />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/userlist"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <ManageUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/books"
            element={
              <ProtectedRoute auth={auth} allowedRole="user">
                <UserAvailableBooks auth={auth} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/history"
            element={
              <ProtectedRoute auth={auth} allowedRole="user"></ProtectedRoute>
            }
          />
          <Route
            path="/user/books/:id"
            element={
              <ProtectedRoute auth={auth} allowedRole="user"></ProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
