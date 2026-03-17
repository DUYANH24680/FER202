import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Badge } from "react-bootstrap";

const API = "http://localhost:9999";

function AdminInventoryReport() {

  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API}/books`);
      setBooks(res.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const total = books.length;
  const available = books.filter(b => b.available).length;
  const damaged = books.filter(b => b.status === "damaged").length;
  const lost = books.filter(b => b.status === "lost").length;

  const getFilteredBooks = () => {
    if (filter === "all") return books;
    if (filter === "available") return books.filter(b => b.available);
    if (filter === "damaged") return books.filter(b => b.status === "damaged");
    if (filter === "lost") return books.filter(b => b.status === "lost");
    return books;
  };

  const filteredBooks = getFilteredBooks();
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (book) => {
    if (book.status === "lost") {
      return { text: "Lost", color: "#ef4444", bgColor: "#fee2e2" };
    }
    if (book.status === "damaged") {
      return { text: "Damaged", color: "#f59e0b", bgColor: "#fef3c7" };
    }
    if (book.available) {
      return { text: "Available", color: "#10b981", bgColor: "#d1fae5" };
    }
    if (!book.available && !book.status) {
       return { text: "Borrowed", color: "#1e293b", bgColor: "#e2e8f0" };
    }
    if (book.status === "borrowed") {
      return { text: "Borrowed", color: "#1e293b", bgColor: "#e2e8f0" };
    }
    
    return { text: "Unknown", color: "#6b7280", bgColor: "#f3f4f6" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Metric Cards Data
  const metrics = [
    { label: "Total Books", value: total, icon: "📚", color: "#ec5b13" },
    { label: "Available", value: available, icon: "✓", color: "#10b981" },
    { label: "Damaged", value: damaged, icon: "⚠", color: "#f59e0b" },
    { label: "Lost", value: lost, icon: "✕", color: "#ef4444" }
  ];

  return (
    <div style={{
      background: "#f8f6f6",
      minHeight: "100vh",
      padding: "30px",
      overflowY: "auto"
    }}>
      {/* Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            style={{
              background: metric.label === "Total Books" ? "#ec5b13"
                : metric.label === "Available" ? "#dcfce7"
                  : metric.label === "Damaged" ? "#fef3c7"
                    : metric.label === "Lost" ? "#fee2e2" : "white",
              color: metric.label === "Total Books" ? "white" : "inherit",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: `1px solid ${metric.color}40`,
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "scale(1)",
              hover: { transform: "scale(1.02)" }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.borderColor = metric.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = `${metric.color}40`;
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <span style={{
                fontSize: "24px",
                backgroundColor: `${metric.color}20`,
                padding: "10px 12px",
                borderRadius: "8px",
                display: "inline-block"
              }}>
                {metric.icon}
              </span>
            </div>
            <p style={{
              fontSize: "13px",
              fontWeight: "500",
              margin: "0 0 8px 0",
              opacity: 0.7
            }}>
              {metric.label}
            </p>
            <h2 style={{
              fontSize: "32px",
              fontWeight: "700",
              margin: "0",
              color: metric.label === "Total Books" ? "white" : metric.color
            }}>
              {metric.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Report Section */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        {/* Filter Buttons */}
        <div style={{
          padding: "20px 25px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {["all", "available", "damaged", "lost"].map(f => {

              let activeBg = "#ec5b13";
              let hoverBg = "#f1f5f9";
              if (f === "available") { activeBg = "#10b981"; hoverBg = "#ecfdf5"; }
              if (f === "damaged") { activeBg = "#f59e0b"; hoverBg = "#fffbeb"; }
              if (f === "lost") { activeBg = "#ef4444"; hoverBg = "#fef2f2"; }

              return (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setCurrentPage(1); }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: filter === f ? "none" : "1px solid #e5e7eb",
                    borderRadius: "20px",
                    cursor: "pointer",
                    backgroundColor: filter === f ? activeBg : "white",
                    color: filter === f ? "white" : "#64748b",
                    transition: "all 0.3s ease",
                    textTransform: "capitalize",
                    boxShadow: filter === f ? `0 4px 6px ${activeBg}40` : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== f) {
                      e.currentTarget.style.backgroundColor = hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== f) {
                      e.currentTarget.style.backgroundColor = "white";
                    }
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#64748b",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Book Details
                </th>
                <th style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#64748b",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Status
                </th>
                <th style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#64748b",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Status Date
                </th>
                <th style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#64748b",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Comment
                </th>
                <th style={{
                  padding: "15px 20px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#64748b",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooks.length > 0 ? (
                paginatedBooks.map((book, idx) => {
                  const badge = getStatusBadge(book);
                  return (
                    <tr
                      key={book.id || idx}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "white" : "#f9fafb"}
                    >
                      <td style={{
                        padding: "15px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <img
                          src={book.image || "https://via.placeholder.com/40x60"}
                          alt={book.title}
                          style={{
                            width: "40px",
                            height: "60px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            border: "1px solid #e5e7eb"
                          }}
                        />
                        <div>
                          <p style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            margin: "0",
                            color: "#1e293b"
                          }}>
                            {book.title || "Unknown"}
                          </p>
                          <p style={{
                            fontSize: "12px",
                            color: "#64748b",
                            margin: "4px 0 0 0"
                          }}>
                            {book.author || "Unknown Author"}
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: "15px 20px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: badge.bgColor,
                          color: badge.color
                        }}>
                          {badge.text}
                        </span>
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        color: "#64748b",
                        fontSize: "13px"
                      }}>
                        {formatDate(book.statusDate)}
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        color: "#64748b",
                        fontSize: "13px",
                        maxWidth: "200px",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap"
                      }}>
                        {book.comment || "-"}
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        textAlign: "right"
                      }}>
                        <button
                          onClick={() => {
                            setSelectedBook(book);
                            setShowModal(true);
                          }}
                          title="View Details"
                          style={{
                            background: "#ec5b13",
                            border: "none",
                            fontSize: "13px",
                            cursor: "pointer",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            transition: "all 0.3s ease",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ea580c"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ec5b13"}
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "14px"
                  }}>
                    No books found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          padding: "20px 25px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <p style={{
            fontSize: "13px",
            color: "#64748b",
            margin: "0"
          }}>
            Showing {paginatedBooks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredBooks.length)} of {filteredBooks.length} results
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              style={{
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: "all 0.3s ease",
                fontSize: "16px"
              }}
            >
              ←
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: currentPage === pageNum ? "#ec5b13" : "transparent",
                    color: currentPage === pageNum ? "white" : "#64748b",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== pageNum) {
                      e.currentTarget.style.backgroundColor = "#f1f5f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== pageNum) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && <span style={{ color: "#94a3b8" }}>...</span>}

            {totalPages > 5 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  transition: "all 0.3s ease"
                }}
              >
                {totalPages}
              </button>
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              style={{
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                fontSize: "16px"
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Book Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e2e8f0" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>
            📖 Book Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedBook && (
            <div style={{ display: "flex", gap: "24px" }}>
              <img
                src={selectedBook.image || "https://via.placeholder.com/150x220"}
                alt={selectedBook.title}
                style={{
                  width: "150px",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0"
                }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#0f172a", fontWeight: "bold" }}>{selectedBook.title}</h4>
                <p style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#64748b" }}>By {selectedBook.author}</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#94a3b8", display: "block" }}>Series</strong>
                    <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>{selectedBook.series || "N/A"}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#94a3b8", display: "block" }}>Barcode</strong>
                    <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>{selectedBook.barcode || "N/A"}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#94a3b8", display: "block" }}>Status</strong>
                    <Badge bg={getStatusBadge(selectedBook).bgColor} style={{ color: getStatusBadge(selectedBook).color, backgroundColor: getStatusBadge(selectedBook).bgColor }}>
                      {getStatusBadge(selectedBook).text}
                    </Badge>
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "#94a3b8", display: "block" }}>Last Updated</strong>
                    <span style={{ fontSize: "14px", color: "#1e293b" }}>{formatDate(selectedBook.statusDate)}</span>
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: "13px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Description</strong>
                  <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                    {selectedBook.description || "No description provided."}
                  </p>
                </div>

                {selectedBook.comment && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "#fef2f2", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                    <strong style={{ fontSize: "13px", color: "#be123c", display: "block", marginBottom: "4px" }}>Condition Comment</strong>
                    <p style={{ margin: 0, fontSize: "14px", color: "#9f1239" }}>{selectedBook.comment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "none" }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminInventoryReport;