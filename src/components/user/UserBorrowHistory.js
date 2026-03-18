import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Badge, Spinner } from 'react-bootstrap';

export default function UserBorrowHistory({ auth }) {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
    
    fetchData();
  }, [auth.id]);

  return (
    <div className="p-4 bg-transparent">
        <div className="mb-4">
            <h1 className="page-title mb-1">⏱️ Borrowing History</h1>
            <p className="text-muted mb-0">Track your past and present book requests.</p>
        </div>

        <div className="card-premium border-0 shadow-sm overflow-hidden" style={{ background: "white" }}>
            <Table hover responsive className="mb-0 overflow-hidden" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                <thead style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                    <tr>
                        <th className="px-4 py-3 border-0">Book Details</th>
                        <th className="px-4 py-3 border-0 text-center">Request Date</th>
                        <th className="px-4 py-3 border-0 text-center">Return Date</th>
                        <th className="px-4 py-3 border-0 text-end">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2 text-muted mb-0">Loading your history...</p>
                            </td>
                        </tr>
                    ) : history.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center py-5 text-muted">
                                📚 You haven't borrowed any books yet.
                            </td>
                        </tr>
                    ) : (
                        history.map(record => (
                            <tr key={record.id} style={{ verticalAlign: "middle" }}>
                                <td className="px-4 py-4 border-0 border-bottom">
                                    <div className="d-flex align-items-center gap-3">
                                        <img 
                                            src={books[record.bookId]?.image} 
                                            alt="book" 
                                            style={{ width: "45px", height: "65px", objectFit: "cover", borderRadius: "6px" }} 
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/45x65?text=Book'}
                                        />
                                        <div>
                                            <span className="fw-bold d-block">{books[record.bookId]?.title || 'Unknown Book'}</span>
                                            <small className="text-muted">{books[record.bookId]?.author || 'Unknown Author'}</small>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-center">
                                    <span className="text-muted">{new Date(record.requestDate).toLocaleDateString('vi-VN')}</span>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-center">
                                    <span className="text-muted">{record.returnDate ? new Date(record.returnDate).toLocaleDateString('vi-VN') : '—'}</span>
                                </td>
                                <td className="px-4 py-4 border-0 border-bottom text-end">
                                    <Badge 
                                        pill 
                                        bg={record.status === 'approved' ? 'primary' : record.status === 'pending' ? 'warning' : record.status === 'returned' ? 'success' : 'secondary'}
                                        className="px-3 py-2 text-uppercase"
                                        style={{ fontSize: "10px", letterSpacing: "0.5px" }}
                                    >
                                        {record.status}
                                    </Badge>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
            {!loading && history.length > 0 && (
                <div className="bg-light px-4 py-2 border-top small text-muted">
                    Total records: <strong>{history.length}</strong>
                </div>
            )}
        </div>
    </div>
  );
}
