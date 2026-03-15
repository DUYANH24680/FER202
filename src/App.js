import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";

import AdminBookList from "./components/admin/AdminBookList";
import AdminUserList from "./components/admin/AdminUserList";
import AdminCategories from "./components/admin/AdminCategories";
import AdminImport from "./components/admin/AdminImport";
import AdminInventoryReport from "./components/admin/AdminInventoryReport";

import AdminSearchPro from "./components/staff/StaffSearchPro";
import AdminBookStatus from "./components/staff/StaffBookStatus";
import StaffBorrowRequests from "./components/staff/StaffBorrowRequests";
import StaffCategoryBooks from "./components/staff/StaffCategoryBooks";

import UserAvailableBooks from "./components/user/UserAvailableBooks";
import UserBookDetails from "./components/user/UserBookDetails";
import UserBorrowHistory from "./components/user/UserBorrowHistory";

import Register from "./components/common/Register";
import Login from "./components/common/Login";
import SupportChatWidget from "./components/common/SupportChatWidget";
import UserSettings from "./components/common/UserSettings";

import { ProtectedRoute } from "./utils/ProtectedRoute";

function Layout({ children, auth, openMenu, setOpenMenu, handleLogout }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Staff/Admin", role: "staff", text: "Hello! How can we help you today?", time: new Date().toISOString(), isSystem: true }
  ]);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) return;

    // Simple polling or fetch for notifications
    const fetchNotifs = async () => {
      try {
        const res = await axios.get("http://localhost:9999/borrows");
        const allBorrows = res.data;
        let myNotifs = [];

        if (auth.role === "admin") {
          // Admin sees reports, imports, and new users
          const booksRes = await axios.get("http://localhost:9999/books");
          const damagedLost = booksRes.data.filter(b => b.status === "damaged" || b.status === "lost");
          const usersRes = await axios.get("http://localhost:9999/users");

          if (damagedLost.length > 0) {
            myNotifs.push({
              id: "rep-1",
              title: "Inventory Report Alert",
              message: `${damagedLost.length} books are marked as damaged or lost.`,
              date: new Date().toISOString(),
              link: "/admin/inventory-report"
            });
          }
          if (usersRes.data.length > 0) {
            myNotifs.push({
              id: "usr-1",
              title: "New User Registration",
              message: `New account created: ${usersRes.data[usersRes.data.length - 1].username}.`,
              date: new Date().toISOString(),
              link: "/admin/userlist"
            });
          }
          myNotifs.push({
            id: "imp-1",
            title: "Import Data",
            message: `System ready for new batch imports.`,
            date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            link: "/admin/import"
          });
        } else if (auth.role === "staff") {
          // Staff sees pending requests
          const pending = allBorrows.filter(b => b.status === "pending");
          myNotifs = pending.map(p => ({
            id: p.id,
            title: "New Borrow Request",
            message: `User #${p.userId} requested a book.`,
            date: p.requestDate || new Date().toISOString(),
            link: "/staff/requests"
          }));
        } else {
          // User sees updates on their own requests
          const myUpdates = allBorrows.filter(b => b.userId === String(auth.id) && b.status !== "pending");
          myNotifs = myUpdates.map(p => ({
            id: p.id,
            title: `Request ${p.status}`,
            message: `Your borrow request for book #${p.bookId} was ${p.status}.`,
            date: p.requestDate || new Date().toISOString(),
            link: "/user/history"
          }));
        }

        // Sort latest first
        myNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(myNotifs);

      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifs();
    // Optional: poll every 30s
    // const interval = setInterval(fetchNotifs, 30000);
    // return () => clearInterval(interval);

  }, [auth]);

  const unreadCount = notifications.length;

  const hideMenu =
    location.pathname === "/login" || location.pathname === "/register";

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isStaffRoute = location.pathname.startsWith("/staff");

  if (hideMenu) {
    return <>{children}</>;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f6f6" }}>
      {/* Sidebar */}
      <aside style={{
        width: "320px",
        background: "#1e293b",
        color: "white",
        overflowY: "auto",
        position: "fixed",
        height: "100vh",
        left: 0,
        top: 0,
        zIndex: 1000,
        borderRight: "1px solid #334155"
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #334155"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            background: "#ec5b13",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px"
          }}>
            📚
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: "bold" }}>LibTrack</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Library System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "20px 0", flex: 1 }}>
          {/* Admin Sections */}
          {(isAdminRoute || auth?.role === "admin") && auth?.role === "admin" && (
            <>
              {/* GENERAL */}
              <div style={{ paddingBottom: "20px" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", margin: "0 0 12px 0", paddingLeft: "20px", letterSpacing: "0.5px" }}>General</p>
                <Link to="/admin/books" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 24px",
                  color: isActive("/admin/books") ? "#ec5b13" : "#cbd5e1",
                  textDecoration: "none",
                  background: isActive("/admin/books") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                  borderLeft: isActive("/admin/books") ? "4px solid #ec5b13" : "4px solid transparent",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "18px",
                  fontWeight: isActive("/admin/books") ? "600" : "500",
                  transition: "all 0.2s"
                }}>
                  📖 Manage Books
                </Link>
              </div>

              {/* OPERATIONS */}
              <div style={{ paddingBottom: "20px", borderTop: "1px solid #334155", paddingTop: "20px" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", margin: "0 0 12px 0", paddingLeft: "20px", letterSpacing: "0.5px" }}>Operations</p>
                <Link to="/admin/userlist" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 24px",
                  color: isActive("/admin/userlist") ? "#ec5b13" : "#cbd5e1",
                  textDecoration: "none",
                  background: isActive("/admin/userlist") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                  borderLeft: isActive("/admin/userlist") ? "4px solid #ec5b13" : "4px solid transparent",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "18px",
                  fontWeight: isActive("/admin/userlist") ? "600" : "500",
                  transition: "all 0.2s"
                }}>
                  👥 User List
                </Link>
                <Link to="/admin/categories" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 24px",
                  color: isActive("/admin/categories") || location.pathname.startsWith("/category/") ? "#ec5b13" : "#cbd5e1",
                  textDecoration: "none",
                  background: isActive("/admin/categories") || location.pathname.startsWith("/category/") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                  borderLeft: isActive("/admin/categories") || location.pathname.startsWith("/category/") ? "4px solid #ec5b13" : "4px solid transparent",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "18px",
                  fontWeight: isActive("/admin/categories") || location.pathname.startsWith("/category/") ? "600" : "500",
                  transition: "all 0.2s"
                }}>
                  🏷️ Categories
                </Link>
              </div>

              {/* SYSTEM */}
              <div style={{ paddingBottom: "20px", borderTop: "1px solid #334155", paddingTop: "20px" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", margin: "0 0 12px 0", paddingLeft: "20px", letterSpacing: "0.5px" }}>System</p>
                <Link to="/admin/import" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 24px",
                  color: isActive("/admin/import") ? "#ec5b13" : "#cbd5e1",
                  textDecoration: "none",
                  background: isActive("/admin/import") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                  borderLeft: isActive("/admin/import") ? "4px solid #ec5b13" : "4px solid transparent",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "18px",
                  fontWeight: isActive("/admin/import") ? "600" : "500",
                  transition: "all 0.2s"
                }}>
                  📥 Import Data
                </Link>
                <Link to="/admin/inventory-report" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 24px",
                  color: isActive("/admin/inventory-report") ? "#ec5b13" : "#cbd5e1",
                  textDecoration: "none",
                  background: isActive("/admin/inventory-report") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                  borderLeft: isActive("/admin/inventory-report") ? "4px solid #ec5b13" : "4px solid transparent",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "18px",
                  fontWeight: isActive("/admin/inventory-report") ? "600" : "500",
                  transition: "all 0.2s"
                }}>
                  📊 Reports
                </Link>
              </div>
            </>
          )}

          {/* Staff Sections */}
          {(isStaffRoute || location.pathname.startsWith("/category")) && auth?.role === "staff" && (
            <div style={{ paddingBottom: "20px" }}>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", margin: "0 0 12px 0", paddingLeft: "20px", letterSpacing: "0.5px" }}>Operations</p>

              <Link to="/staff/book-status" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "18px 24px",
                color: isActive("/staff/book-status") || location.pathname.startsWith("/category/") ? "#ec5b13" : "#cbd5e1",
                textDecoration: "none",
                background: isActive("/staff/book-status") || location.pathname.startsWith("/category/") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                borderLeft: isActive("/staff/book-status") || location.pathname.startsWith("/category/") ? "4px solid #ec5b13" : "4px solid transparent",
                borderRadius: "0 8px 8px 0",
                fontSize: "18px",
                fontWeight: isActive("/staff/book-status") || location.pathname.startsWith("/category/") ? "600" : "500",
                transition: "all 0.2s"
              }}>
                📊 Categories (Books)
              </Link>

              <Link to="/staff/requests" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "18px 24px",
                color: isActive("/staff/requests") ? "#ec5b13" : "#cbd5e1",
                textDecoration: "none",
                background: isActive("/staff/requests") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                borderLeft: isActive("/staff/requests") ? "4px solid #ec5b13" : "4px solid transparent",
                borderRadius: "0 8px 8px 0",
                fontSize: "18px",
                transition: "all 0.2s"
              }}>
                📋 Borrow Requests
              </Link>
              <Link to="/staff/search-pro" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "18px 24px",
                color: isActive("/staff/search-pro") ? "#ec5b13" : "#cbd5e1",
                textDecoration: "none",
                background: isActive("/staff/search-pro") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                borderLeft: isActive("/staff/search-pro") ? "4px solid #ec5b13" : "4px solid transparent",
                borderRadius: "0 8px 8px 0",
                fontSize: "18px",
                transition: "all 0.2s"
              }}>
                🔍 Search Pro
              </Link>
            </div>
          )}

          {/* User Sections */}
          {auth?.role === "user" && !isAdminRoute && !isStaffRoute && (
            <div style={{ paddingBottom: "20px" }}>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", margin: "0 0 12px 0", paddingLeft: "20px", letterSpacing: "0.5px" }}>My Library</p>
              <Link to="/user/books" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "18px 24px",
                color: isActive("/user/books") ? "#ec5b13" : "#cbd5e1",
                textDecoration: "none",
                background: isActive("/user/books") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                borderLeft: isActive("/user/books") ? "4px solid #ec5b13" : "4px solid transparent",
                borderRadius: "0 8px 8px 0",
                fontSize: "18px",
                transition: "all 0.2s"
              }}>
                📚 Available Books
              </Link>
              <Link to="/user/history" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "18px 24px",
                color: isActive("/user/history") ? "#ec5b13" : "#cbd5e1",
                textDecoration: "none",
                background: isActive("/user/history") ? "rgba(236, 91, 19, 0.15)" : "transparent",
                borderLeft: isActive("/user/history") ? "4px solid #ec5b13" : "4px solid transparent",
                borderRadius: "0 8px 8px 0",
                fontSize: "18px",
                transition: "all 0.2s"
              }}>
                ⏱️ My History
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: "320px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#f8f6f6"
      }}>
        {/* Header */}
        <header style={{
          height: "76px",
          background: "linear-gradient(90deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingLeft: "32px",
          paddingRight: "32px",
          position: "sticky",
          top: 0,
          zIndex: 999
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "28px",
                  position: "relative",
                  color: "white"
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    width: "22px",
                    height: "22px",
                    background: "#ec5b13",
                    borderRadius: "50%",
                    border: "2px solid #7c3aed",
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>{unreadCount}</span>
                )}
              </button>

              {/* Notification Menu */}
              {showNotif && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 998 }}
                    onClick={() => setShowNotif(false)}
                  />
                  <div style={{
                    position: "absolute",
                    top: "40px",
                    right: "0",
                    width: "320px",
                    background: "white",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 999,
                    overflow: "hidden"
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: "600", fontSize: "14px", color: "#1e293b", display: "flex", justifyContent: "space-between" }}>
                      <span>Notifications</span>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>{unreadCount} New</span>
                    </div>
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                          No new notifications
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowNotif(false);
                              if (n.link) navigate(n.link);
                            }}
                            style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontWeight: "600" }}>{n.title}</p>
                            </div>
                            <p style={{ margin: "0", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div style={{ padding: "10px", textAlign: "center", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#ec5b13", cursor: "pointer", fontWeight: "600" }} onClick={() => setNotifications([])}>
                        Mark all as read
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)" }}></div>

            {/* Profile Dropdown */}
            <div style={{ position: "relative" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              >
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "white" }}>{auth?.username || "Guest"}</p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "rgba(255,255,255,0.8)", textTransform: "capitalize" }}>{auth?.role || "Member"} Portal</p>
                </div>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: auth?.avatar ? "transparent" : "rgba(255,255,255,0.2)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "20px",
                  border: "2px solid rgba(255,255,255,0.5)",
                  overflow: "hidden"
                }}>
                  {auth?.avatar ? (
                    <img src={auth.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    auth?.username?.charAt(0).toUpperCase() || "G"
                  )}
                </div>
              </div>

              {showProfile && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 998 }}
                    onClick={() => setShowProfile(false)}
                  />
                  <div style={{
                    position: "absolute",
                    top: "50px",
                    right: "0",
                    width: "220px",
                    background: "white",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 999,
                    overflow: "hidden",
                    padding: "8px 0"
                  }}>
                    {/* Header Info */}
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", marginBottom: "8px", background: "#f8fafc" }}>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>{auth?.username || "Guest"}</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>{auth?.role || "Member"} Account</p>
                    </div>

                    {/* Menu Items */}
                    {[
                      { icon: "👤", label: "Profile" },
                      ...(auth?.role === 'user' ? [{ icon: "❤️", label: "My Favorite" }] : []),
                      { icon: "⚙️", label: "Settings" },
                      { icon: "🚪", label: "Logout", isLogout: true }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setShowProfile(false);
                          if (item.label === "Settings") { navigate('/settings'); }
                          if (item.isLogout) { handleLogout(); }
                        }}
                        style={{
                          padding: "10px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          cursor: "pointer",
                          fontSize: "15px",
                          color: item.isLogout ? "#ef4444" : "#475569",
                          fontWeight: "500",
                          transition: "background 0.2s",
                          borderTop: item.isLogout ? "1px solid #e2e8f0" : "none",
                          marginTop: item.isLogout ? "8px" : "0"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        <span style={{ fontSize: "18px", opacity: 0.8 }}>{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "0"
        }}>
          {children}
        </div>
      </main>

      {/* Floating Support Chat */}
      <SupportChatWidget auth={auth} />

    </div>
  );
}

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
      <Layout
        auth={auth}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        handleLogout={handleLogout}
      >

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
            path="/staff/requests"
            element={
              <ProtectedRoute auth={auth} allowedRole="staff">
                <StaffBorrowRequests auth={auth} />
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
            path="/category/:id"
            element={
              <ProtectedRoute auth={auth} allowedRole="staff">
                <StaffCategoryBooks auth={auth} />
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
                <UserBorrowHistory auth={auth} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/books/:id"
            element={
              <ProtectedRoute auth={auth} allowedRole="user">
                <UserBookDetails auth={auth} />
              </ProtectedRoute>
            }
          />

          <Route path="/settings" element={<ProtectedRoute auth={auth}><UserSettings auth={auth} setAuth={setAuth} handleLogout={handleLogout} /></ProtectedRoute>} />

        </Routes>

      </Layout>

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: #f8f6f6;
        }
        a {
          transition: all 0.2s ease;
        }
      `}</style>

    </Router>
  );
}

export default App;