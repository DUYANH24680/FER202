import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Badge, Spinner, Button } from 'react-bootstrap';
import { FaTrash, FaHistory, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function UserBorrowHistory({ auth }) {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState({});
  const [loading, setLoading] = useState(true);

  const API = "http://localhost:9999";

  // ---------- FETCH DATA ----------
  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, booksRes] = await Promise.all([
        axios.get(`${API}/borrows?userId=${auth.id}`),
        axios.get(`${API}/books`)
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

  // ---------- CANCEL / DELETE ----------
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      await axios.delete(`${API}/borrows/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to cancel request.");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Delete this history record?")) return;
    try {
      await axios.delete(`${API}/borrows/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  // ---------- RETURN ----------
  const handleReturn = async (record) => {
  if (!window.confirm("Mark this book as returned?")) return;
  try {
    // cập nhật borrow record
    await axios.patch(`${API}/borrows/${record.id}`, {
      status: "returned",
      returnDate: new Date().toISOString()
    });

    // cập nhật sách
    const book = books[record.bookId];
    if (book) {
      await axios.patch(`${API}/books/${book.id}`, {
        available: true,
        status: "available"
      });
    }

    // reload dữ liệu cho user
    fetchData();
  } catch (err) {
    console.error(err);
    alert("Failed to return book.");
  }
};

  // ---------- BORROW DAYS ----------
  const getBorrowDays = (record) => {
    if (!record.approveDate) return "-";
    const start = new Date(record.approveDate);
    const end = record.returnDate ? new Date(record.returnDate) : new Date();
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return record.status === "approved" && !record.returnDate ? "Đang mượn" : `${diffDays} ngày`;
  };

  // ---------- STATS ----------
  const getStats = () => {
    const pending = history.filter(h => h.status === 'pending').length;
    const active = history.filter(h => h.status === 'approved').length;
    const returned = history.filter(h => h.status === 'returned').length;
    const rejected = history.filter(h => ['rejected', 'cancelled'].includes(h.status)).length;
    return { pending, active, returned, rejected };
  };
  const stats = getStats();

  return (
    <div className="p-4 bg-transparent animate-in">
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-warning h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div><p className="text-muted small mb-0">PENDING</p><h3 className="fw-bold mb-0">{stats.pending}</h3></div>
              <FaClock className="text-warning h4 mb-0 opacity-50"/>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-primary h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div><p className="text-muted small mb-0">ACTIVE</p><h3 className="fw-bold mb-0">{stats.active}</h3></div>
              <FaCheckCircle className="text-primary h4 mb-0 opacity-50"/>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-success h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div><p className="text-muted small mb-0">RETURNED</p><h3 className="fw-bold mb-0">{stats.returned}</h3></div>
              <FaCheckCircle className="text-success h4 mb-0 opacity-50"/>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="p-3 bg-white rounded-4 shadow-sm border-start border-4 border-danger h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div><p className="text-muted small mb-0">REJECTED</p><h3 className="fw-bold mb-0">{stats.rejected}</h3></div>
              <FaTrash className="text-danger h4 mb-0 opacity-50"/>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card-premium border-0 shadow-sm overflow-hidden rounded-4" style={{ background: "white" }}>
        <Table hover responsive className="mb-0" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
            <tr>
              <th className="px-4 py-3 border-0">Book Details</th>
              <th className="px-4 py-3 border-0 text-center">Request Date</th>
              <th className="px-4 py-3 border-0 text-center">Quantity</th>
              <th className="px-4 py-3 border-0 text-center">Amount</th>
              <th className="px-4 py-3 border-0 text-end">Status</th>
              <th className="px-4 py-3 border-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted mb-0">Loading your history...</p>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  📚 You haven't borrowed any books yet.
                </td>
              </tr>
            ) : (
              [...history].reverse().map(record => {
                const book = books[record.bookId];
                return (
                  <tr key={record.id} style={{ verticalAlign: "middle" }}>
                    <td className="px-4 py-4 border-0 border-bottom">
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={book?.image} 
                          alt="book" 
                          style={{ width: "45px", height: "65px", objectFit: "cover", borderRadius: "6px" }} 
                          onError={(e) => e.target.src = 'https://via.placeholder.com/45x65?text=Book'}
                        />
                        <div>
                          <span className="fw-bold d-block text-dark">{book?.title || 'Unknown Book'}</span>
                          <small className="text-muted">{book?.author || 'Unknown Author'}</small>
                          <div className="small text-muted">Days: {getBorrowDays(record)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-0 border-bottom text-center">{new Date(record.requestDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4 border-0 border-bottom text-center">{record.quantity || 1}</td>
                    <td className="px-4 py-4 border-0 border-bottom text-center fw-bold text-success">{(record.totalPrice || 0).toLocaleString()} VND</td>
                    <td className="px-4 py-4 border-0 border-bottom text-end">
                      <Badge pill bg={
                        record.status === 'approved' ? 'primary' :
                        record.status === 'pending' ? 'warning text-dark' :
                        record.status === 'returned' ? 'success' :
                        record.status === 'rejected' ? 'danger' : 'secondary'
                      } className="px-3 py-2 text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 border-0 border-bottom text-end">
                      {record.status === 'pending' && (
                        <Button variant="link" className="text-danger p-0 text-decoration-none fw-bold small" onClick={() => handleCancel(record.id)}>Cancel</Button>
                      )}
                      {record.status === 'approved' && !record.returnDate && (
                        <Button variant="link" className="text-primary p-0 text-decoration-none fw-bold small" onClick={() => handleReturn(record)}>Return</Button>
                      )}
                      {['returned','rejected','cancelled'].includes(record.status) && (
                        <Button variant="link" className="text-muted p-0 text-decoration-none fw-bold small" onClick={() => handleDeleteRecord(record.id)}>Delete</Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}