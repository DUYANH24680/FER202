import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";

function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleFindUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.get(
        `http://localhost:9999/users?username=${username}`
      );

      const user = res.data[0];

      if (!user) {
        setError("Username không tồn tại!");
        return;
      }

      setFoundUser(user);
    } catch {
      setError("Có lỗi xảy ra!");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.patch(
        `http://localhost:9999/users/${foundUser.id}`,
        {
          password: newPassword
        }
      );

      setMessage("Đổi mật khẩu thành công!");
      setTimeout(() => navigate("/"), 1500);

    } catch {
      setError("Đổi mật khẩu thất bại!");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "400px", padding: "25px", boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}>

        <h3 className="text-center mb-4">Forgot Password</h3>

        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        {!foundUser ? (
          <Form onSubmit={handleFindUser}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100">
              Xác nhận
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="success" type="submit" className="w-100">
              Đổi mật khẩu
            </Button>
          </Form>
        )}

        <div className="text-center mt-3">
          <Link to="/">Quay lại đăng nhập</Link>
        </div>

      </Card>
    </Container>
  );
}

export default ForgotPassword;