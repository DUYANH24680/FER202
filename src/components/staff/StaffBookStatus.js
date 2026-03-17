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
  Button
} from "react-bootstrap";
import moment from "moment";

const API = "http://localhost:9999";

function AdminBookStatus() {
  const [books, setBooks] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editComment, setEditComment] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setExpanded(null); // auto close after save
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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (book) => {
    if (book.status === "lost")
      return <span style={{ background: "#ffe4e6", color: "#e11d48", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Lost</span>;
    if (book.status === "damaged")
      return <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Damaged</span>;
    if (!book.status && book.available)
      return <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Available</span>;
    if (!book.status && !book.available)
      return <span style={{ background: "#e2e8f0", color: "#1e293b", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Borrowed</span>;
    if (book.status === "borrowed")
      return <span style={{ background: "#e2e8f0", color: "#1e293b", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Borrowed</span>;
    
    return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Unknown</span>;
  };

  return (
    <div style={{ padding: "32px", background: "#f8f6f6", minHeight: "100vh" }}>

      {/* Header section comparable to the mockup */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#1e293b" }}>Book Condition Management</h2>
          <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "15px" }}>Audit and maintain the physical condition of the library collection.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", maxWidth: "800px" }}>
         <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
            <Form.Control 
              placeholder="Search books by title, barcode, or author..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 12px 12px 48px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            />
         </div>
         <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
               width: "200px",
               background: "white",
               border: "1px solid #e2e8f0",
               borderRadius: "12px",
               padding: "12px 16px",
               boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
               color: "#475569",
               fontWeight: "500"
            }}
         >
            <option value="all">All Statuses</option>
            <option value="available">🟢 Available</option>
            <option value="borrowed">📓 Borrowed</option>
            <option value="damaged">⚠️ Damaged</option>
            <option value="lost">🚨 Lost</option>
         </Form.Select>
      </div>

      {/* Main Table Card */}
      <Card style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden", background: "white" }}>
        
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <div>Book Reference</div>
          <div>Title & Author</div>
          <div>Current Status</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {/* Table Body */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {paginatedBooks.map(book => {
            const isExpanded = expanded === book.id;
            
            return (
              <React.Fragment key={book.id}>
                {/* Row */}
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 2fr 1fr 1fr", 
                    padding: "20px 24px", 
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                    background: isExpanded ? "#f8fafc" : "white",
                    transition: "background 0.2s"
                  }}
                >
                  
                  {/* Reference & Image */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "64px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {book.image ? (
                        <Image src={book.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "20px" }}>📘</span>
                      )}
                    </div>
                    <span style={{ color: book.status === "damaged" ? "#ea580c" : "#94a3b8", fontSize: "14px", fontWeight: "600" }}>
                      #{book.barcode || `LT-${book.id.toString().padStart(4, '0')}`}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h5 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>{book.title}</h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{book.author || "Unknown Author"}</p>
                  </div>

                  {/* Status */}
                  <div>
                    {getStatusBadge(book)}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "16px" }}>
                    
                    {/* Action Icons based on Status */}
                    <div style={{ display: "flex", gap: "12px", color: "#94a3b8", fontSize: "16px" }}>
                      {book.status === "damaged" || book.status === "lost" ? (
                        <>
                          <Button 
                            variant="light" 
                            size="sm" 
                            style={{ background: "white", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}
                            onClick={() => {
                              updateBook(book, {
                                status: null,
                                available: true,
                                statusDate: null
                              });
                            }}
                          >
                            Reset Status
                          </Button>
                        </>
                      ) : (
                        <>
                           <button 
                             style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#94a3b8", transition: "color 0.2s" }}
                             onClick={() => {
                               setExpanded(isExpanded ? null : book.id);
                               updateBook(book,{
                                 status:"damaged",
                                 available:false,
                                 statusDate:new Date().toISOString()
                               });
                             }}
                             title="Mark as Damaged"
                           >
                              💔
                           </button>
                           <button 
                             style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#94a3b8", transition: "color 0.2s" }}
                             onClick={() => {
                               setExpanded(isExpanded ? null : book.id);
                               updateBook(book,{
                                 status:"lost",
                                 available:false,
                                 statusDate:new Date().toISOString()
                               });
                             }}
                             title="Mark as Lost"
                           >
                              🚫
                           </button>
                        </>
                      )}
                    </div>

                    {/* Expand Toggle */}
                    <button 
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: isExpanded ? "#ea580c" : "#94a3b8", 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        padding: 0
                      }}
                      onClick={() => setExpanded(isExpanded ? null : book.id)}
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <path d="M10.59 0.589966L6 5.16997L1.41 0.589966L0 1.99997L6 7.99997L12 1.99997L10.59 0.589966Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>

                </div>

                {/* Expanded Details Panel */}
                <Collapse in={isExpanded}>
                  <div>
                    <div style={{ background: "#fdfbfb", padding: "24px", borderBottom: "1px solid #f1f5f9" }}>
                      <Row>
                        <Col md={4}>
                           <h6 style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Status Updated Date</h6>
                           <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1e293b", fontSize: "14px", fontWeight: "500", marginBottom: "24px" }}>
                             <span>📅</span> {book.statusDate ? moment(book.statusDate).format("MMM DD, YYYY HH:mm") : "N/A"}
                           </div>

                           {book.status === "damaged" && (
                             <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "16px" }}>
                               <div style={{ display: "flex", gap: "12px" }}>
                                 <span style={{ color: "#d97706" }}>⚠️</span>
                                 <div>
                                    <h6 style={{ margin: "0 0 4px 0", color: "#92400e", fontSize: "13px", fontWeight: "700" }}>ATTENTION REQUIRED</h6>
                                    <p style={{ margin: 0, color: "#b45309", fontSize: "13px", lineHeight: "1.5" }}>Physical binding damage reported. Needs restoration before relisting.</p>
                                 </div>
                               </div>
                             </div>
                           )}
                           
                           {book.status === "lost" && (
                             <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "16px" }}>
                               <div style={{ display: "flex", gap: "12px" }}>
                                 <span style={{ color: "#e11d48" }}>🚨</span>
                                 <div>
                                    <h6 style={{ margin: "0 0 4px 0", color: "#9f1239", fontSize: "13px", fontWeight: "700" }}>ATTENTION REQUIRED</h6>
                                    <p style={{ margin: 0, color: "#be123c", fontSize: "13px", lineHeight: "1.5" }}>Book marked as lost. Consider ordering replacement.</p>
                                 </div>
                               </div>
                             </div>
                           )}
                        </Col>
                        
                        <Col md={8}>
                           <h6 style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>Comment / Reason for Condition Status</h6>
                           
                           <Form.Control 
                             as="textarea"
                             rows={4}
                             placeholder="Provide a detailed description of the damage or circumstances of loss..."
                             style={{ border: "1px solid #e2e8f0", borderRadius: "8px", resize: "none", fontSize: "14px", padding: "16px" }}
                             value={editComment[book.id] ?? book.comment ?? ""}
                             onChange={(e) => setEditComment({...editComment, [book.id]: e.target.value})}
                           />
                           
                           <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                             <Button 
                               style={{ background: "#ea580c", border: "none", padding: "8px 24px", fontWeight: "600", borderRadius: "8px" }}
                               onClick={() => handleSaveComment(book)}
                             >
                               Save Comment
                             </Button>
                           </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Collapse>

              </React.Fragment>
            );
          })}
          
          {filteredBooks.length === 0 && (
             <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>📚</span>
                <p style={{ fontSize: "16px", fontWeight: "500" }}>No books found matching criteria.</p>
             </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
          <div style={{ fontSize: "14px", color: "#64748b" }}>
            Showing <span style={{ fontWeight: "700", color: "#1e293b" }}>{paginatedBooks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span style={{ fontWeight: "700", color: "#1e293b" }}>{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</span> of <span style={{ fontWeight: "700", color: "#1e293b" }}>{filteredBooks.length}</span> results
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
             <Button 
                variant="light" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{ background: "white", border: "1px solid #e2e8f0", color: currentPage === 1 ? "#cbd5e1" : "#475569", fontWeight: "600" }}
             >
                Previous
             </Button>

             {Array.from({ length: totalPages }, (_, i) => i + 1)
               .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
               .map((page, index, array) => (
                 <React.Fragment key={page}>
                   {index > 0 && array[index - 1] !== page - 1 && (
                     <span style={{ padding: "0 8px", color: "#94a3b8", display: "flex", alignItems: "center" }}>...</span>
                   )}
                   <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => setCurrentPage(page)}
                      style={{ 
                        background: currentPage === page ? "#ea580c" : "white", 
                        border: currentPage === page ? "none" : "1px solid #e2e8f0", 
                        color: currentPage === page ? "white" : "#475569", 
                        fontWeight: "600", 
                        width: "32px", 
                        height: "32px", 
                        padding: 0 
                      }}
                   >
                      {page}
                   </Button>
                 </React.Fragment>
             ))}

             <Button 
                variant="light" 
                size="sm" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{ background: "white", border: "1px solid #e2e8f0", color: currentPage === totalPages || totalPages === 0 ? "#cbd5e1" : "#475569", fontWeight: "600" }}
             >
                Next
             </Button>
          </div>
        </div>

      </Card>
      
      {/* KPI Cards Placeholder - Mockup bottom area */}
      <Row className="mt-4">
        <Col md={4}>
          <Card style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Card.Body style={{ padding: "24px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                 <div>
                   <h6 style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" }}>Action Required</h6>
                   <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                     {books.filter(b => b.status === "damaged").length}
                   </h2>
                 </div>
                 <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                    ⚠️
                 </div>
               </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Card.Body style={{ padding: "24px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                 <div>
                   <h6 style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" }}>Total Lost Items</h6>
                   <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                     {books.filter(b => b.status === "lost").length}
                   </h2>
                 </div>
                 <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#ffe4e6", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                    🚨
                 </div>
               </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <Card.Body style={{ padding: "24px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                 <div>
                   <h6 style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" }}>Health Index</h6>
                   <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                     {books.length > 0 ? Math.round(((books.length - books.filter(b => b.status === 'damaged' || b.status === 'lost').length) / books.length) * 100) : 100}%
                   </h2>
                 </div>
                 <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                    🛡️
                 </div>
               </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </div>
  );
}

export default AdminBookStatus;