import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Badge, Form, Collapse } from "react-bootstrap";

export default function StaffBorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [openRow, setOpenRow] = useState({});

  const API = "http://localhost:9999";

  /* ---------- LOAD ---------- */
  const loadData = async () => {
    try {
      const [borrowRes, bookRes, userRes] = await Promise.all([
        axios.get(`${API}/borrows`),
        axios.get(`${API}/books`),
        axios.get(`${API}/users`)
      ]);

      setRequests(borrowRes.data || []);
      setBooks(bookRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- HELPER ---------- */
  const isSame = (a, b) => String(a) === String(b);

  const getUser = (id) => users.find(u => isSame(u.id, id));
  const getBook = (id) => books.find(b => isSame(b.id, id));

  /* ---------- TITLE LOGIC ---------- */
  const getSameTitleBooks = (title) =>
    books.filter(b => b.title === title);

  const getTotalCopies = (title) =>
    getSameTitleBooks(title).length;

  const getBorrowedCopies = (title) =>
    getSameTitleBooks(title).filter(
      b => b.status === "borrowed" || b.available === false
    ).length;

  const getAvailableCopies = (title) =>
    getTotalCopies(title) - getBorrowedCopies(title);

  const isOutOfStock = (book) =>
    getAvailableCopies(book.title) <= 0;

  /* ---------- TIME ---------- */
const getTime = (req) => {
  if (req.status === "rejected") return "";
  if (req.status === "pending") {
    return req.requestDate
      ? new Date(req.requestDate).toLocaleString()
      : "-";
  }
  if (req.status === "approved" && !req.returnDate) {
    return "Đang mượn";
  }

  if (req.approvedDate && req.returnDate) {
    const start = req.approvedDate.split("T")[0];
    const end = req.returnDate.split("T")[0];

    const startDate = new Date(start);
    const endDate = new Date(end);

    const diffDays = Math.floor(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );

    return `${diffDays} ngày`;
  }

  return "-";
};

  /* ---------- STATUS ---------- */
  const renderStatus = (status) => {
    const map = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      returned: "primary"
    };
    return <Badge bg={map[status] || "secondary"}>{status}</Badge>;
  };

  /* ---------- ACTION ---------- */

  const handleApprove = async (req) => {
    try {
      const book = getBook(req.bookId);
      if (!book) return;

      if (isOutOfStock(book)) {
        alert("Hết sách!");
        return;
      }

      const availableBook = books.find(
        b =>
          b.title === book.title &&
          b.status !== "borrowed" &&
          b.available !== false
      );

      if (!availableBook) {
        alert("Không còn bản nào!");
        return;
      }

      await axios.patch(`${API}/borrows/${req.id}`, {
        status: "approved",
        bookId: availableBook.id,
        approveDate: new Date().toISOString()
      });

      await axios.patch(`${API}/books/${availableBook.id}`, {
        status: "borrowed",
        available: false
      });

      loadData();

    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- FIX REJECT ---------- */
  const handleReject = async (req) => {
    try {
      const reason = (rejectReasons[req.id] || "").trim();

      if (!reason) {
        alert("Nhập lý do reject!");
        return;
      }

      await axios.patch(`${API}/borrows/${req.id}`, {
        status: "rejected",
        rejectReason: reason
      });

      setRejectReasons({
        ...rejectReasons,
        [req.id]: ""
      });

      loadData();

    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- TOGGLE ---------- */
  const toggleRow = (id) => {
    setOpenRow({
      ...openRow,
      [id]: !openRow[id]
    });
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
            <th>Time</th>
            <th>Action</th>
            <th>Detail</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((req) => {
            const user = getUser(req.userId);
            const book = getBook(req.bookId);

            return (
              <React.Fragment key={req.id}>
                <tr>
                  <td>{user?.username || "Unknown"}</td>

                  <td>{book ? <b>{book.title}</b> : "Unknown"}</td>

                  <td>
                    {renderStatus(req.status)}
                  </td>

                  <td>{getTime(req)}</td>

                  <td>
                    {req.status === "pending" && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => handleApprove(req)}
                        >
                          Approve
                        </Button>{" "}

                        <Form.Control
                          size="sm"
                          placeholder="Reason..."
                          value={rejectReasons[req.id] || ""}
                          onChange={(e) =>
                            setRejectReasons({
                              ...rejectReasons,
                              [req.id]: e.target.value
                            })
                          }
                          className="mt-1 mb-1"
                        />

                        <Button
                          variant="danger"
                          onClick={() => handleReject(req)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </td>

                  <td>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => toggleRow(req.id)}
                    >
                      {openRow[req.id] ? "Hide" : "Show"}
                    </Button>
                  </td>
                </tr>

                {/* DETAIL */}
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <Collapse in={openRow[req.id]}>
                      <div style={{ padding: "10px" }}>
                        {book && (
                          <>
                            <b>{book.title}</b><br />
                            Barcode: {book.barcode}<br />
                            Total: {getTotalCopies(book.title)}<br />
                            Borrowed: {getBorrowedCopies(book.title)}<br />
                            Available: {getAvailableCopies(book.title)}
                          </>
                        )}

                        {req.rejectReason && (
                          <div style={{ color: "red", marginTop: "8px" }}>
                            <b>Reject reason:</b> {req.rejectReason}
                          </div>
                        )}
                      </div>
                    </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}