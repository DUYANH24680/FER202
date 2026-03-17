import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Card,
  Form,
  Alert,
  Spinner,
  Container,
  Row,
  Col,
  Button,
  Badge
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

function AdminImport() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getOrCreateSeries = async (seriesName) => {

    if (!seriesName) return null;

    const res = await axios.get(
      `http://localhost:9999/series?name=${encodeURIComponent(seriesName)}`
    );

    if (res.data.length > 0) {

      return res.data[0].id;

    }

    const newSeries = await axios.post(
      "http://localhost:9999/series",
      {
        name: seriesName,
        categoryId: "1"
      }
    );

    return newSeries.data.id;

  };

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

        const rows = text.split("\n").slice(1);

        books = rows
          .filter((row) => row.trim() !== "")
          .map((row) => {

            const [title, author, available, image, series, barcode] = row.split(",");

            return {
              title: title?.trim(),
              author: author?.trim(),
              available: available?.trim() === "true",
              image: image?.trim() || "",
              series: series?.trim(),
              barcode: barcode?.trim() || ""
            };

          });

      }

      // ===== EXCEL =====

      else if (extension === "xlsx") {

        const buffer = await file.arrayBuffer();

        const workbook = XLSX.read(buffer, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        books = rawData.map((row) => {

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
            image: normalizedRow.image?.toString().trim() || "",
            series: normalizedRow.series?.toString().trim(),
            barcode: normalizedRow.barcode?.toString().trim() || ""
          };

        });

      } else {

        throw new Error("Unsupported file type");

      }

      // ===== INSERT DATA =====

      for (let book of books) {

        if (!book.title || !book.author) continue;

        let seriesId = await getOrCreateSeries(book.series);

        const res = await axios.get(
          `http://localhost:9999/books?title=${encodeURIComponent(book.title)}`
        );

        if (res.data.length > 0) {

          for (let oldBook of res.data) {

            await axios.delete(
              `http://localhost:9999/books/${oldBook.id}`
            );

          }

        }

        await axios.post(
          "http://localhost:9999/books",
          {
            title: book.title,
            author: book.author,
            available: book.available,
            image: book.image,
            seriesId: seriesId,
            categoryId: "1",
            status: "available",
            barcode: book.barcode
          }
        );

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
    <div style={{ padding: "30px" }}>
      {/* Header Area */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span style={{ color: "#1e293b", fontSize: "16px", fontWeight: "600" }}>Import Collection</span>
        </div>
        <Button 
          variant="light" 
          className="border"
          onClick={() => navigate("/admin/books")}
          style={{ fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", background: "white" }}
        >
          ← Back to Books
        </Button>
      </div>

      <Row>
        {/* Left Column - Main Import Area */}
        <Col lg={8} md={12} className="mb-4">
          
          {/* Banner */}
          <div style={{
            background: "linear-gradient(135deg, #32cdff 0%, #00f2fe 100%)",
            borderRadius: "12px",
            padding: "40px 30px",
            color: "white",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 10px 20px rgba(0, 242, 254, 0.15)"
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
                ☁️ Bulk Import Books
              </h2>
              <p style={{ margin: 0, fontSize: "15px", opacity: 0.9, maxWidth: "500px", lineHeight: "1.5" }}>
                Quickly populate your library by uploading your catalog in bulk. We support standard spreadsheet formats with automatic mapping.
              </p>
            </div>
            <div style={{ fontSize: "80px", opacity: 0.3, paddingLeft: "20px" }}>
              📄
            </div>
          </div>

          {/* Success / Info / Error Alert */}
          {message && (
            <Alert variant="success" style={{ borderRadius: "8px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", fontWeight: "500" }}>
              ✅ {message}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" style={{ borderRadius: "8px", border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontWeight: "500" }}>
              ❌ {error}
            </Alert>
          )}
          {!message && !error && (
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "16px 20px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <div style={{ background: "#22c55e", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✓</div>
              Ready to process! Drag your file below or click to browse.
            </div>
          )}

          {/* Upload Container */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: "12px" }}>
            <Card.Body className="p-0">
              <div style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                margin: "24px",
                padding: "60px 20px",
                textAlign: "center",
                background: "#f8fafc",
                transition: "all 0.3s ease"
              }}>
                
                <div style={{
                  width: "60px",
                  height: "60px",
                  background: "#e2e8f0",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "20px",
                  color: "#64748b"
                }}>
                  ⬆️
                </div>

                <h4 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", marginBottom: "12px" }}>
                  Upload your data file
                </h4>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px", maxWidth: "300px", margin: "0 auto 24px auto" }}>
                  Select a .csv or .xlsx file from your computer. Max file size is 10MB.
                </p>

                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleImport}
                  disabled={loading}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />

                <Button 
                  onClick={handleBrowseClick}
                  disabled={loading}
                  style={{
                    background: "#ea580c",
                    border: "none",
                    padding: "12px 32px",
                    fontWeight: "600",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(234, 88, 12, 0.15)"
                  }}
                >
                  Browse Files
                </Button>
                
              </div>

              {/* Footer of upload area */}
              <div style={{
                padding: "0 24px 24px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#334155", fontSize: "14px", fontWeight: "600" }}>
                  Supported Formats:
                  <Badge style={{ background: "#2563eb", color: "white", padding: "6px 12px", borderRadius: "16px", fontSize: "12px", letterSpacing: "0.5px" }}>CSV</Badge>
                  <Badge style={{ background: "#16a34a", color: "white", padding: "6px 12px", borderRadius: "16px", fontSize: "12px", letterSpacing: "0.5px" }}>EXCEL</Badge>
                </div>

                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#94a3b8", fontSize: "14px" }}>
                    Processing data... 
                    <Spinner animation="border" size="sm" style={{ color: "#ea580c" }} />
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Helper & Error */}
        <Col lg={4} md={12}>
          
          {/* Helper Card */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
            <Card.Body className="p-4">
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  background: "#ea580c",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}>i</div>
                <h5 style={{ margin: 0, fontWeight: "bold", fontSize: "16px", color: "#1e293b" }}>File Format Helper</h5>
              </div>

              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px", lineHeight: "1.6" }}>
                Your file must include the following headers for successful mapping:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { key: "title", desc: "Official book name (Required)", icon: "📑" },
                  { key: "author", desc: "Writer's full name (Required)", icon: "👤" },
                  { key: "available", desc: "True/False for stock status", icon: "✓" },
                  { key: "image", desc: "URL to cover art", icon: "🖼" },
                  { key: "series", desc: "Name of the collection", icon: "📚" },
                  { key: "barcode", desc: "Unique inventory ID code", icon: "🏷️" }
                ].map((item, idx) => (
                  <div key={idx} style={{ 
                    background: "#f8fafc", 
                    padding: "12px", 
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}>
                    <div style={{ background: "#e2e8f0", padding: "4px 8px", borderRadius: "4px", fontSize: "14px" }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "#1e293b", marginBottom: "2px" }}>{item.key}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

            </Card.Body>
          </Card>

          {/* Common Error Card */}
          <Card style={{ 
            background: "#fff1f2", 
            border: "1px solid #ffe4e6", 
            borderRadius: "12px",
            boxShadow: "none"
          }}>
            <Card.Body className="p-4">
              <h6 style={{ color: "#e11d48", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>⚠️</span> COMMON ERROR
              </h6>
              <p style={{ margin: 0, color: "#be123c", fontSize: "13px", lineHeight: "1.5" }}>
                Missing headers: ensure your file has the exact column names as listed above to avoid import failure.
              </p>
            </Card.Body>
          </Card>

        </Col>
      </Row>
    </div>
  );

}

export default AdminImport;