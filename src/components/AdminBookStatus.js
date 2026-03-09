import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Badge,
  Container,
  Card,
  Collapse,
  Form,
  Image
} from "react-bootstrap";

const API = "http://localhost:9999";

function AdminBookStatus() {

  const [books, setBooks] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editComment, setEditComment] = useState({});

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const res = await axios.get(`${API}/books`);
    setBooks(res.data);
  };

  const updateBook = async (book, newData) => {
    await axios.put(`${API}/books/${book.id}`, {
      ...book,
      ...newData
    });

    fetchBooks();
  };

  const handleSaveComment = async (book) => {
    await updateBook(book, {
      comment: editComment[book.id]
    });
  };

  const getStatusBadge = (book) => {

    if (book.status === "lost")
      return <Badge bg="danger">Lost</Badge>;

    if (book.status === "damaged")
      return <Badge bg="warning">Damaged</Badge>;

    if (!book.status && book.available)
      return <Badge bg="success">Available</Badge>;

    if (!book.status && !book.available)
      return <Badge bg="secondary">Borrowed</Badge>;

  };

  return (

    <Container className="mt-4">

      <Card className="shadow-lg border-0">

        <Card.Body>

          <h2 className="fw-bold mb-4">
            📦 Book Condition Management
          </h2>

          <Table hover responsive>

            <thead className="table-dark">
              <tr>
                <th width="90">Image</th>
                <th width="35%">Title</th>
                <th>Status</th>
                <th width="250">Actions</th>
              </tr>
            </thead>

            <tbody>

              {books.map(book => (

                <React.Fragment key={book.id}>

                  <tr
                    style={{cursor:"pointer"}}
                    onClick={() =>
                      setExpanded(expanded === book.id ? null : book.id)
                    }
                  >

                    {/* IMAGE */}
                    <td>
                      <Image
                        src={book.image}
                        width={60}
                        height={80}
                        style={{objectFit:"cover"}}
                        rounded
                      />
                    </td>

                    {/* TITLE */}
                    <td className="fw-semibold">
                      {book.title}
                    </td>

                    {/* STATUS */}
                    <td>
                      {getStatusBadge(book)}
                    </td>

                    {/* ACTIONS */}
                    <td>

                      <Button
                        size="sm"
                        variant="outline-success"
                        className="me-2"
                        onClick={(e)=>{
                          e.stopPropagation();
                          updateBook(book,{
                            status:null,
                            available:true,
                            statusDate:null
                          });
                        }}
                      >
                        Reset
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-warning"
                        className="me-2"
                        onClick={(e)=>{
                          e.stopPropagation();
                          updateBook(book,{
                            status:"damaged",
                            available:false,
                            statusDate:new Date().toISOString().slice(0,10)
                          });
                        }}
                      >
                        Damaged
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={(e)=>{
                          e.stopPropagation();
                          updateBook(book,{
                            status:"lost",
                            available:false,
                            statusDate:new Date().toISOString().slice(0,10)
                          });
                        }}
                      >
                        Lost
                      </Button>

                    </td>

                  </tr>

                  {/* EXPANDED ROW */}

                  <tr>

                    <td colSpan="4" style={{padding:0,border:"none"}}>

                      <Collapse in={expanded === book.id}>

                        <div className="p-3 bg-light border">

                          <div className="mb-3">

                            <strong>Status Date:</strong>

                            <div>
                              {book.statusDate || "N/A"}
                            </div>

                          </div>

                          <div>

                            <strong>Comment / Reason</strong>

                            <Form.Control
                              as="textarea"
                              rows={2}
                              className="mt-2"
                              value={
                                editComment[book.id] ??
                                book.comment ??
                                ""
                              }
                              onChange={(e)=>
                                setEditComment({
                                  ...editComment,
                                  [book.id]:e.target.value
                                })
                              }
                            />

                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() =>
                                handleSaveComment(book)
                              }
                            >
                              Save Comment
                            </Button>

                          </div>

                        </div>

                      </Collapse>

                    </td>

                  </tr>

                </React.Fragment>

              ))}

            </tbody>

          </Table>

        </Card.Body>

      </Card>

    </Container>

  );

}

export default AdminBookStatus;