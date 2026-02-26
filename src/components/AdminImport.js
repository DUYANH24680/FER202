import React, { useState } from "react";
import axios from "axios";
import { Card, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

function AdminImport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const extension = file.name.split(".").pop().toLowerCase();
      let books = [];

      // ===== CSV =====
      if (extension === "csv") {
        const text = await file.text();
        const rows = text.split("\n").slice(1); // bỏ header

        books = rows
          .filter((row) => row.trim() !== "")
          .map((row) => {
            const [title, author, available, image] = row.split(",");
            return {
              title: title?.trim(),
              author: author?.trim(),
              available: available?.trim() === "true",
              image: image?.trim() || ""
            };
          });
      }

      // ===== EXCEL =====
      else if (extension === "xlsx") {
        const buffer = await file.arrayBuffer();
const workbook = XLSX.read(buffer, { type: "array" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// lấy raw data
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

books = rawData.map((row) => {
  // chuẩn hoá key về chữ thường
  const normalizedRow = {};
  Object.keys(row).forEach((key) => {
    normalizedRow[key.toLowerCase().trim()] = row[key];
  });

  return {
    title: normalizedRow.title?.toString().trim(),
    author: normalizedRow.author?.toString().trim(),
    available:
      normalizedRow.available?.toString().toLowerCase() === "true" ||
      normalizedRow.available === true ||
      normalizedRow.available === 1,
    image: normalizedRow.image?.toString().trim() || ""
  };
});
      } else {
        throw new Error("Unsupported file type");
      }

      // ===== INSERT DATA =====
      for (let book of books) {
  if (!book.title || !book.author) continue;

  // 1️⃣ Tìm sách trùng theo title
  const res = await axios.get(
    `http://localhost:9999/books?title=${encodeURIComponent(book.title)}`
  );

  // 2️⃣ Nếu có sách trùng -> xoá
  if (res.data.length > 0) {
    for (let oldBook of res.data) {
      await axios.delete(`http://localhost:9999/books/${oldBook.id}`);
    }
  }

  // 3️⃣ Thêm sách mới
  await axios.post("http://localhost:9999/books", book);
}

      setMessage("Import successful! Redirecting...");

      setTimeout(() => {
        navigate("/admin/books");
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Import failed! Check file format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="shadow">
        <Card.Body>
          <h3 className="mb-3">📥 Import Books</h3>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group>
            <Form.Label>Select CSV or Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".csv,.xlsx"
              onChange={handleImport}
              disabled={loading}
            />
          </Form.Group>

          {loading && (
            <div className="mt-3">
              <Spinner animation="border" /> Importing...
            </div>
          )}

          <p className="text-muted mt-3">
            Format: title | author | available | image  

          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default AdminImport;