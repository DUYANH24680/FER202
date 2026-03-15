import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button } from 'react-bootstrap';

export default function StaffBorrowRequests({ auth }) {
  const [requests, setRequests] = useState([]);
  const [books, setBooks] = useState([]); // State for books

  useEffect(() => {
    // Fetch borrow requests from the JSON Server
    axios.get('http://localhost:9999/borrows').then((res) => setRequests(res.data));
    
    // Fetch books data
    axios.get('http://localhost:9999/books').then((res) => setBooks(res.data));
  }, []);

  const handleApprove = async (id) => {
    try {
      // Find the request and the associated book
      const request = requests.find(r => r.id === id);
      if (!request) return;

      // 1. Approve the borrow request
      await axios.patch(`http://localhost:9999/borrows/${id}`, { status: 'approved' });

      // 2. Update the book's status to borrowed
      await axios.patch(`http://localhost:9999/books/${request.bookId}`, {
        available: false,
        status: 'borrowed',
        statusDate: new Date().toISOString()
      });

      // Update local state for requests
      setRequests(requests.map(req => 
        req.id === id ? { ...req, status: 'approved' } : req
      ));

      // Refresh the local books list so the UI reflects the change (optional but good practice)
      const res = await axios.get('http://localhost:9999/books');
      setBooks(res.data);
      
    } catch (err) {
      console.error("Failed to approve request and update book:", err);
    }
  };

  const handleReject = (id) => {
    // Code to handle rejection of borrow requests
    axios.patch(`http://localhost:9999/borrows/${id}`, { status: 'rejected' })
      .then(() => setRequests(requests.map(request => 
        request.id === id ? { ...request, status: 'rejected' } : request
      )));
  };

  const getBookName = (bookId) => {
    const book = books.find(book => book.id === bookId);
    return book ? book.title : 'Book not found'; // Return book title or 'Book not found'
  };

  
  return (
    <div>
      <h2>Borrow Requests</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Book Title</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.userId}</td>
              <td>{getBookName(request.bookId)}</td> {/* Display book title */}
              <td>{request.status}</td>
              <td>
                {request.status === 'pending' && (
                  <>
                    <Button variant="success" onClick={() => handleApprove(request.id)}>Approve</Button>{' '}
                    <Button variant="danger" onClick={() => handleReject(request.id)}>Reject</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
