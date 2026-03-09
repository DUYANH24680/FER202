import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Table } from "react-bootstrap";

const API = "http://localhost:9999";

function AdminSearchPro() {
  const [books, setBooks] = useState([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(keyword.toLowerCase()) ||
    b.author.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div>
      <h2>Advanced Search</h2>
      <Form.Control
        placeholder="Search title or author..."
        onChange={(e) => setKeyword(e.target.value)}
      />

      <Table bordered className="mt-3">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(b => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default AdminSearchPro;