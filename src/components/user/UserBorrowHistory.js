import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Badge, Spinner, Button } from 'react-bootstrap';
import { FaTrash, FaHistory, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function UserBorrowHistory({ auth }) {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, booksRes] = await Promise.all([
        axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
        axios.get('http://localhost:9999/books')
      ]);
      
      setHistory(historyRes.data);
      setBooks(booksRes.data.reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {}));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [auth.id]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
        await axios.delete(`http://localhost:9999/borrows/${id}`);
        fetchData();
    } catch (err) {
        alert("Failed to cancel request.");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Delete this history record?")) return;
    try {
        await axios.delete(`http://localhost:9999/borrows/${id}`);
        fetchData();
    } catch (err) {
        alert("Failed to delete record.");
    }
  };

  const handleClearHistory = async () => {
    const deletable = history.filter(h => ['returned', 'rejected', 'cancelled'].includes(h.status));
    if (deletable.length === 0) {
        alert("No completed records to clear.");
        return;
    }
    if (!window.confirm(`Clear all ${deletable.length} completed records?`)) return;
    try {
        await Promise.all(deletable.map(h => axios.delete(`http://localhost:9999/borrows/${h.id}`)));
        fetchData();
    } catch (err) {
        alert("Failed to clear some records.");
    }
  };

  const getStats = () => {
    const pending = history.filter(h => h.status === 'pending').length;
    const active = history.filter(h => h.status === 'approved').length;
    const returned = history.filter(h => h.status === 'returned').length;
    const rejected = history.filter(h => h.status === 'rejected' || h.status === 'cancelled').length;
    return { pending, active, returned, rejected };
  };

  const stats = getStats();

  return (
    <div className="p-4 bg-transparent animate-in">
        <div className="mb-4 d-flex justify-content-between align-items-center">
            <div>
                <h1 className="page-title mb-1 d-flex align-items-center text-dark fw-bold">
                    <FaHistory className="me-3 text-primary" /> Borrowing History
                </h1>
                <p className="text-muted mb-0">Track your past and present book requests.</p>
            </div>
            {history.some(h => ['returned', 'rejected', 'cancelled'].includes(h.status)) && (
                <Button variant="outline-danger" size="sm" className="rounded-pill px-3 fw-bold" onClick={handleClearHistory}>
                    <FaTrash className="me-2" /> Clear Completed
                </Button>
            )}
        </div>

        {/* Stats Row */}
        <div className="row mb-4">
            <div className="col-lg-4 col-sm-6 mb-3">
                <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-warning h-100">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <p className="text-muted small fw-bold mb-0">PENDING</p>
                            <h3 className="fw-bold mb-0">{stats.pending}</h3>
                        </div>
                        <FaClock className="text-warning h4 mb-0 opacity-50" />
                    </div>
                </div>
            </div>
            <div className="col-lg-4 col-sm-6 mb-3">
                <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-primary h-100">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <p className="text-muted small fw-bold mb-0">ACTIVE</p>
                            <h3 className="fw-bold mb-0">{stats.active}</h3>
                        </div>
                        <FaClock className="text-primary h4 mb-0 opacity-50" />
                    </div>
                </div>
            </div>
            <div className="col-lg-4 col-sm-6 mb-3">
                <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-danger h-100">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <p className="text-muted small fw-bold mb-0">REJECTED</p>
                            <h3 className="fw-bold mb-0">{stats.rejected}</h3>
                        </div>
                        <FaTrash className="text-danger h4 mb-0 opacity-50" />
                    </div>
                </div>
            </div>
        </div>

        <div className="card-premium border-0 shadow-sm overflow-hidden rounded-4" style={{ background: "white" }}>
            <Table hover responsive className="mb-0 overflow-hidden" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                <thead style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                    <tr>
                        <th className="px-4 py-3 border-0">Book Details</th>
                        <th className="px-4 py-3 border-0 text-center text-nowrap">Request Date</th>
                        <th className="px-4 py-3 border-0 text-center text-nowrap">Quantity</th>
                        <th className="px-4 py-3 border-0 text-center">Amount</th>
                        <th className="px-4 py-3 border-0 text-end">Status</th>
                        <th className="px-4 py-3 border-0 text-end">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2 text-muted mb-0">Loading your history...</p>
                            </td>
                        </tr>
                    ) : history.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="text-center py-5 text-muted">
                                📚 You haven't borrowed any books yet.
                            </td>
                        </tr>
                    ) : (
                        [...history].reverse().map(record => (
                            <tr key={record.id} style={{ verticalAlign: "middle" }}>
                                <td className="px-4 py-4 border-0 border-bottom">
                                    <div className="d-flex align-items-center gap-3">
                                        <img 
                                            src={books[record.bookId]?.image} 
                                            alt="book" 
                                            style={{ width: "45px", height: "65px", objectFit: "cover", borderRadius: "6px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} 
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/45x65?text=Book'}
                                        />
                                        <div>
                                            <span className="fw-bold d-block text-dark">{books[record.bookId]?.title || 'Unknown Book'}</span>
                                            <small className="text-muted">{books[record.bookId]?.author || 'Unknown Author'}</small>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-center">
                                    <span className="text-muted small">{new Date(record.requestDate).toLocaleDateString()}</span>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-center">
                                    <Badge bg="light" className="text-dark border px-2 py-1">{record.quantity || 1}</Badge>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-center fw-bold text-success">
                                    {(record.totalPrice || 0).toLocaleString()} VND
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-end">
                                    <Badge 
                                        pill 
                                        bg={record.status === 'approved' ? 'primary' : record.status === 'pending' ? 'warning text-dark' : record.status === 'returned' ? 'success' : record.status === 'rejected' ? 'danger' : 'secondary'}
                                        className="px-3 py-2 text-uppercase"
                                        style={{ fontSize: "10px", letterSpacing: "0.5px" }}
                                    >
                                        {record.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-end">
                                    {record.status === 'pending' ? (
                                        <Button 
                                            variant="link" 
                                            className="text-danger p-0 text-decoration-none fw-bold small"
                                            onClick={() => handleCancel(record.id)}
                                        >
                                            Cancel
                                        </Button>
                                    ) : ['returned', 'rejected', 'cancelled'].includes(record.status) ? (
                                        <Button 
                                            variant="link" 
                                            className="text-muted p-0 text-decoration-none fw-bold small"
                                            onClick={() => handleDeleteRecord(record.id)}
                                        >
                                            Delete
                                        </Button>
                                    ) : null}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
            {!loading && history.length > 0 && (
                <div className="bg-light px-4 py-3 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Total records: <strong>{history.length}</strong></span>
                    <span className="text-muted x-small italic text-uppercase" style={{ letterSpacing: '1px' }}>Premium Library Access</span>
                </div>
            )}
        </div>
    </div>
  );
}
