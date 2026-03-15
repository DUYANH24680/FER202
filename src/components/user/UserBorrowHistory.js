import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap';

export default function UserBorrowHistory({ auth }) {
  const [history, setHistory] = useState([]);
  const [books, setBooks] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const [historyRes, booksRes] = await Promise.all([
        axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
        axios.get('http://localhost:9999/books')
      ]);
      
      setHistory(historyRes.data);
      setBooks(booksRes.data.reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {}));
    };
    
    fetchData();
  }, [auth.id]);

  return (
    <div className="container mt-4">
      <h2>Borrowing History</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Request Date</th>
          </tr>
        </thead>
        <tbody>
          {history.map(record => (
            <tr key={record.id}>
              <td>{books[record.bookId]?.title || 'Unknown'}</td>
              <td>{books[record.bookId]?.author || 'Unknown'}</td>
              <td>{record.status}</td>
              <td>{new Date(record.requestDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}