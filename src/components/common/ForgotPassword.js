import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert, Container, Card } from "react-bootstrap";

function ForgotPassword() {
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [foundUser, setFoundUser] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const API = "http://localhost:9999";

  /* ---------- STEP 1: FIND USER ---------- */
  const handleFindUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.get(`${API}/users?username=${username}`);
      const user = res.data[0];

      if (!user) {
        setError("Username không tồn tại!");
        return;
      }

      setFoundUser(user);
      setStep(2); // Chuyển sang bước xác minh email/phone
    } catch {
      setError("Có lỗi xảy ra khi tìm user!");
    }
  };

  /* ---------- STEP 2: VERIFY EMAIL OR PHONE & SEND OTP ---------- */
  const handleVerifyEmailOrPhone = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!foundUser) return;

    // Chuẩn hóa dữ liệu trước khi so sánh
    const input = (emailOrPhone || "").trim().toLowerCase();
    const userEmail = (foundUser.email || "").trim().toLowerCase();
    const userPhone = (foundUser.phone || "").trim();

    if (input === userEmail || input === userPhone) {
      // Tạo OTP 6 chữ số
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otpCode);

      // Hiển thị OTP giả lập
      alert(`Mã OTP của bạn là: ${otpCode}`);

      setStep(3); // Chuyển sang bước nhập OTP
    } else {
      setError("Email hoặc số điện thoại không đúng với username này!");
    }
  };

  /* ---------- STEP 3: VERIFY OTP ---------- */
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (otpInput.trim() === generatedOtp) {
      setStep(4); // Chuyển sang bước nhập mật khẩu mới
    } else {
      setError("OTP không đúng!");
    }
  };

  /* ---------- STEP 4: RESET PASSWORD ---------- */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.patch(`${API}/users/${foundUser.id}`, {
        password: newPassword
      });

      setMessage("Đổi mật khẩu thành công!");
      setTimeout(() => navigate("/login"), 1500);
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

        {/* STEP 1 */}
        {step === 1 && (
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
            <Button type="submit" className="w-100">Tiếp tục</Button>
          </Form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Form onSubmit={handleVerifyEmailOrPhone}>
            <Form.Group className="mb-3">
              <Form.Label>Email hoặc Số điện thoại</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập email hoặc số điện thoại"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="w-100">Gửi OTP</Button>
          </Form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <Form onSubmit={handleVerifyOtp}>
            <Form.Group className="mb-3">
              <Form.Label>Nhập OTP</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập mã OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="w-100">Xác nhận OTP</Button>
          </Form>
        )}

        {/* STEP 4 */}
        {step === 4 && (
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
            <Button type="submit" variant="success" className="w-100">Đổi mật khẩu</Button>
          </Form>
        )}

        <div className="text-center mt-3">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </Card>
    </Container>
  );
}

export default ForgotPassword;