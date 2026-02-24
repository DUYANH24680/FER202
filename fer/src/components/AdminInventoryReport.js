import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3001";

function AdminInventoryReport() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  const total = books.length;
  const available = books.filter(b => b.available).length;
  const damaged = books.filter(b => b.status === "damaged").length;
  const lost = books.filter(b => b.status === "lost").length;

  return (
    <div>
      <h2>Inventory Report</h2>
      <h4>Total Books: {total}</h4>
      <h4>Available: {available}</h4>
      <h4>Damaged: {damaged}</h4>
      <h4>Lost: {lost}</h4>
    </div>
  );
}

export default AdminInventoryReport;