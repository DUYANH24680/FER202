import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Badge, Form } from 'react-bootstrap';

export default function StaffBorrowRequests({ auth }) {

  const [requests, setRequests] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeType, setTimeType] = useState("request"); // 👈 dropdown

  const API = "http://localhost:9999";

  /* ---------- LOAD DATA ---------- */

  const loadData = async () => {
    try {
      const borrowRes = await axios.get(`${API}/borrows`);
      const bookRes = await axios.get(`${API}/books`);
      const userRes = await axios.get(`${API}/users`);

      setRequests(borrowRes.data);
      setBooks(bookRes.data);
      setUsers(userRes.data);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- FORMAT TIME ---------- */

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  /* ---------- GET TIME BY TYPE ---------- */

  const getTimeByType = (request) => {
    switch (timeType) {
      case "request":
        return request.requestDate;
      case "approved":
        return request.approvedDate;
      case "rejected":
        return request.rejectedDate;
      case "returned":
        return request.returnDate;
      default:
        return null;
    }
  };

  /* ---------- USER ---------- */

  const getUsername = (userId) => {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? user.username : userId;
  };

  /* ---------- BOOK ---------- */

  const getBookInfo = (bookId) => {
    const book = books.find(b => String(b.id) === String(bookId));
    if (!book) return "Unknown";
    return `${book.title} (${book.barcode})`;
  };

  const getBook = (bookId) => {
    return books.find(b => String(b.id) === String(bookId));
  };

  /* ---------- STATUS BADGE ---------- */

  const getStatusBadge = (status) => {
    if (status === "rejected") return <Badge bg="danger">Rejected</Badge>;
    if (status === "pending") return <Badge bg="warning">Pending</Badge>;
    if (status === "approved") return <Badge bg="success">Approved</Badge>;
    if (status === "returned") return <Badge bg="primary">Returned</Badge>;
  };

  /* ---------- APPROVE ---------- */

  const handleApprove = async (request) => {
    if (!request.id) return alert("Invalid ID");

    const book = getBook(request.bookId);
    if (book && book.status === "borrowed") {
      return alert("Book already borrowed");
    }

    try {
      await axios.patch(`${API}/borrows/${request.id}`, {
        status: 'approved',
        approvedDate: new Date().toISOString()
      });

      await axios.patch(`${API}/books/${request.bookId}`, {
        available: false,
        status: 'borrowed',
        statusDate: new Date().toISOString()
      });

      loadData();

    } catch (err) {
      console.error(err);
      alert("Approve failed");
    }
  };

  /* ---------- REJECT ---------- */

  const handleReject = async (request) => {
    if (!request.id) return alert("Invalid ID");

    try {
      await axios.patch(`${API}/borrows/${request.id}`, {
        status: 'rejected',
        rejectedDate: new Date().toISOString()
      });

      loadData();

    } catch (err) {
      console.error(err);
      alert("Reject failed");
    }
  };

  /* ---------- RETURN ---------- */

  const handleReturn = async (request) => {
    if (!request.id) return alert("Invalid ID");

    try {
      await axios.patch(`${API}/borrows/${request.id}`, {
        status: 'returned',
        returnDate: new Date().toISOString()
      });

      await axios.patch(`${API}/books/${request.bookId}`, {
        available: true,
        status: null
      });

      loadData();

    } catch (err) {
      console.error(err);
      alert("Return failed");
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="container mt-3">

      <h2 className="mb-3">Borrow Requests</h2>

      <Table striped bordered hover className="text-center align-middle">

        <thead>
          <tr>
            <th>User</th>
            <th>Book</th>
            <th>Status</th>

            {/* ✅ DROPDOWN Ở HEADER */}
            <th>
              Time <br />
              <Form.Select
                size="sm"
                value={timeType}
                onChange={(e) => setTimeType(e.target.value)}
              >
                <option value="request">Request</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="returned">Returned</option>
              </Form.Select>
            </th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {requests.map((request, index) => (

            <tr key={request.id ?? index}>

              <td>{getUsername(request.userId)}</td>

              <td>{getBookInfo(request.bookId)}</td>

              <td>{getStatusBadge(request.status)}</td>

              {/* ✅ TIME THEO DROPDOWN */}
              <td>{formatDate(getTimeByType(request))}</td>

              <td>

                {request.status === 'pending' && request.id && (
                  <>
                    <Button variant="success" onClick={() => handleApprove(request)}>
                      Approve
                    </Button>{" "}

                    <Button variant="danger" onClick={() => handleReject(request)}>
                      Reject
                    </Button>
                  </>
                )}

                {request.status === 'approved' && request.id && (
                  <Button variant="primary" onClick={() => handleReturn(request)}>
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