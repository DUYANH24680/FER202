import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Row, Col, Modal } from "react-bootstrap";
import axios from "axios";
import { FaPen, FaLock, FaExclamationTriangle } from "react-icons/fa";
import Cropper from "react-easy-crop";

// Simplified image cropping utility
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => image.onload = resolve);

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg");
};

const UserSettings = ({ auth, setAuth, handleLogout }) => {
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [avatarPreview, setAvatarPreview] = useState(auth?.avatar || null);

  // Cropper states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (auth?.avatar) {
      setAvatarPreview(auth.avatar);
    }
  }, [auth]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg({ text: "Mật khẩu mới không khớp!", type: "danger" });
      return;
    }

    try {
      const res = await axios.get(`http://localhost:9999/users/${auth.id}`);
      const user = res.data;

      if (user.password !== passwordForm.oldPassword) {
        setMsg({ text: "Mật khẩu cũ không chính xác!", type: "danger" });
        return;
      }

      await axios.patch(`http://localhost:9999/users/${auth.id}`, { password: passwordForm.newPassword });
      setMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMsg({ text: "Có lỗi xảy ra, thử lại sau.", type: "danger" });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này không? Hành động này không thể hoàn tác!")) {
      try {
        await axios.delete(`http://localhost:9999/users/${auth.id}`);
        alert("Tài khoản đã bị xóa.");
        handleLogout();
      } catch (err) {
        setMsg({ text: "Lỗi khi xóa tài khoản.", type: "danger" });
      }
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
    // Clear the input value so the same file can be selected again
    e.target.value = null;
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Update backend
      await axios.patch(`http://localhost:9999/users/${auth.id}`, { avatar: croppedImageBase64 });

      // Update global auth state
      const newAuth = { ...auth, avatar: croppedImageBase64 };
      if (typeof setAuth === 'function') {
        setAuth(newAuth);
      }
      localStorage.setItem("user", JSON.stringify(newAuth));
      setAvatarPreview(croppedImageBase64);

      // Close modal & reset
      setShowCropModal(false);
      setImageSrc(null);
      setZoom(1);
      setMsg({ text: "Cập nhật ảnh đại diện thành công!", type: "success" });
    } catch (e) {
      console.error(e);
      setMsg({ text: "Lỗi khi lưu ảnh đại diện.", type: "danger" });
    }
  };

  return (
    <Container fluid style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <div className="mb-5">
        <h2 style={{ fontWeight: "700", color: "#0f172a", fontSize: "28px", marginBottom: "8px" }}>Thiết lập Tài khoản</h2>
        <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.</p>
      </div>

      {msg.text && <Alert variant={msg.type} className="border-0 shadow-sm" style={{ borderRadius: "12px" }}>{msg.text}</Alert>}

      {/* Card 1: Ảnh đại diện */}
      <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: "16px", overflow: "hidden" }}>
        <Card.Body style={{ padding: "32px" }}>
          <h5 style={{ fontWeight: "700", color: "#1e293b", fontSize: "18px", marginBottom: "24px" }}>Ảnh đại diện</h5>

          <div className="d-flex align-items-center gap-4 flex-wrap">
            {/* Avatar Circle Container */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "#ffedd5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px"
              }}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: avatarPreview ? `url(${avatarPreview}) center/cover` : "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontSize: "32px",
                  fontWeight: "bold",
                  border: "4px solid white",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  overflow: "hidden" // To ensure the image doesn't leak out of the circle
                }}>
                  {!avatarPreview && (auth?.username?.charAt(0)?.toUpperCase() || "U")}
                </div>
              </div>

              {/* Edit Badge */}
              <Form.Label style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#ea580c",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                margin: 0
              }}>
                <FaPen size={12} />
                <Form.Control type="file" accept="image/jpeg, image/png, image/gif" hidden onChange={handleAvatarChange} />
              </Form.Label>
            </div>

            {/* Avatar Details */}
            <div>
              <h6 style={{ fontWeight: "600", color: "#1e293b", fontSize: "16px", marginBottom: "8px" }}>Ảnh đại diện của bạn</h6>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px", maxWidth: "400px" }}>
                Chúng tôi hỗ trợ các định dạng JPG, PNG hoặc GIF. Hiển thị dưới dạng hình tròn.
              </p>

              <Form.Group>
                <Form.Label style={{
                  background: "#fff7ed",
                  color: "#ea580c",
                  border: "1px solid #ffedd5",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  margin: 0,
                  transition: "all 0.2s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ffedd5"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff7ed"}
                >
                  Chọn ảnh mới
                  <Form.Control type="file" accept="image/jpeg, image/png, image/gif" hidden onChange={handleAvatarChange} />
                </Form.Label>
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Card 2: Thay đổi Mật khẩu */}
      <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: "16px", overflow: "hidden" }}>
        <Card.Body style={{ padding: "32px" }}>
          <h5 style={{ fontWeight: "700", color: "#1e293b", fontSize: "18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaLock color="#ea580c" /> Thay đổi Mật khẩu
          </h5>

          <Form onSubmit={handlePasswordChange}>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Mật khẩu hiện tại</Form.Label>
              <Form.Control
                type="password"
                placeholder="********"
                value={passwordForm.oldPassword}
                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                required
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}
              />
            </Form.Group>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="********"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Xác nhận mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="********"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button
              type="submit"
              style={{
                background: "#ea580c",
                borderColor: "#ea580c",
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: "600"
              }}
            >
              Cập nhật Mật khẩu
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Card 3: Vùng nguy hiểm */}
      <Card style={{
        borderRadius: "16px",
        border: "1px solid #fecaca",
        background: "#fef2f2",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      }}>
        <Card.Body style={{ padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h5 className="text-danger mb-2" style={{ fontWeight: "700", fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaExclamationTriangle /> Vùng nguy hiểm
            </h5>
            <p className="text-danger" style={{ fontSize: "14px", margin: 0, opacity: 0.9 }}>
              Một khi bạn xóa tài khoản, tất cả dữ liệu liên quan sẽ không thể khôi phục. Vui lòng cân nhắc kỹ.
            </p>
          </div>

          <Button
            variant="light"
            onClick={handleDeleteAccount}
            style={{
              background: "white",
              color: "#dc2626",
              border: "1px solid #fecaca",
              padding: "10px 24px",
              borderRadius: "8px",
              fontWeight: "600",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            Xóa vĩnh viễn tài khoản
          </Button>
        </Card.Body>
      </Card>

      {/* Image Cropping Modal */}
      <Modal show={showCropModal} onHide={() => setShowCropModal(false)} centered backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: "700", color: "#1e293b", fontSize: "20px" }}>Chỉnh sửa ảnh đại diện</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ position: "relative", height: "400px", padding: 0 }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8fafc", display: "flex", justifyContent: "center", gap: "16px", padding: "16px" }}>
          <div style={{ width: "200px", display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "8px 16px", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="zoom-range"
              style={{ width: "100%", accentColor: "#ea580c" }}
            />
          </div>
          <Button variant="light" onClick={() => setShowCropModal(false)} style={{ borderRadius: "8px", fontWeight: "600" }}>Hủy</Button>
          <Button style={{ background: "#ea580c", borderColor: "#ea580c", borderRadius: "8px", fontWeight: "600" }} onClick={handleSaveAvatar}>Lưu thay đổi</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default UserSettings;
