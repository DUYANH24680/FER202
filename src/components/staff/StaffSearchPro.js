import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:9999";

function AdminSearchPro() {

  const [books, setBooks] = useState([]);
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("title");
  const [showCategory, setShowCategory] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const booksRes = await axios.get(`${API}/books`);
      const seriesRes = await axios.get(`${API}/series`);
      const catRes = await axios.get(`${API}/categories`);

      setBooks(booksRes.data);
      setSeries(seriesRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const getSeriesName = (seriesId) => {
    const s = series.find((x) => x.id === seriesId);
    return s ? s.name : "Unknown";
  };

  const filtered = books.filter((b) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return true;
    const search = trimmedKeyword.toLowerCase();

    if (filter === "title") {
      return (b.title || "").toLowerCase().includes(search);
    }
    if (filter === "author") {
      return (b.author || "").toLowerCase().includes(search);
    }
    if (filter === "series") {
      const seriesName = getSeriesName(b.seriesId) || "";
      return seriesName.toLowerCase().includes(search);
    }
    return false;
  });
  return (
    <div style={{
      background: "#f8f9fa",
      minHeight: "100vh",
      padding: "40px 30px",
      overflowY: "auto"
    }}>
      {/* Search Controls */}
      <div style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "30px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "16px"
        }}>
          {/* Filter Type */}
          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              marginBottom: "8px",
              letterSpacing: "0.5px"
            }}>
              Filter Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "13px",
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#ec5b13"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="series">Series</option>
            </select>
          </div>

          {/* Search Query */}
          <div style={{ gridColumn: "span 2" }}>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              marginBottom: "8px",
              letterSpacing: "0.5px"
            }}>
              Search Query
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Enter keywords, titles, or authors..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#ec5b13"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
              <button style={{
                padding: "10px 16px",
                background: "#ec5b13",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                transition: "all 0.3s ease"
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#d94f0e"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#ec5b13"}
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Category Button */}
          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              marginBottom: "8px",
              letterSpacing: "0.5px"
            }}>
              Category
            </label>
            <button
              onClick={() => setShowCategory(true)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ec5b13",
                borderRadius: "6px",
                background: "#ea580c",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                color: "white",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#d94f0e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ea580c";
              }}
            >
              Select Category
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        {/* Results Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{
            fontSize: "14px",
            fontWeight: "600",
            margin: 0,
            color: "#1e293b"
          }}>
            Search Results
            <span style={{
              marginLeft: "8px",
              color: "#94a3b8",
              fontWeight: "400"
            }}>
              ({filtered.length} items)
            </span>
          </h3>
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
                  Cover
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
                  Title
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
                  Author
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
                  Series
                </th>
                <th style={{
                  padding: "15px 20px",
                  textAlign: "center",
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
              {filtered.length === 0 ? (
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
              ) : (
                filtered.map((b, idx) => {
                  return (
                    <tr
                      key={b.id || idx}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "white" : "#f9fafb"}
                    >
                      <td style={{ padding: "15px 20px" }}>
                        <img
                          src={b.image || "https://via.placeholder.com/40x60"}
                          alt={b.title}
                          style={{
                            width: "40px",
                            height: "60px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            border: "1px solid #e5e7eb"
                          }}
                        />
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        fontWeight: "600",
                        color: "#1e293b"
                      }}>
                        {b.title}
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        color: "#64748b",
                        fontSize: "13px"
                      }}>
                        {b.author}
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        color: "#64748b",
                        fontSize: "13px"
                      }}>
                        {getSeriesName(b.seriesId)}
                      </td>
                      <td style={{
                        padding: "15px 20px",
                        textAlign: "center"
                      }}>
                        <button
                          onClick={() => setSelectedBook(b)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "18px",
                            cursor: "pointer",
                            color: "#94a3b8",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#ec5b13"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                        >
                        👁️
                      </button>
                    </td>
                    </tr>
            );
                })
              )}
          </tbody>
        </table>
      </div>
    </div>

      {/* Category Modal */ }
  {
    showCategory && (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
        onClick={() => setShowCategory(false)}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              margin: 0,
              color: "#1e293b"
            }}>
              Select Category
            </h3>
            <button
              onClick={() => setShowCategory(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#94a3b8"
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "12px"
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setShowCategory(false);
                  navigate(`/category/${cat.id}`);
                }}
                style={{
                  padding: "16px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#64748b",
                  transition: "all 0.3s ease",
                  textAlign: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ec5b13";
                  e.currentTarget.style.background = "#fef3e2";
                  e.currentTarget.style.color = "#ec5b13";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  {/* Book Detail Modal */ }
  {
    selectedBook && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}
        onClick={() => setSelectedBook(null)}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "700px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px"
          }}>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "600",
              margin: 0,
              color: "#1e293b"
            }}>
              Book Details
            </h3>
            <button
              onClick={() => setSelectedBook(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#94a3b8"
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr",
            gap: "20px",
            marginBottom: "24px"
          }}>
            <img
              src={selectedBook.image || "https://via.placeholder.com/150x225"}
              alt={selectedBook.title}
              style={{
                width: "150px",
                height: "225px",
                borderRadius: "8px",
                objectFit: "cover",
                border: "1px solid #e5e7eb"
              }}
            />
            <div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Title
                </label>
                <p style={{ margin: 0, fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>
                  {selectedBook.title}
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Author
                </label>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                  {selectedBook.author || "N/A"}
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Series
                </label>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                  {getSeriesName(selectedBook.seriesId)}
                </p>
              </div>

              <div>
                <label style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Barcode
                </label>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                  {selectedBook.barcode || "N/A"}
                </p>
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Quantity (All Identical Copies)
                </label>
                <p style={{ margin: 0, fontSize: "14px", color: books.filter(b => b.title === selectedBook.title && b.author === selectedBook.author && b.available).length > 0 ? "#10b981" : "#ef4444", fontWeight: "600" }}>
                  {books.filter(b => b.title === selectedBook.title && b.author === selectedBook.author && b.available).length} Available / {books.filter(b => b.title === selectedBook.title && b.author === selectedBook.author).length} Total
                </p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
                marginBottom: "4px"
              }}>
                Description
              </label>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
                {selectedBook.description || "No description available"}
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
                marginBottom: "4px"
              }}>
                Status
              </label>
              <p style={{
                margin: 0,
                fontSize: "14px",
                color: selectedBook.available ? "#10b981" : "#ef4444",
                fontWeight: "600"
              }}>
                {selectedBook.available ? "Available" : "Not Available"}
              </p>
            </div>

            {selectedBook.comment && (
              <div>
                <label style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "4px"
                }}>
                  Comment
                </label>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {selectedBook.comment}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedBook(null)}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "12px",
              background: "#ec5b13",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#d94f0e"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#ec5b13"}
          >
            Close
          </button>
        </div>
      </div>
    )
  }
    </div >
  );
}

export default AdminSearchPro;