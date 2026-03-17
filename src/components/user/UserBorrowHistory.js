<<<<<<< HEAD:src/components/user/UserBorrowHistory.js
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
=======
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Badge, Container } from 'react-bootstrap';

function BorrowHistory({ auth }) {
    const [history, setHistory] = useState([]);
    const [books, setBooks] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, booksRes] = await Promise.all([
                    axios.get(`http://localhost:9999/borrows?userId=${auth.id}`),
                    axios.get('http://localhost:9999/books')
                ]);
                
                setHistory(historyRes.data);
                // Map books by ID for fast lookup
                const bookMap = booksRes.data.reduce((acc, book) => {
                    acc[book.id] = book;
                    return acc;
                }, {});
                setBooks(bookMap);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        fetchData();
    }, [auth.id]);

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Borrowing History</h2>
            <Table striped bordered hover responsive className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Book Title</th>
                        <th>Author</th>
                        <th>Barcode</th>
                        <th>Status</th>
                        <th>Request Date</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length > 0 ? (
                        history.map(record => {
                            const bookInfo = books[record.bookId];
                            return (
                                <tr key={record.id}>
                                    <td className="fw-bold">{bookInfo?.title || 'Unknown Title'}</td>
                                    <td>{bookInfo?.author || 'N/A'}</td>
                                    <td>
                                        <code className="text-primary fw-bold">
                                            {record.barcode || bookInfo?.barcode || 'N/A'}
                                        </code>
                                    </td>
                                    <td>
                                        <Badge bg={record.status === 'approved' ? 'success' : 'warning'} text={record.status === 'pending' ? 'dark' : ''}>
                                            {record.status}
                                        </Badge>
                                    </td>
                                    <td>{new Date(record.requestDate).toLocaleDateString()}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan="5" className="text-center">No borrowing history found.</td></tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
}

export default BorrowHistory;
>>>>>>> origin/ThanhDH:src/components/BorrowHistory.js
