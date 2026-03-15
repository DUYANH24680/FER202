import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import moment from "moment";

const API = "http://localhost:9999";

function StaffCategoryBooks() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [category, setCategory] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortType, setSortType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await axios.get(`${API}/categories/${id}`);
        setCategory(catRes.data);

        const res = await axios.get(`${API}/books`);
        const filtered = res.data.filter((b) => String(b.categoryId) === String(id));
        setBooks(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id]);

  const displayedBooks = useMemo(() => {
    let result = [...books];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    const grouped = result.reduce((acc, book) => {
      const key = `${book.title}_${book.author}`;
      if (!acc[key]) {
        acc[key] = { ...book, totalCount: 0, availableCount: 0 };
      }
      acc[key].totalCount += 1;
      if (book.available) {
        acc[key].availableCount += 1;
      }
      return acc;
    }, {});
    
    let groupedArray = Object.values(grouped);

    if (sortType === "az") {
      groupedArray.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortType === "za") {
      groupedArray.sort((a, b) => b.title.localeCompare(a.title));
    }

    return groupedArray;
  }, [books, sortType, searchQuery]);

  const getStatusBadge = (book) => {
    if (book.totalCount !== undefined) {
       if (book.availableCount > 0) return { text: `${book.availableCount} IN STOCK`, bg: "#dcfce7", color: "#166534" };
       return { text: "OUT OF STOCK", bg: "#f3f4f6", color: "#374151" };
    }
    if (book.available) return { text: "AVAILABLE", bg: "#dcfce7", color: "#166534" };
    if (book.status === "borrowed") return { text: "BORROWED", bg: "#e2e8f0", color: "#1e293b" };
    if (book.status === "reserved") return { text: "RESERVED", bg: "#fef3c7", color: "#92400e" };
    if (book.status === "lost") return { text: "LOST", bg: "#f1f5f9", color: "#475569" };
    if (book.status === "damaged") return { text: "DAMAGED", bg: "#fce7f3", color: "#9d174d" };
    return { text: "UNAVAILABLE", bg: "#f3f4f6", color: "#374151" };
  };

  const categoryName = category ? category.name : "...";

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", padding: "30px" }}>
      {/* Search Header */}
      {!selectedBook && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
          <div style={{ background: "#f1f5f9", padding: "8px 16px", borderRadius: "8px", display: "flex", alignItems: "center", width: "300px" }}>
            <span style={{ color: "#94a3b8", marginRight: "8px" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Quick search by title or author..." 
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px" }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {!selectedBook ? (
        <>
          {/* Main Title Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "bold", color: "#0f172a", margin: "0 0 8px 0" }}>
                Books in {categoryName}
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>
                Showing {displayedBooks.length} titles in the {categoryName} category
              </p>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "4px 12px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginRight: "8px" }}>SORT BY:</span>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  style={{ border: "none", outline: "none", fontWeight: "600", color: "#0f172a", fontSize: "14px", background: "transparent", padding: "4px 0", cursor: "pointer" }}
                >
                  <option value="">Default</option>
                  <option value="az">A-Z Alphabetical</option>
                  <option value="za">Z-A Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          <Row>
            {displayedBooks.map((book) => {
              const badge = getStatusBadge(book);
              return (
                <Col lg={3} md={4} sm={6} key={book.id} className="mb-4">
                  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ position: "relative", backgroundColor: "#f8fafc", padding: "20px", display: "flex", justifyContent: "center", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "12px", 
                        right: "12px", 
                        background: badge.bg, 
                        color: badge.color, 
                        padding: "6px 12px", 
                        borderRadius: "20px", 
                        fontSize: "10px", 
                        fontWeight: "800",
                        letterSpacing: "0.5px"
                      }}>
                        {badge.text}
                      </div>
                      <img 
                        src={book.image} 
                        alt={book.title} 
                        style={{ height: "220px", objectFit: "cover", borderRadius: "4px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                      />
                    </div>
                    <Card.Body style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                      <h5 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={book.title}>
                        {book.title}
                      </h5>
                      <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                        {book.author}
                      </p>
                      <button 
                        onClick={() => setSelectedBook(book)}
                        style={{ 
                          width: "100%", 
                          marginTop: "auto", 
                          background: "#f1f5f9", 
                          color: "#334155", 
                          border: "none", 
                          padding: "10px", 
                          borderRadius: "8px", 
                          fontWeight: "600",
                          fontSize: "14px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.2s",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                      >
                        <span style={{ fontSize: "16px" }}>👁</span> View Details
                      </button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
            {displayedBooks.length === 0 && (
              <Col xs={12} className="text-center py-5">
                <p style={{ color: "#94a3b8", fontSize: "16px" }}>No books found matching your criteria.</p>
              </Col>
            )}
          </Row>
        </>
      ) : (
        /* Detailed View */
        <div>
          <button 
            onClick={() => setSelectedBook(null)}
            style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px", cursor: "pointer", padding: 0 }}
          >
            <span style={{ fontSize: "18px" }}>←</span> Back to List
          </button>
          
          <div style={{ background: "white", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
            <Row>
              <Col md={4} style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <img 
                  src={selectedBook.image} 
                  alt={selectedBook.title} 
                  style={{ width: "100%", maxWidth: "300px", objectFit: "contain", borderRadius: "8px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                />
              </Col>
              <Col md={8}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ background: "#ffedd5", color: "#c2410c", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                    {categoryName}
                  </span>
                  <span style={{ background: selectedBook.availableCount > 0 ? "#dcfce7" : "#fee2e2", color: selectedBook.availableCount > 0 ? "#166534" : "#991b1b", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                    {selectedBook.availableCount > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                <h1 style={{ fontSize: "42px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                  {selectedBook.title}
                </h1>
                <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "32px" }}>
                  By <span style={{ color: "#3b82f6", fontWeight: "600" }}>{selectedBook.author}</span>
                </p>
                
                <h6 style={{ fontWeight: "700", color: "#334155", marginBottom: "16px", fontSize: "18px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>Book Details</h6>
                
                <Row className="mb-4">
                  <Col sm={6} className="mb-3">
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>SERIES</div>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>{selectedBook.series || "N/A"}</div>
                  </Col>
                  <Col sm={6} className="mb-3">
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>QUANTITY</div>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", backgroundColor: "#f1f5f9", display: "inline-block", padding: "2px 8px", borderRadius: "4px", color: selectedBook.availableCount > 0 ? "#166534" : "#991b1b" }}>{selectedBook.availableCount} Available / {selectedBook.totalCount} Total</div>
                  </Col>
                </Row>

                <div className="mb-4">
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>NOTES/COMMENTS</div>
                  <div style={{ fontSize: "15px", color: "#475569", background: "#f8fafc", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #cbd5e1" }}>
                    {selectedBook.comment || <i>No notes attached.</i>}
                  </div>
                </div>
                
                <h6 style={{ fontWeight: "700", color: "#334155", marginBottom: "12px", fontSize: "16px" }}>Synopsis</h6>
                <p style={{ color: "#475569", lineHeight: "1.7", marginBottom: "40px", fontSize: "16px" }}>
                  {selectedBook.description || "No description available for this book."}
                </p>
                
                <div style={{ display: "flex", gap: "16px" }}>
                  <button style={{ background: "#ea580c", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontWeight: "600", fontSize: "15px", cursor: "pointer" }}>
                    Edit Book
                  </button>
                  <button style={{ background: "white", color: "#ef4444", border: "1px solid #f87171", borderRadius: "8px", padding: "12px 24px", fontWeight: "600", fontSize: "15px", cursor: "pointer" }}>
                    Delete Book
                  </button>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffCategoryBooks;