import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, Badge, Spinner } from "react-bootstrap";
import { FaHeart, FaTrash, FaBookOpen, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [wishlistRes, booksRes] = await Promise.all([
          axios.get("http://localhost:9999/wishlists"),
          axios.get("http://localhost:9999/books")
        ]);

        const wishlistData = wishlistRes.data;
        const booksData = booksRes.data;

        if (!Array.isArray(wishlistData)) {
          setWishlist([]);
          return;
        }

        const myWishlist = wishlistData
          .filter(item => String(item.userId) === String(user.id))
          .map(item => {
            const book = booksData.find(b => String(b.id) === String(item.bookId));
            return {
              ...item,
              bookId: book?.id,
              title: book?.title || "Unknown Book",
              image: book?.image,
              author: book?.author,
              category: book?.category,
              available: book?.available
            };
          });

        setWishlist(myWishlist);
      } catch (err) {
        setError("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user?.id]);

  const removeWishlist = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:9999/wishlists/${id}`);
      setWishlist(wishlist.filter(item => item.id !== id));
    } catch (err) {
      alert("Error removing from wishlist.");
    }
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <div className="p-5 bg-white rounded-4 shadow-sm">
          <FaHeart className="text-danger mb-3" size={50} />
          <h3>Access Denied</h3>
          <p className="text-muted">Please login to view your wishlist.</p>
          <Button variant="primary" onClick={() => navigate("/login")}>Login Now</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5 animate-in">
      <div className="mb-5 text-center">
        <h1 className="fw-bold text-dark d-inline-flex align-items-center mb-2">
          <FaHeart className="text-danger me-3" /> My Wishlist
        </h1>
        <p className="text-muted lead">Your collection of books to read later.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2 text-muted">Fetching your favorites...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5 text-danger">
          <p>{error}</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-5 shadow-sm border border-dashed mx-auto" style={{ maxWidth: '600px' }}>
          <div className="mb-4 opacity-25">📚</div>
          <h3 className="fw-bold">Your wishlist is empty</h3>
          <p className="text-muted px-4">Browse our collection and add books you're interested in by clicking the heart icon!</p>
          <Button variant="danger" className="rounded-pill px-4 py-2 mt-2 shadow-sm" onClick={() => navigate("/user/books")}>
            Discover Books <FaArrowRight className="ms-2" />
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          {wishlist.map(item => (
            <Col key={item.id} xs={12} sm={6} lg={4} xl={3}>
              <Card 
                className="h-100 border-0 shadow-sm hover-up rounded-4 overflow-hidden position-relative wishlist-card-premium"
                onClick={() => navigate(`/user/books/${item.bookId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="wishlist-img-wrapper">
                  <Card.Img 
                    variant="top" 
                    src={item.image} 
                    className="book-image-wishlist"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/300x450?text=No+Cover'}
                  />
                  <div className="wishlist-overlay">
                    <Button 
                      variant="white" 
                      className="rounded-circle shadow p-2 text-danger"
                      onClick={(e) => removeWishlist(e, item.id)}
                      title="Remove from Wishlist"
                    >
                      <FaTrash size={18} />
                    </Button>
                  </div>
                </div>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="light" className="text-primary border small">{item.category || "General"}</Badge>
                    <Badge bg={item.available ? "success-subtle" : "danger-subtle"} className={item.available ? "text-success" : "text-danger"}>
                      {item.available ? "In Stock" : "Unavailable"}
                    </Badge>
                  </div>
                  <Card.Title className="h6 fw-bold text-truncate mb-1">{item.title}</Card.Title>
                  <Card.Text className="small text-muted mb-3">by {item.author}</Card.Text>
                  <div className="d-grid mt-auto">
                    <Button variant="outline-primary" size="sm" className="rounded-pill fw-bold">
                      <FaBookOpen className="me-2" /> View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default Wishlist;