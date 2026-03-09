import React, { useState } from "react";
import axios from "axios";
import {
  Card,
  Form,
  Alert,
  Spinner,
  Container,
  Row,
  Col,
  Button
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

function AdminImport() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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

            const [title, author, available, image, series] = row.split(",");

            return {
              title: title?.trim(),
              author: author?.trim(),
              available: available?.trim() === "true",
              image: image?.trim() || "",
              series: series?.trim()
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
            series: normalizedRow.series?.toString().trim()
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
            status: "available"
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

    <Container className="p-4">

      <div
        style={{
          background: "linear-gradient(90deg,#4facfe,#00f2fe)",
          borderRadius: "10px",
          padding: "20px",
          color: "white",
          marginBottom: "30px"
        }}
      >

        <h2>📥 Import Books</h2>

        <p style={{marginBottom:0}}>
          Upload CSV or Excel file to import books into the system
        </p>

      </div>

      <Row className="justify-content-center">

        <Col md={7}>

          <Card className="shadow border-0">

            <Card.Body className="text-center p-5">

              <h4 className="mb-3">
                📂 Upload File
              </h4>

              <p className="text-muted">
                Supported formats: CSV, Excel (.xlsx)
              </p>

              <Form.Group>

                <Form.Control
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleImport}
                  disabled={loading}
                />

              </Form.Group>

              {loading && (

                <div className="mt-4">

                  <Spinner animation="border" />

                  <p className="mt-2">
                    Importing books...
                  </p>

                </div>

              )}

              {message && (
                <Alert variant="success" className="mt-3">
                  {message}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="mt-3">
                  {error}
                </Alert>
              )}

              <div className="mt-4 text-start">

                <h6>📄 File Format</h6>

                <div
                  style={{
                    background:"#f8f9fa",
                    padding:"10px",
                    borderRadius:"6px",
                    fontSize:"14px"
                  }}
                >
                  title | author | available | image | series
                </div>

              </div>

              <div className="mt-4">

                <Button
                  variant="secondary"
                  onClick={() => navigate("/admin/books")}
                >
                  ← Back to Books
                </Button>

              </div>

            </Card.Body>

          </Card>

        </Col>

      </Row>

    </Container>

  );

}

export default AdminImport;