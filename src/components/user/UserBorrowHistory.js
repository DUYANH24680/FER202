import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button } from 'react-bootstrap';

export default function UserBorrowHistory({ auth }) {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState({});

  const API = "http://localhost:9999";

  /* ---------- FETCH DATA ---------- */
  const fetchData = async () => {
    try {
      const [historyRes, booksRes] = await Promise.all([
        axios.get(`${API}/borrows?userId=${auth.id}`),
        axios.get(`${API}/books`)
      ]);

      setHistory(historyRes.data || []);

      const booksMap = booksRes.data.reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {});
      setBooks(booksMap);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [auth.id]);

  /* ---------- CALCULATE BORROW DAYS ---------- */
  const getBorrowDays = (record) => {
    if (record.status === "rejected") return "-";
    if (!record.approveDate) return "-";
    const start = new Date(record.approveDate);
    const end = record.returnDate ? new Date(record.returnDate) : new Date();

    const diffTime = end - start;
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (record.status === "approved" && !record.returnDate) return "Đang mượn";

    return `${days} ngày`;
  };

  /* ---------- HANDLE RETURN ---------- */
  const handleReturn = async (record) => {
    try {
      const book = books[record.bookId];

      // update borrow
      await axios.patch(`${API}/borrows/${record.id}`, {
        status: "returned",
        returnDate: new Date().toISOString()
      });

      // update book
      if (book) {
        await axios.patch(`${API}/books/${book.id}`, {
          status: null,
          available: true
        });
      }

      fetchData();

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Lịch sử mượn sách</h2>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Request Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map(record => (
            <tr key={record.id}>
              <td>{books[record.bookId]?.title || 'Unknown'}</td>
              <td>{books[record.bookId]?.author || 'Unknown'}</td>
              <td>{record.status}</td>
              <td>{getBorrowDays(record)}</td>
              <td>
                {record.status === "approved" && !record.returnDate && (
                  <Button
                    variant="primary"
                    onClick={() => handleReturn(record)}
                  >
                    Return
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}