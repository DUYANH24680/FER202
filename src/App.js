import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import AdminBookList from "./components/AdminBookList";
import BorrowRequests from "./components/BorrowRequests";
import UserAvailableBooks from "./components/UserAvailableBooks";
import BorrowHistory from "./components/BorrowHistory";
import Register from "./components/Register";
import Login from "./components/Login";
import BookDetails from "./components/BookDetails";
import AdminUserList from "./components/AdminUserList";
import AdminCategories from "./components/AdminCategories";
import AdminSearchPro from "./components/AdminSearchPro";
import AdminBookStatus from "./components/AdminBookStatus";
import AdminImport from "./components/AdminImport";
import AdminInventoryReport from "./components/AdminInventoryReport";

import { ProtectedRoute } from "./utils/ProtectedRoute";

function App() {

  const [auth, setAuth] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);

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

      {/* HEADER */}
      <div className="header">
        <button className="menu-btn" onClick={() => setOpenMenu(true)}>
          ☰
        </button>
        <h4 className="title">Library System</h4>
      </div>

      {/* OVERLAY */}
      {openMenu && <div className="overlay" onClick={() => setOpenMenu(false)}></div>}

      {/* SIDEBAR */}
      <div className={`sidebar ${openMenu ? "active" : ""}`}>

        {!auth ? (
          <>
            <Link to="/register" onClick={() => setOpenMenu(false)}>Register</Link>
            <Link to="/login" onClick={() => setOpenMenu(false)}>Login</Link>
          </>
        ) : auth.role === "admin" ? (
          <>
            <Link to="/admin/books" onClick={() => setOpenMenu(false)}>Manage Books</Link>
            <Link to="/admin/userlist" onClick={() => setOpenMenu(false)}>User List</Link>
            <Link to="/admin/categories" onClick={() => setOpenMenu(false)}>Categories</Link>
            <Link to="/admin/import" onClick={() => setOpenMenu(false)}>Import</Link>
            <Link to="/admin/inventory-report" onClick={() => setOpenMenu(false)}>Inventory Report</Link>
            <Link onClick={() => { handleLogout(); setOpenMenu(false); }}>Logout</Link>
          </>
        ) : auth.role === "staff" ? (
          <>
            <Link to="/staff/requests" onClick={() => setOpenMenu(false)}>Borrow Requests</Link>
            <Link to="/staff/search-pro" onClick={() => setOpenMenu(false)}>Search Pro</Link>
            <Link to="/staff/book-status" onClick={() => setOpenMenu(false)}>Book Status</Link>
            <Link onClick={() => { handleLogout(); setOpenMenu(false); }}>Logout</Link>
          </>
        ) : (
          <>
            <Link to="/user/books" onClick={() => setOpenMenu(false)}>Available Books</Link>
            <Link to="/user/history" onClick={() => setOpenMenu(false)}>My History</Link>
            <Link onClick={() => { handleLogout(); setOpenMenu(false); }}>Logout</Link>
          </>
        )}

      </div>

      {/* CONTENT */}
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
            path="/staff/requests"
            element={
              <ProtectedRoute auth={auth} allowedRole="staff">
                <BorrowRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/userlist"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <AdminUserList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <AdminCategories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/search-pro"
            element={
              <ProtectedRoute auth={auth} allowedRole="staff">
                <AdminSearchPro />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/book-status"
            element={
              <ProtectedRoute auth={auth} allowedRole="staff">
                <AdminBookStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/import"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <AdminImport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/inventory-report"
            element={
              <ProtectedRoute auth={auth} allowedRole="admin">
                <AdminInventoryReport />
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
              <ProtectedRoute auth={auth} allowedRole="user">
                <BorrowHistory auth={auth} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/books/:id"
            element={
              <ProtectedRoute auth={auth} allowedRole="user">
                <BookDetails auth={auth} />
              </ProtectedRoute>
            }
          />

        </Routes>

      </Container>

      {/* CSS */}
      <style>{`

        .header{
          height:60px;
          background:#2c3e50;
          color:white;
          display:flex;
          align-items:center;
          padding:0 20px;
          position:relative;
          z-index:1001;
        }

        .menu-btn{
          font-size:26px;
          background:none;
          border:none;
          color:white;
          margin-right:20px;
          cursor:pointer;
        }

        .sidebar{
          position:fixed;
          top:0;
          left:-250px;
          width:250px;
          height:100%;
          background:#34495e;
          padding-top:80px;
          transition:0.3s;
          z-index:1002;
        }

        .sidebar.active{
          left:0;
        }

        .sidebar a{
          display:block;
          padding:14px 20px;
          color:white;
          text-decoration:none;
          font-size:16px;
        }

        .sidebar a:hover{
          background:#1abc9c;
        }

        .overlay{
          position:fixed;
          top:0;
          left:0;
          width:100%;
          height:100%;
          background:rgba(0,0,0,0.4);
          z-index:1000;
        }

      `}</style>

    </Router>
  );
}

export default App;