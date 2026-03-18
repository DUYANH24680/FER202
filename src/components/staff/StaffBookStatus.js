import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Container,
  Card,
  Collapse,
  Form,
  Image,
  Row,
  Col,
  Button,
  Badge
} from "react-bootstrap";
import moment from "moment";
import { 
  FaSearch, 
  FaTools, 
  FaExclamationTriangle, 
  FaSkullCrossbones, 
  FaCheckCircle, 
  FaHistory, 
  FaCommentAlt,
  FaRedoAlt,
  FaChevronDown,
  FaShieldAlt,
  FaCalendarAlt
} from "react-icons/fa";

const API = "http://localhost:9999";

function AdminBookStatus() {
  const [books, setBooks] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editComment, setEditComment] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Reduced for better spacing

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

  const updateBook = async (book, newData) => {
    try {
      await axios.put(`${API}/books/${book.id}`, {
        ...book,
        ...newData
      });
      fetchBooks();
    } catch (error) {
      console.error("Error updating book:", error);
    }
  };

  const handleSaveComment = async (book) => {
    await updateBook(book, {
      comment: editComment[book.id]
    });
    setExpanded(null); 
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
                           
      let matchStatus = true;
      if (statusFilter === "available") matchStatus = !b.status && b.available;
      if (statusFilter === "borrowed") matchStatus = !b.status && !b.available;
      if (statusFilter === "damaged") matchStatus = b.status === "damaged";
      if (statusFilter === "lost") matchStatus = b.status === "lost";
      
      return matchSearch && matchStatus;
    });
  }, [books, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusDisplay = (book) => {
    if (book.status === "lost")
      return { text: "Lost", bg: "#fff1f2", color: "#e11d48", icon: <FaSkullCrossbones className="me-1" /> };
    if (book.status === "damaged")
      return { text: "Damaged", bg: "#fffbeb", color: "#d97706", icon: <FaExclamationTriangle className="me-1" /> };
    if (!book.status && book.available)
      return { text: "Healthy", bg: "#f0fdf4", color: "#16a34a", icon: <FaCheckCircle className="me-1" /> };
    
    return { text: "Borrowed", bg: "#f8fafc", color: "#64748b", icon: <FaHistory className="me-1" /> };
  };

  return (
    <div style={{ padding: "40px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", minHeight: "100vh" }}>
      
      {/* Header section */}
      <div className="mb-5 d-flex justify-content-between align-items-end">
        <div>
          <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill shadow-sm" style={{ fontWeight: "700", letterSpacing: "1px" }}>
            ADMINISTRATION
          </Badge>
          <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
            Book Condition Management
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "600px", margin: 0 }}>
            Monitor, audit, and manage the physical integrity of your library collection with real-time status updates.
          </p>
        </div>
        <div className="text-end d-none d-md-block">
            <div style={{ background: "white", padding: "12px 20px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <span className="small text-muted d-block fw-bold mb-1">TOTAL CATALOG SIZE</span>
                <span className="h4 fw-bold m-0 text-primary">{books.length} Items</span>
            </div>
        </div>
      </div>

      {/* Control Panel */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "32px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", padding: "24px", borderRadius: "24px", border: "1px solid white", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" }}>
         <div style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
            <FaSearch style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <Form.Control 
              placeholder="Search by title, barcode, author..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-premium"
              style={{
                height: "50px",
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "15px",
                padding: "0 20px 0 50px",
                fontSize: "15px",
                fontWeight: "500"
              }}
            />
         </div>
         <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
               width: "220px",
               height: "50px",
               background: "white",
               border: "1px solid #e2e8f0",
               borderRadius: "15px",
               padding: "0 20px",
               color: "#475569",
               fontWeight: "600",
               cursor: "pointer"
            }}
         >
            <option value="all">Filter: All Books</option>
            <option value="available">Healthy / Available</option>
            <option value="borrowed">Currently Borrowed</option>
            <option value="damaged">Damaged (Audit Required)</option>
            <option value="lost">Lost (Record Maintenance)</option>
         </Form.Select>
      </div>

      {/* Main Collection Table */}
      <Card style={{ borderRadius: "24px", border: "none", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", overflow: "hidden", background: "white" }}>
        
        {/* Table Column Labels */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2.5fr 1fr 1fr", padding: "20px 32px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>Identification</span>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>Metadata</span>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>Integrity Status</span>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px", textAlign: "right" }}>Management Actions</span>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {paginatedBooks.map(book => {
            const isExpanded = expanded === book.id;
            const status = getStatusDisplay(book);
            const isCritical = book.status === "damaged" || book.status === "lost";
            
            return (
              <React.Fragment key={book.id}>
                <div 
                  className={`audit-row ${isExpanded ? 'active' : ''}`}
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1.2fr 2.5fr 1fr 1fr", 
                    padding: "24px 32px", 
                    borderBottom: "1px solid #f8fafc",
                    alignItems: "center",
                    background: isExpanded ? "#f8fafc" : "white",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* ID Column */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ 
                        width: "60px", 
                        height: "85px", 
                        background: (book.status === 'damaged' || book.status === 'lost') ? '#f1f5f9' : 'white',
                        padding: "4px",
                        borderRadius: "10px", 
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                        border: "1px solid #f1f5f9",
                        flexShrink: 0
                    }}>
                      {book.image ? (
                        <Image src={book.image} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "#cbd5e1" }}>📖</div>
                      )}
                    </div>
                    <div className="d-flex flex-column">
                        <span style={{ fontSize: "13px", fontWeight: "700", color: isCritical ? "#e11d48" : "#64748b", fontFamily: "monospace" }}>
                           {book.barcode || `LIB-${book.id.toString().padStart(4, '0')}`}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", marginTop: "4px" }}>REF_ID_V2</span>
                    </div>
                  </div>

                  {/* Metadata Column */}
                  <div>
                    <h5 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{book.title}</h5>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>{book.author}</span>
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }}></span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "400" }}>CAT_{book.categoryId}</span>
                    </div>
                  </div>

                  {/* Status Column */}
                  <div>
                    <span style={{ 
                        display: "inline-flex",
                        alignItems: "center",
                        background: status.bg, 
                        color: status.color, 
                        padding: "8px 16px", 
                        borderRadius: "12px", 
                        fontSize: "13px", 
                        fontWeight: "700",
                        boxShadow: `0 2px 4px ${status.color}15`
                    }}>
                      {status.icon} {status.text.toUpperCase()}
                    </span>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
                    {isCritical ? (
                        <Button 
                          variant="white" 
                          size="sm" 
                          onClick={() => updateBook(book, { status: null, available: true, statusDate: null })}
                          style={{ 
                              background: "white", 
                              border: "1px solid #e1e8f0", 
                              borderRadius: "10px", 
                              padding: "8px 16px", 
                              fontSize: "12px", 
                              fontWeight: "700", 
                              color: "#475569",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                          }}
                        >
                          <FaRedoAlt size={10} /> Reset Condition
                        </Button>
                    ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Button 
                                variant="outline-warning" 
                                size="sm" 
                                className="action-btn-circle"
                                onClick={() => {
                                    setExpanded(book.id);
                                    updateBook(book, { status: "damaged", available: false, statusDate: new Date().toISOString() });
                                }}
                                style={{ borderRadius: "10px", border: "1px solid #fef3c7", background: "#fffbeb", color: "#d97706", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                title="Mark Damaged"
                            >
                                <span style={{ fontSize: "18px" }}>⚠️</span>
                            </Button>
                            <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="action-btn-circle"
                                onClick={() => {
                                    setExpanded(book.id);
                                    updateBook(book, { status: "lost", available: false, statusDate: new Date().toISOString() });
                                }}
                                style={{ borderRadius: "10px", border: "1px solid #ffe4e6", background: "#fff1f2", color: "#e11d48", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                title="Mark Lost"
                            >
                                <span style={{ fontSize: "18px" }}>🚨</span>
                            </Button>
                        </div>
                    )}

                    <Button 
                      variant="link" 
                      onClick={() => setExpanded(isExpanded ? null : book.id)}
                      style={{ 
                          marginLeft: "8px",
                          color: isExpanded ? "#ea580c" : "#94a3b8", 
                          padding: 0,
                          transition: "transform 0.3s ease",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                        }}
                    >
                      <FaChevronDown />
                    </Button>
                  </div>
                </div>

                {/* Audit Detail Panel */}
                <Collapse in={isExpanded}>
                  <div>
                    <div style={{ background: "#fcfdfe", padding: "32px 40px", borderBottom: "1px solid #f1f5f9" }}>
                        {isCritical ? (
                           <Row className="g-4">
                                <Col lg={4}>
                                    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
                                        <div className="d-flex align-items-center gap-2 mb-3 text-muted">
                                            <FaCalendarAlt size={14} />
                                            <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>Incident Timeline</span>
                                        </div>
                                        <div className="mb-4">
                                            <span style={{ display: "block", fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Reported On</span>
                                            <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                                                {book.statusDate ? moment(book.statusDate).format("MMMM DD, YYYY") : "Pending Review"}
                                            </span>
                                            <span style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                                Time: {book.statusDate ? moment(book.statusDate).format("HH:mm A") : "--:--"}
                                            </span>
                                        </div>
                                        
                                        <div style={{ background: book.status === 'damaged' ? '#fffbeb' : '#fff1f2', borderRadius: "12px", padding: "16px", border: `1px solid ${book.status === 'damaged' ? '#fde68a' : '#fecdd3'}` }}>
                                            <div className="d-flex gap-2">
                                                {book.status === 'damaged' ? <FaTools className="text-warning mt-1" /> : <FaHistory className="text-danger mt-1" />}
                                                <div>
                                                    <span style={{ display: "block", fontSize: "11px", fontWeight: "800", color: book.status === 'damaged' ? '#92400e' : '#9f1239' }}>PROTOCOL</span>
                                                    <p style={{ margin: 0, fontSize: "12px", color: book.status === 'damaged' ? '#b45309' : '#be123c', lineHeight: "1.5" }}>
                                                        {book.status === 'damaged' ? 'Isolate the item and update restoration log immediately.' : 'Cross-reference with last borrower and update records.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col lg={8}>
                                    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                                        <div className="d-flex align-items-center gap-2 mb-3 text-muted">
                                            <FaCommentAlt size={14} />
                                            <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>Technical Notes & Observations</span>
                                        </div>
                                        <Form.Control 
                                            as="textarea"
                                            rows={5}
                                            placeholder="Document specific details about the condition, damage patterns, or circumstances of loss..."
                                            style={{ 
                                                border: "1px solid #f1f5f9", 
                                                background: "#fcfdfe",
                                                borderRadius: "12px", 
                                                resize: "none", 
                                                fontSize: "14px", 
                                                padding: "20px", 
                                                marginBottom: "20px",
                                                color: "#334155"
                                            }}
                                            value={editComment[book.id] ?? book.comment ?? ""}
                                            onChange={(e) => setEditComment({...editComment, [book.id]: e.target.value})}
                                        />
                                        <div className="text-end">
                                            <Button 
                                                style={{ background: "#0f172a", border: "none", padding: "12px 32px", fontWeight: "600", borderRadius: "12px", fontSize: "14px" }}
                                                onClick={() => handleSaveComment(book)}
                                            >
                                                Authorize & Save Log
                                            </Button>
                                        </div>
                                    </div>
                                </Col>
                           </Row>
                        ) : (
                            <div className="text-center py-5" style={{ background: "white", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
                                <FaShieldAlt size={40} className="text-success opacity-25 mb-3" />
                                <h6 style={{ fontSize: "15px", fontWeight: "700", color: "#64748b" }}>Condition Log Locked</h6>
                                <p style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "400px", margin: "0 auto" }}>
                                    This book is currently in good standing. Technical comments and status dates are only available when an integrity alert (Damaged/Lost) is active.
                                </p>
                            </div>
                        )}
                    </div>
                  </div>
                </Collapse>
              </React.Fragment>
            );
          })}
          
          {filteredBooks.length === 0 && (
             <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                    <FaSearch size={40} className="text-muted" />
                </div>
                <h5 style={{ fontWeight: "700", color: "#64748b" }}>Zero matches found</h5>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Try adjusting your keywords or status filters.</p>
             </div>
          )}
        </div>

        {/* Audit Navigation */}
        <div style={{ padding: "24px 32px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfdfe" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
            Showing <strong style={{ color: "#0f172a" }}>{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong style={{ color: "#0f172a" }}>{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</strong> of <strong style={{ color: "#0f172a" }}>{filteredBooks.length}</strong> catalog entries
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
             <Button 
                variant="white" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{ background: "white", border: "1px solid #e1e8f0", borderRadius: "10px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", color: "#475569" }}
             >
                Previous
             </Button>

             <div className="d-flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .map(page => (
                    <Button 
                        key={page}
                        variant={currentPage === page ? "primary" : "white"}
                        size="sm" 
                        onClick={() => setCurrentPage(page)}
                        style={{ 
                            borderRadius: "10px", 
                            width: "32px", 
                            height: "32px", 
                            padding: 0, 
                            fontSize: "12px", 
                            fontWeight: "700",
                            border: currentPage === page ? "none" : "1px solid #e1e8f0"
                        }}
                    >
                        {page}
                    </Button>
                ))}
             </div>

             <Button 
                variant="white" 
                size="sm" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{ background: "white", border: "1px solid #e1e8f0", borderRadius: "10px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", color: "#475569" }}
             >
                Next
             </Button>
          </div>
        </div>
      </Card>
      
      {/* Metric Overlays */}
      <Row className="mt-4 g-4">
        {[
          { label: "Damaged / Audit", val: books.filter(b => b.status === "damaged").length, icon: <FaExclamationTriangle />, color: "#d97706", bg: "#fffbeb" },
          { label: "Lost / Maintenance", val: books.filter(b => b.status === "lost").length, icon: <FaSkullCrossbones />, color: "#e11d48", bg: "#fff1f2" },
          { label: "Collection Health", val: `${books.length > 0 ? Math.round(((books.length - books.filter(b => b.status === 'damaged' || b.status === 'lost').length) / books.length) * 100) : 100}%`, icon: <FaShieldAlt />, color: "#16a34a", bg: "#f0fdf4" }
        ].map((stat, idx) => (
          <Col md={4} key={idx}>
            <Card style={{ borderRadius: "24px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", background: "white" }}>
              <Card.Body style={{ padding: "28px" }}>
                 <div className="d-flex justify-content-between">
                   <div>
                     <p style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px 0" }}>{stat.label}</p>
                     <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stat.val}</h2>
                   </div>
                   <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                      {stat.icon}
                   </div>
                 </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <style>{`
        .audit-row:hover {
            background: #fcfdfe !important;
            box-shadow: inset 4px 0 0 #3b82f6;
        }
        .audit-row.active {
            box-shadow: inset 4px 0 0 #ea580c;
        }
        .search-input-premium:focus {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
            border-color: #3b82f6 !important;
            background: white !important;
        }
        .action-btn-circle {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .action-btn-circle:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
      `}</style>

    </div>
  );
}

export default AdminBookStatus;