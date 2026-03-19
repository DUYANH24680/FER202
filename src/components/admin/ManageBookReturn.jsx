import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Spinner, Alert, Badge, Form, InputGroup, Table, Button, Modal
} from "react-bootstrap";
import { FaSearch, FaExclamationTriangle, FaBook, FaUser } from "react-icons/fa";

const STATUS_LABELS = {
    all: "All",
    late: "Late",
    damaged: "Damaged",
    lost: "Lost",
    returned: "Returned"
};

const STATUS_COLORS = {
    late: "warning",
    damaged: "danger",
    lost: "dark",
    returned: "success",
    approved: "primary",
    pending: "secondary"
};

function ManageBookReturn() {
    const [borrows, setBorrows] = useState([]);
    const [users, setUsers] = useState({});
    const [books, setBooks] = useState({});
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedBorrow, setSelectedBorrow] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        fetchAll();
    }, []);

    // Tự động cập nhật status "approved" → "late" nếu quá hạn
    useEffect(() => {
        if (!settings || borrows.length === 0) return;

        borrows.forEach(async (borrow) => {
            if (borrow.status !== "approved") return;

            const requestDate = new Date(borrow.requestDate);
            const now = new Date();
            const diffDays = Math.floor((now - requestDate) / (1000 * 60 * 60 * 24));

            if (diffDays > settings.maxBorrowDays) {
                const updated = { ...borrow, status: "late" };
                await axios.put(`http://localhost:9999/borrows/${borrow.id}`, updated);
                setBorrows(prev => prev.map(b => b.id === borrow.id ? updated : b));
            }
        });
    }, [borrows.length, settings]);

    const fetchAll = async () => {
        setLoading(true);
        setError("");
        try {
            const [borrowsRes, usersRes, booksRes, settingsRes] = await Promise.all([
                axios.get("http://localhost:9999/borrows"),
                axios.get("http://localhost:9999/users"),
                axios.get("http://localhost:9999/books"),
                axios.get("http://localhost:9999/settings/1")
            ]);

            setBorrows(borrowsRes.data);

            const usersMap = {};
            usersRes.data.forEach(u => { usersMap[String(u.id)] = u; });
            setUsers(usersMap);

            const booksMap = {};
            booksRes.data.forEach(b => { booksMap[String(b.id)] = b; });
            setBooks(booksMap);

            setSettings(settingsRes.data);
        } catch (err) {
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const calcLateInfo = (borrow) => {
        if (!settings || !borrow.requestDate) return { isLate: false, daysLate: 0, fine: 0 };

        const requestDate = new Date(borrow.requestDate);
        const returnDate = borrow.returnDate ? new Date(borrow.returnDate) : new Date();

        const diffMs = returnDate - requestDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const daysLate = diffDays - settings.maxBorrowDays;
        const isLate = daysLate > 0;
        const fine = isLate ? daysLate * settings.finePerDay : 0;

        return { isLate, daysLate: isLate ? daysLate : 0, fine };
    };

    const getDisplayStatus = (borrow) => {
        if (borrow.status === "returned") return "returned";
        if (borrow.status === "lost") return "lost";
        if (borrow.status === "damaged") return "damaged";
        if (borrow.status === "late") return "late";
        const { isLate } = calcLateInfo(borrow);
        if (isLate && borrow.status === "approved") return "late";
        return borrow.status;
    };

    const formatVND = (amount) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    };

    const calcDueDate = (borrow) => {
        if (!settings || !borrow.requestDate) return "—";
        const due = new Date(borrow.requestDate);
        due.setDate(due.getDate() + settings.maxBorrowDays);
        return due.toLocaleDateString("vi-VN");
    };

    const filteredBorrows = borrows.filter(b => {
        const displayStatus = getDisplayStatus(b);

        if (filterStatus !== "all" && displayStatus !== filterStatus) return false;

        const relevantStatuses = ["approved", "returned", "lost", "damaged", "late"];
        if (!relevantStatuses.includes(displayStatus)) return false;

        if (search.trim()) {
            const user = users[String(b.userId)];
            const book = books[String(b.bookId)];
            const query = search.toLowerCase();
            const matchUser = user?.username?.toLowerCase().includes(query) ||
                user?.fullName?.toLowerCase().includes(query);
            const matchBook = book?.title?.toLowerCase().includes(query);
            if (!matchUser && !matchBook) return false;
        }

        return true;
    });

    const openUpdateModal = (borrow) => {
        setSelectedBorrow(borrow);
        setNewStatus(borrow.status);
        setSuccessMsg("");
        setShowModal(true);
    };

    const handleSaveStatus = async () => {
        if (!selectedBorrow || !newStatus) return;
        setSaving(true);
        try {
            const updatedBorrow = { ...selectedBorrow, status: newStatus };
            await axios.put(`http://localhost:9999/borrows/${selectedBorrow.id}`, updatedBorrow);
            setBorrows(prev =>
                prev.map(b => b.id === selectedBorrow.id ? updatedBorrow : b)
            );
            setSuccessMsg("Status updated successfully!");
            setTimeout(() => {
                setShowModal(false);
                setSuccessMsg("");
            }, 1200);
        } catch (err) {
            setError("Error updating status.");
        } finally {
            setSaving(false);
        }
    };

    const counts = {
        late: borrows.filter(b => getDisplayStatus(b) === "late").length,
        damaged: borrows.filter(b => getDisplayStatus(b) === "damaged").length,
        lost: borrows.filter(b => getDisplayStatus(b) === "lost").length,
        returned: borrows.filter(b => getDisplayStatus(b) === "returned").length,
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading data...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-4 px-4">
            <div className="d-flex align-items-center mb-4 gap-3">
                <FaBook size={28} color="#ec5b13" />
                <h3 className="mb-0 fw-bold">Manage Book Returns</h3>
            </div>

            {error && (
                <Alert variant="danger" onClose={() => setError("")} dismissible>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                {[
                    { key: "late", label: "Late Returns", icon: "⚠️", color: "#f59e0b", bg: "#fffbeb" },
                    { key: "damaged", label: "Damaged Books", icon: "📕", color: "#ef4444", bg: "#fef2f2" },
                    { key: "lost", label: "Lost Books", icon: "❌", color: "#374151", bg: "#f9fafb" },
                    { key: "returned", label: "Returned", icon: "✅", color: "#10b981", bg: "#ecfdf5" },
                ].map(card => (
                    <div className="col-md-3 col-6" key={card.key}>
                        <div
                            style={{
                                background: card.bg,
                                border: `1px solid ${card.color}30`,
                                borderRadius: "12px",
                                padding: "16px 20px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: filterStatus === card.key ? `0 0 0 3px ${card.color}40` : "none"
                            }}
                            onClick={() => setFilterStatus(filterStatus === card.key ? "all" : card.key)}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{card.label}</p>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "28px", fontWeight: "800", color: card.color }}>{counts[card.key]}</p>
                                </div>
                                <span style={{ fontSize: "32px" }}>{card.icon}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
                <div className="d-flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <Button
                            key={key}
                            size="sm"
                            variant={filterStatus === key ? "primary" : "outline-secondary"}
                            onClick={() => setFilterStatus(key)}
                            style={{ borderRadius: "20px", fontWeight: filterStatus === key ? 600 : 400 }}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                <InputGroup style={{ maxWidth: "300px", marginLeft: "auto" }}>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                        placeholder="Search user or book title..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </InputGroup>
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <Table hover responsive className="mb-0">
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>#</th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                                <FaUser className="me-1" /> User Info
                            </th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                                <FaBook className="me-1" /> Book Borrowed
                            </th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Borrow Date</th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Due Date</th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Days Late</th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Fine</th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Status</th>
                            <th style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBorrows.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-5 text-muted">
                                    <FaExclamationTriangle size={24} className="mb-2 d-block mx-auto" />
                                    No matching records found
                                </td>
                            </tr>
                        ) : (
                            filteredBorrows.map((borrow, idx) => {
                                const user = users[String(borrow.userId)];
                                const book = books[String(borrow.bookId)];
                                const displayStatus = getDisplayStatus(borrow);
                                const { isLate, daysLate, fine } = calcLateInfo(borrow);

                                let extraFine = 0;
                                let extraFineLabel = "";
                                if (borrow.status === "damaged" && settings?.damagedbook) {
                                    extraFine = settings.damagedbook * (borrow.quantity || 1);
                                    extraFineLabel = `+ ${formatVND(extraFine)} (damaged)`;
                                }
                                if (borrow.status === "lost" && settings?.lostbook) {
                                    extraFine = settings.lostbook * (borrow.quantity || 1);
                                    extraFineLabel = `+ ${formatVND(extraFine)} (lost)`;
                                }

                                const totalFine = fine + extraFine;

                                return (
                                    <tr key={borrow.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{idx + 1}</td>

                                        <td style={{ padding: "14px 16px" }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: "50%",
                                                    background: "#e0e7ff", color: "#4f46e5",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: 15, flexShrink: 0, overflow: "hidden"
                                                }}>
                                                    {user?.avatar
                                                        ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        : user?.username?.charAt(0).toUpperCase() || "?"
                                                    }
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
                                                        {user?.fullName || user?.username || `User #${borrow.userId}`}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                                                        @{user?.username || "—"} · {user?.phone || ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td style={{ padding: "14px 16px" }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#1e293b", maxWidth: 200 }}>
                                                {book?.title || `Book #${borrow.bookId}`}
                                            </p>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                                                {book?.author || "—"} · x{borrow.quantity || 1}
                                            </p>
                                        </td>

                                        <td style={{ padding: "14px 16px", fontSize: "14px", color: "#475569" }}>
                                            {formatDate(borrow.requestDate)}
                                        </td>

                                        <td style={{ padding: "14px 16px", fontSize: "14px", color: isLate ? "#ef4444" : "#475569", fontWeight: isLate ? 600 : 400 }}>
                                            {calcDueDate(borrow)}
                                        </td>

                                        <td style={{ padding: "14px 16px" }}>
                                            {daysLate > 0 ? (
                                                <span style={{
                                                    background: "#fef2f2", color: "#ef4444",
                                                    padding: "3px 10px", borderRadius: "20px",
                                                    fontWeight: 700, fontSize: "13px"
                                                }}>
                                                    +{daysLate} days
                                                </span>
                                            ) : (
                                                <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                                            )}
                                        </td>

                                        <td style={{ padding: "14px 16px" }}>
                                            {totalFine > 0 ? (
                                                <div>
                                                    <span style={{ fontWeight: 700, color: "#ef4444", fontSize: "14px" }}>
                                                        {formatVND(totalFine)}
                                                    </span>
                                                    {extraFineLabel && (
                                                        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
                                                            {fine > 0 && `${formatVND(fine)} (late) `}{extraFineLabel}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: "#10b981", fontWeight: 600 }}>0 ₫</span>
                                            )}
                                        </td>

                                        <td style={{ padding: "14px 16px" }}>
                                            <Badge
                                                bg={STATUS_COLORS[displayStatus] || "secondary"}
                                                style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px" }}
                                            >
                                                {displayStatus === "late" && "⚠ Late"}
                                                {displayStatus === "damaged" && "📕 Damaged"}
                                                {displayStatus === "lost" && "❌ Lost"}
                                                {displayStatus === "returned" && "✅ Returned"}
                                                {displayStatus === "approved" && "✔ Borrowing"}
                                            </Badge>
                                        </td>

                                        <td style={{ padding: "14px 16px" }}>
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => openUpdateModal(borrow)}
                                                style={{ borderRadius: "8px", fontSize: "13px" }}
                                            >
                                                Update
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </div>

            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "12px" }}>
                Showing {filteredBorrows.length} / {borrows.filter(b => ["approved", "returned", "lost", "damaged", "late"].includes(getDisplayStatus(b))).length} records
            </p>

            {/* Update Status Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: "18px", fontWeight: 700 }}>
                        Update Borrow Status
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {successMsg && <Alert variant="success">{successMsg}</Alert>}

                    {selectedBorrow && (() => {
                        const user = users[String(selectedBorrow.userId)];
                        const book = books[String(selectedBorrow.bookId)];
                        const { daysLate, fine } = calcLateInfo(selectedBorrow);
                        return (
                            <div>
                                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
                                    <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                                        <strong>Borrower:</strong> {user?.fullName || user?.username || "—"}
                                    </p>
                                    <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                                        <strong>Book:</strong> {book?.title || `#${selectedBorrow.bookId}`}
                                    </p>
                                    <p style={{ margin: "0 0 6px 0", fontSize: "14px" }}>
                                        <strong>Due Date:</strong> {calcDueDate(selectedBorrow)}
                                    </p>
                                    {daysLate > 0 && (
                                        <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#ef4444" }}>
                                            <strong>Days Late:</strong> {daysLate} days → Fine: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(fine)}
                                        </p>
                                    )}
                                </div>

                                <Form.Group>
                                    <Form.Label className="fw-bold">New Status</Form.Label>
                                    <Form.Select
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value)}
                                    >
                                        <option value="approved">✔ Borrowing (Approved)</option>
                                        <option value="returned">✅ Returned</option>
                                        <option value="damaged">📕 Damaged</option>
                                        <option value="lost">❌ Lost</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        );
                    })()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveStatus} disabled={saving}>
                        {saving ? <Spinner size="sm" animation="border" /> : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ManageBookReturn;
