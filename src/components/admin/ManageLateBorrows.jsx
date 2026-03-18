import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLateBorrows } from './UseLateBorrows';
import { Table, Badge, Button, Form, Row, Col, Spinner } from 'react-bootstrap';

const API = 'http://localhost:9999';

const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : '—';

const daysLate = (dueDate, returnDate) => {
  if (!dueDate || !returnDate) return 0;
  const diff = new Date(returnDate) - new Date(dueDate);
  return Math.max(0, Math.ceil(diff / 86400000));
};

export default function ManageLateBorrows() {
  const [rows, setRows]         = useState([]);
  const [users, setUsers]       = useState({});
  const [books, setBooks]       = useState({});
  const [settings, setSettings] = useState({ finePerDay: 5000 });
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('late');
  const [search, setSearch]     = useState('');
  const [sortDir, setSortDir]   = useState('desc');

  const { syncAll } = useLateBorrows();

  const load = useCallback(async () => {
    setLoading(true);
    await syncAll();
    try {
      const [bRes, uRes, bkRes, sRes] = await Promise.all([
        axios.get(`${API}/borrows`),
        axios.get(`${API}/users`),
        axios.get(`${API}/books`),
        axios.get(`${API}/settings/1`),
      ]);
      setUsers(Object.fromEntries(uRes.data.map((u) => [u.id, u])));
      setBooks(Object.fromEntries(bkRes.data.map((b) => [b.id, b])));
      setSettings(sRes.data);
      setRows(bRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [syncAll]);

  useEffect(() => { load(); }, [load]);

  const visible = rows
    .filter((r) => {
      if (filter === 'late')     return r.status === 'late';
      if (filter === 'returned') return r.status === 'returned' || r.status === 'late';
      return true;
    })
    .filter((r) => {
      if (!search) return true;
      const u = users[r.userId];
      const b = books[r.bookId];
      const haystack = [u?.username, u?.email, b?.title, r.receiptCode, r.status]
        .join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const da = daysLate(a.dueDate, a.returnDate);
      const db = daysLate(b.dueDate, b.returnDate);
      return sortDir === 'desc' ? db - da : da - db;
    });

  const totalFine = visible
    .filter((r) => r.status === 'late')
    .reduce((s, r) => s + daysLate(r.dueDate, r.returnDate) * settings.finePerDay, 0);

  const lateCount = rows.filter((r) => r.status === 'late').length;

  return (
    <div className="p-4 bg-transparent">
        <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
                <h1 className="page-title mb-1">⚠ Late Returns</h1>
                <p className="text-muted mb-0">
                    Fine rate: <strong className="text-primary">{settings.finePerDay.toLocaleString('vi-VN')}đ / day</strong>
                </p>
            </div>
            <div className="d-flex gap-3">
                <div className="text-end">
                    <span className="small text-muted d-block fw-600 text-uppercase mb-1">Total Active Late</span>
                    <h3 className="fw-bold text-danger mb-0">{lateCount}</h3>
                </div>
                <div style={{ width: "1px", height: "40px", background: "var(--border-color)" }}></div>
                <div className="text-end">
                    <span className="small text-muted d-block fw-600 text-uppercase mb-1">Current Fine Total</span>
                    <h3 className="fw-bold text-warning mb-0">{totalFine.toLocaleString('vi-VN')}đ</h3>
                </div>
            </div>
        </div>

        <Row className="g-3 mb-4 align-items-end">
            <Col md={4}>
                <Form.Group>
                    <Form.Label className="small fw-600 text-muted">Search Records</Form.Label>
                    <Form.Control 
                        placeholder="Name, book, or receipt..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-0 shadow-sm bg-white py-2 px-3"
                        style={{ borderRadius: "10px" }}
                    />
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group>
                    <Form.Label className="small fw-600 text-muted">Status Filter</Form.Label>
                    <div className="d-flex gap-2">
                        {[
                            { key: 'late',     label: '⚠ Late' },
                            { key: 'returned', label: '✓ Returned' },
                            { key: 'all',      label: '☰ All' },
                        ].map(({ key, label }) => (
                            <Button 
                                key={key}
                                variant={filter === key ? "primary" : "outline-secondary"}
                                size="sm"
                                className="border-0 px-3 fw-600 shadow-sm"
                                style={{ borderRadius: "20px" }}
                                onClick={() => setFilter(key)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </Form.Group>
            </Col>
            <Col md={4} className="text-end">
                <Button 
                    variant="light" 
                    className="border-0 shadow-sm fw-600 me-2" 
                    style={{ borderRadius: "10px" }}
                    onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                >
                    {sortDir === 'desc' ? 'Sort: Most Late ↓' : 'Sort: Least Late ↑'}
                </Button>
                <Button 
                    variant="light" 
                    className="border-0 shadow-sm" 
                    style={{ borderRadius: "10px" }}
                    onClick={load}
                    disabled={loading}
                >
                    {loading ? <Spinner animation="border" size="sm" /> : '🔄'}
                </Button>
            </Col>
        </Row>

        <div className="card-premium border-0 shadow-sm overflow-hidden" style={{ background: "white" }}>
            <Table hover responsive className="mb-0 overflow-hidden" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                <thead style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                    <tr>
                        <th className="px-4 py-3 border-0">User Info</th>
                        <th className="px-4 py-3 border-0">Book Details</th>
                        <th className="px-4 py-3 border-0 text-center">Due Date</th>
                        <th className="px-4 py-3 border-0 text-center">Days Late</th>
                        <th className="px-4 py-3 border-0 text-center">Calculated Fine</th>
                        <th className="px-4 py-3 border-0 text-end">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2 text-muted mb-0">Syncing late records...</p>
                            </td>
                        </tr>
                    ) : visible.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center py-5 text-muted">
                                🎉 No late records found for the current filter.
                            </td>
                        </tr>
                    ) : (
                        visible.map((r) => {
                            const user = users[r.userId];
                            const book = books[r.bookId];
                            const days = daysLate(r.dueDate, r.returnDate);
                            const fine = days * settings.finePerDay;
                            
                            return (
                                <tr key={r.id} style={{ verticalAlign: "middle" }}>
                                    <td className="px-4 py-4 border-0 border-bottom">
                                        <span className="fw-bold d-block">{user?.username || '—'}</span>
                                        <small className="text-muted">{user?.email || ''}</small>
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom">
                                        <span className="fw-600 d-block">{book?.title || '—'}</span>
                                        {r.receiptCode && <code className="text-danger small">{r.receiptCode}</code>}
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom text-center">
                                        <span className="text-danger fw-bold">{fmt(r.dueDate)}</span>
                                        <small className="text-muted d-block h-min">Requested: {fmt(r.requestDate)}</small>
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom text-center">
                                        {days > 0 ? (
                                            <Badge bg="danger" className="px-2 py-1">+{days} days</Badge>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom text-center">
                                        <span className={fine > 0 ? "fw-bold text-danger" : "text-muted"}>
                                            {fine > 0 ? `${fine.toLocaleString('vi-VN')}đ` : '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom text-end">
                                        <Badge 
                                            pill 
                                            bg={r.status === 'late' ? 'danger' : r.status === 'returned' ? 'success' : 'secondary'}
                                            className="px-3 py-2 text-uppercase"
                                            style={{ fontSize: "10px" }}
                                        >
                                            {r.status === 'late' ? 'Overdue' : r.status === 'returned' ? 'Resolved' : r.status}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </Table>
            {!loading && visible.length > 0 && (
                <div className="bg-light px-4 py-2 border-top small text-muted">
                    Showing <strong>{visible.length}</strong> / <strong>{rows.length}</strong> records.
                </div>
            )}
        </div>
    </div>
  );
}
