import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Badge, Form } from 'react-bootstrap';

export default function StaffBorrowRequests() {

  const [requests, setRequests] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeType, setTimeType] = useState("request");

  const API = "http://localhost:9999";

  /* ---------- LOAD DATA ---------- */

  const loadData = async () => {
    try {
      const [borrowRes, bookRes, userRes] = await Promise.all([
        axios.get(`${API}/borrows`),
        axios.get(`${API}/books`),
        axios.get(`${API}/users`)
      ]);

      const sorted = borrowRes.data.sort(
        (a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0)
      );

      setRequests(sorted);
      setBooks(bookRes.data || []);
      setUsers(userRes.data || []);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- SAFE COMPARE ---------- */

  const isSame = (a, b) => String(a) === String(b);

  /* ---------- FORMAT DATE ---------- */

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  /* ---------- TIME ---------- */

  const getTime = (req) => {
    if (timeType === "request") return req.requestDate;
    if (timeType === "approved" && req.status === "approved") return req.requestDate;
    if (timeType === "rejected" && req.status === "rejected") return req.requestDate;
    if (timeType === "returned") return req.returnDate;
    return null;
  };

  /* ---------- USER ---------- */

  const getUser = (userId) => {
    return users.find(u => isSame(u.id, userId));
  };

  /* ---------- BOOK ---------- */

  const getBook = (bookId) => {
    return books.find(b => isSame(b.id, bookId));
  };

  /* ---------- STATUS UI ---------- */

  const renderStatus = (status) => {
    const map = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      returned: "primary"
    };
    return <Badge bg={map[status] || "secondary"}>{status}</Badge>;
  };

  /* ---------- CHECK BOOK BORROWED ---------- */

  const isBookBeingBorrowed = (bookId) => {
    return requests.some(r =>
      isSame(r.bookId, bookId) &&
      r.status === "approved"
    );
  };

  /* ---------- APPROVE (FIX ID) ---------- */

  const handleApprove = async (req) => {
    try {
      if (isBookBeingBorrowed(req.bookId)) {
        alert("Book already borrowed!");
        return;
      }

      await axios.patch(`${API}/borrows/${Number(req.id)}`, {
        status: "approved"
      });

      await axios.patch(`${API}/books/${Number(req.bookId)}`, {
        available: false
      });

      loadData();

    } catch (err) {
      console.error(err);
      alert("Approve failed");
    }
  };

  /* ---------- REJECT (FIX ID) ---------- */

  const handleReject = async (req) => {
    try {
      await axios.patch(`${API}/borrows/${Number(req.id)}`, {
        status: "rejected"
      });

      loadData();

    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- RETURN (FIX ID) ---------- */

  const handleReturn = async (req) => {
    try {
      await axios.patch(`${API}/borrows/${Number(req.id)}`, {
        status: "returned",
        returnDate: new Date().toISOString()
      });

      await axios.patch(`${API}/books/${Number(req.bookId)}`, {
        available: true
      });

      loadData();

    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="container mt-4">

      <h2>Borrow Management</h2>

      <Table bordered hover className="text-center align-middle">

        <thead>
          <tr>
            <th>User</th>
            <th>Book</th>
            <th>Status</th>

            <th>
              Time
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

            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {requests.map((req) => {
            const user = getUser(req.userId);
            const book = getBook(req.bookId);

            return (
              <tr key={String(req.id)}>
                <td>{user?.username || "Unknown"}</td>
                <td>{book?.title || "Unknown Book"}</td>
                <td>{renderStatus(req.status)}</td>
                <td>{formatDate(getTime(req))}</td>

                <td>
                  {req.status === "pending" && (
                    <>
                      <Button
                        variant="success"
                        onClick={() => handleApprove(req)}
                      >
                        Approve
                      </Button>{" "}

                      <Button
                        variant="danger"
                        onClick={() => handleReject(req)}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {req.status === "approved" && (
                    <Button
                      variant="primary"
                      onClick={() => handleReturn(req)}
                    >
                      Return
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}

        </tbody>

      </Table>
    </div>
  );
}