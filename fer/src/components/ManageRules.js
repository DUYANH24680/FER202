import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaSave, FaRedo, FaInfoCircle } from 'react-icons/fa';

function ManageRules() {
    const [rules, setRules] = useState({
        id: 1,
        maxBorrowDays: 14,
        maxBooksPerUser: 3,
        finePerDay: 5000
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Lấy dữ liệu quy định từ server
    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:9999/settings/1');
            setRules(res.data);
        } catch (err) {
            console.error("Lỗi khi tải quy định:", err);
            setMessage({ type: 'danger', text: 'Không thể tải quy định từ máy chủ.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRules({
            ...rules,
            [name]: Number(value) // Chuyển sang kiểu số
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.put('http://localhost:9999/settings/1', rules);
            setMessage({ type: 'success', text: 'Cập nhật quy định thành công!' });
        } catch (err) {
            console.error("Lỗi khi lưu quy định:", err);
            setMessage({ type: 'danger', text: 'Lỗi! Không thể lưu thay đổi.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h4 className="mb-0">Thiết lập quy định mượn sách</h4>
                        </Card.Header>
                        <Card.Body>
                            {message.text && (
                                <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
                                    {message.text}
                                </Alert>
                            )}

                            <Form onSubmit={handleSave}>
                                {/* Số ngày mượn tối đa */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Số ngày mượn tối đa</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="maxBorrowDays"
                                            value={rules.maxBorrowDays}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                        />
                                        <InputGroup.Text>ngày</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Thời gian tối đa một người dùng có thể giữ sách.
                                    </Form.Text>
                                </Form.Group>

                                {/* Số lượng sách tối đa */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Số lượng sách tối đa</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="maxBooksPerUser"
                                            value={rules.maxBooksPerUser}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                        />
                                        <InputGroup.Text>cuốn</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Số lượng sách tối đa một người dùng có thể mượn cùng lúc.
                                    </Form.Text>
                                </Form.Group>

                                {/* Tiền phạt mỗi ngày */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Tiền phạt quá hạn (mỗi ngày)</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="finePerDay"
                                            value={rules.finePerDay}
                                            onChange={handleChange}
                                            min="0"
                                            step="500"
                                            required
                                        />
                                        <InputGroup.Text>VNĐ</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Số tiền phạt cộng thêm cho mỗi ngày trả sách chậm.
                                    </Form.Text>
                                </Form.Group>

                                <hr />

                                <div className="d-flex justify-content-between">
                                    <Button variant="outline-secondary" onClick={fetchRules} disabled={saving}>
                                        <FaRedo /> Hoàn tác
                                    </Button>
                                    <Button variant="primary" type="submit" disabled={saving}>
                                        {saving ? <Spinner size="sm" animation="border" /> : <><FaSave /> Lưu thay đổi</>}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                        <Card.Footer className="text-muted small">
                            <FaInfoCircle /> Thay đổi này sẽ áp dụng ngay lập tức cho các yêu cầu mượn mới.
                        </Card.Footer>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ManageRules;