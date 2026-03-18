import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaSearch, 
  FaBook, 
  FaUser, 
  FaLayerGroup, 
  FaInfoCircle, 
  FaTimes, 
  FaFilter,
  FaCheckCircle,
  FaExclamationCircle,
  FaBarcode,
  FaQuoteLeft
} from "react-icons/fa";
import { Badge, Card, Container, Row, Col, Button, Form, Modal, Image } from "react-bootstrap";

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
      const [booksRes, seriesRes, catRes] = await Promise.all([
        axios.get(`${API}/books`),
        axios.get(`${API}/series`),
        axios.get(`${API}/categories`)
      ]);
      setBooks(booksRes.data);
      setSeries(seriesRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const getSeriesName = (seriesId) => {
    const s = series.find((x) => String(x.id) === String(seriesId));
    return s ? s.name : "N/A";
  };

  const filtered = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase();
    if (!trimmedKeyword) return books;

    return books.filter((b) => {
      if (filter === "title") return (b.title || "").toLowerCase().includes(trimmedKeyword);
      if (filter === "author") return (b.author || "").toLowerCase().includes(trimmedKeyword);
      if (filter === "series") return getSeriesName(b.seriesId).toLowerCase().includes(trimmedKeyword);
      return false;
    });
  }, [books, keyword, filter, series]);

  const getGroupStats = (book) => {
    const group = books.filter(b => b.title === book.title && b.author === book.author);
    const available = group.filter(b => b.available && !b.status).length;
    return { available, total: group.length };
  };

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", paddingBottom: "60px" }}>
      {/* Premium Search Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", 
        padding: "60px 0 100px 0",
        textAlign: "center",
        color: "white"
      }}>
        <Container>
          <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill shadow-sm" style={{ letterSpacing: "1px" }}>
            DASHBOARD ACCESS
          </Badge>
          <h1 style={{ fontSize: "42px", fontWeight: "800", marginBottom: "16px" }}>Advanced Library Search</h1>
          <p style={{ fontSize: "18px", opacity: 0.8, maxWidth: "700px", margin: "0 auto 40px auto" }}>
            Search across our entire digital collection with professional filters and detailed metadata analysis.
          </p>

          <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            padding: "8px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            gap: "8px"
          }}>
            <div style={{ flex: "0 0 180px" }}>
              <Form.Select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  height: "56px",
                  borderRadius: "14px",
                  border: "none",
                  fontWeight: "600",
                  fontSize: "15px",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                <option value="title">By Title</option>
                <option value="author">By Author</option>
                <option value="series">By Series</option>
              </Form.Select>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
               <FaSearch style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
               <Form.Control 
                 placeholder="Search keywords, barcodes, or series metadata..." 
                 value={keyword}
                 onChange={(e) => setKeyword(e.target.value)}
                 style={{ 
                    height: "56px", 
                    borderRadius: "14px", 
                    border: "none", 
                    paddingLeft: "52px",
                    fontSize: "16px",
                    fontWeight: "500",
                    boxShadow: "none"
                 }}
               />
            </div>
            <Button 
                onClick={() => setShowCategory(true)}
                variant="primary" 
                style={{ 
                    height: "56px", 
                    borderRadius: "14px", 
                    padding: "0 28px", 
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                }}
            >
              <FaLayerGroup /> Categories
            </Button>
          </div>
        </Container>
      </div>

      <Container style={{ marginTop: "-50px" }}>
        {/* Statistics Bar */}
        <Row className="mb-4 g-4 text-center">
            {[{ icon: <FaBook />, val: books.length, label: "Total items in Catalog" }, { icon: <FaCheckCircle />, val: filtered.length, label: "Matches current filters" }, { icon: <FaLayerGroup />, val: categories.length, label: "Managed Categories" }].map((s, i) => (
                <Col md={4} key={i}>
                    <Card style={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
                        <Card.Body className="d-flex align-items-center gap-3 p-3">
                            <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: i === 1 ? "#dcfce7" : "#f1f5f9", color: i === 1 ? "#16a34a" : "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
                            <div className="text-start">
                                <h4 className="fw-800 mb-0">{s.val}</h4>
                                <p className="text-muted small m-0 fw-600 uppercase">{s.label}</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>

        {/* Collection Table */}
        <Card style={{ borderRadius: "24px", border: "none", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "24px 32px", background: "white", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h5 className="m-0 fw-800 text-slate">Resource Registry</h5>
            <div className="text-muted small fw-600">Showing {filtered.length} entries matching query</div>
          </div>

          <div className="table-responsive">
            <table className="table m-0 align-middle">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className="py-3 px-4 border-0 small fw-800 text-muted uppercase">Reference</th>
                  <th className="py-3 px-4 border-0 small fw-800 text-muted uppercase">Asset Details</th>
                  <th className="py-3 px-4 border-0 small fw-800 text-muted uppercase">Associated Series</th>
                  <th className="py-3 px-4 border-0 small fw-800 text-muted uppercase">Health Status</th>
                  <th className="py-3 px-4 border-0 small fw-800 text-muted uppercase text-end">Navigation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-5 text-muted">No collective resources matched your search criteria.</td></tr>
                ) : (
                    filtered.map((b, idx) => {
                        const stats = getGroupStats(b);
                        return (
                            <tr key={b.id || idx} style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => setSelectedBook(b)} className="asset-row">
                                <td className="px-4 py-3">
                                    <div style={{ position: "relative", width: "50px", height: "70px" }}>
                                        <Image src={b.image} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="fw-700 text-slate mb-1">{b.title}</div>
                                    <div className="text-muted small"><FaUser className="me-1" size={10} /> {b.author}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge bg="light" text="dark" className="border px-2 py-1">{getSeriesName(b.seriesId)}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <div className={`fw-700 small ${stats.available > 0 ? 'text-success' : 'text-danger'}`}>
                                        {stats.available} Available / {stats.total} Total
                                    </div>
                                    <div className="progress mt-1" style={{ height: "4px", width: "100px" }}>
                                        <div className="progress-bar" style={{ width: `${(stats.available/stats.total)*100}%`, background: stats.available > 0 ? '#10b981' : '#ef4444' }}></div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-end">
                                    <Button variant="link" className="p-0 text-slate opacity-50 hover-primary"><FaInfoCircle size={20} /></Button>
                                </td>
                            </tr>
                        );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>

      {/* Categories Modal */}
      <Modal show={showCategory} onHide={() => setShowCategory(false)} centered size="lg" className="premium-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-800">Departmental Categories</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
            <Row className="g-3">
                {categories.map(cat => (
                    <Col md={4} key={cat.id}>
                        <div 
                            className="p-3 text-center border rounded-4 category-card hover-lift"
                            onClick={() => navigate(`/category/${cat.id}`)}
                            style={{ cursor: "pointer", transition: "all 0.3s" }}
                        >
                            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
                            <div className="fw-700 small text-slate">{cat.name}</div>
                        </div>
                    </Col>
                ))}
            </Row>
        </Modal.Body>
      </Modal>

      {/* Book Detail Modal */}
      <Modal show={!!selectedBook} onHide={() => setSelectedBook(null)} centered size="lg" className="asset-detail-modal">
        {selectedBook && (
          <>
            <Modal.Header closeButton className="border-0" />
            <Modal.Body className="p-5 pt-0">
              <Row>
                <Col md={5}>
                  <Image src={selectedBook.image} fluid style={{ borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid #f1f5f9" }} />
                </Col>
                <Col md={7}>
                  <div className="ps-md-4">
                    <Badge bg="dark" className="mb-3 px-3 py-1 rounded-pill">{getSeriesName(selectedBook.seriesId).toUpperCase()}</Badge>
                    <h2 className="fw-800 mb-2">{selectedBook.title}</h2>
                    <h5 className="text-muted mb-4 fw-600">by {selectedBook.author}</h5>

                    <Row className="mb-4 g-3">
                        <Col xs={6}>
                            <div className="bg-light p-3 rounded-4">
                                <label className="small text-muted fw-800 uppercase mb-1 d-block"><FaBarcode size={10} /> BARCODE</label>
                                <span className="fw-700">{selectedBook.barcode || 'N/A'}</span>
                            </div>
                        </Col>
                        <Col xs={6}>
                            <div className="bg-light p-3 rounded-4">
                                <label className="small text-muted fw-800 uppercase mb-1 d-block"><FaLayerGroup size={10} /> CATEGORY_ID</label>
                                <span className="fw-700">CAT_{selectedBook.categoryId}</span>
                            </div>
                        </Col>
                    </Row>

                    <div className="mb-4">
                        <label className="small text-muted fw-800 uppercase mb-2 d-block"><FaQuoteLeft size={10} /> DESCRIPTION</label>
                        <p className="text-muted" style={{ lineHeight: "1.6" }}>{selectedBook.description || "Administrative metadata for this item is currently pending update. No specific description available."}</p>
                    </div>

                    <div className="p-4 rounded-4 shadow-sm" style={{ background: selectedBook.available ? "#f0fdf4" : "#fff1f2", border: `1px solid ${selectedBook.available ? '#dcfce7' : '#fecdd3'}` }}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="m-0 fw-800" style={{ color: selectedBook.available ? '#166534' : '#991b1b' }}>INVENTORY STATUS</h6>
                            <Badge bg={selectedBook.available ? "success" : "danger"}>{selectedBook.available ? 'ITEM_READY' : 'ITEM_UNAVAILABLE'}</Badge>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span className="h1 m-0 fw-800" style={{ color: selectedBook.available ? '#16a34a' : '#e11d48' }}>
                                {getGroupStats(selectedBook).available}
                            </span>
                            <div>
                                <div className="fw-800 small text-slate">COPY AVAILABILITY</div>
                                <div className="text-muted small">Total collection size: {getGroupStats(selectedBook).total} items</div>
                            </div>
                        </div>
                    </div>

                    {selectedBook.comment && (
                        <div className="mt-4 p-3 border-start border-4 border-warning bg-warning bg-opacity-10 rounded-end">
                            <label className="small fw-800 text-warning uppercase d-block mb-1">Administrative Notes</label>
                            <p className="m-0 small text-dark fst-italic">"{selectedBook.comment}"</p>
                        </div>
                    )}
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-0 p-4">
                <Button variant="secondary" className="px-4 py-2 rounded-3 fw-700" onClick={() => setSelectedBook(null)}>Dismiss Overview</Button>
                <Button 
                    variant="primary" 
                    className="px-4 py-2 rounded-3 fw-700"
                    onClick={() => {
                        setSelectedBook(null);
                        navigate(`/category/${selectedBook.categoryId}`);
                    }}
                >
                    View in Category
                </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <style>{`
        .asset-row:hover {
            background-color: #f8fafc !important;
        }
        .asset-row:hover .hover-primary {
            color: #3b82f6 !important;
            opacity: 1 !important;
        }
        .category-card:hover {
            border-color: #3b82f6 !important;
            background: #f0f7ff !important;
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
        }
        .fw-800 { font-weight: 800; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .text-slate { color: #1e293b; }
        .uppercase { text-transform: uppercase; }
      `}</style>
    </div>
  );
}

export default AdminSearchPro;