import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";

function Login({ setAuth }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {

    e.preventDefault();
    setError("");

    try {

      const response = await axios.get(
        `http://localhost:9999/users?username=${username}`
      );

      const user = response.data[0];

      if (user && user.password === password) {

        setAuth(user);
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "admin") {
          navigate("/admin/books");
        }
        else if (user.role === "staff") {
          navigate("/staff/requests");
        }
        else {
          navigate("/user/books");
        }

      }
      else {
        setError("Invalid username or password");
      }

    }
    catch {
      setError("Login failed. Please try again.");
    }

  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">

      <Card style={{ width: "400px", padding: "25px", boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}>

        <h3 className="text-center mb-4">Library Login</h3>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleLogin}>

          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 mb-3">
            Login
          </Button>

        </Form>

        {/* LINKS */}
        <div className="text-center">

          <p className="mb-1">
            Chưa có tài khoản?{" "}
            <Link to="/register">Đăng ký</Link>
          </p>

          <Link to="/forgot-password">
            Quên mật khẩu?
          </Link>

        </div>

      </Card>

    </Container>
  );
}

export default Login;