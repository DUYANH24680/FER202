import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaSave, FaRedo, FaInfoCircle } from 'react-icons/fa';

function ManageRules() {
    const defaultRules = {
        id: 1,
        maxBorrowDays: 14,
        maxBooksPerUser: 3,
        finePerDay: 5000,
        pricePerBook: 10000,
        lostbook: 100000,
        damagedbook: 50000
    };

    const [rules, setRules] = useState(defaultRules);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:9999/settings/1');
            if (res.data) {
                setRules(res.data);
            }
        } catch (err) {
            console.error("Error loading rules:", err);
            setMessage({ type: 'danger', text: 'Failed to load rules from server. Using default settings.' });
            setRules(defaultRules);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setRules(defaultRules);
        setMessage({ type: 'info', text: 'Reset to default rules. Click Save to apply.' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRules({
            ...rules,
            [name]: Number(value)
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.put('http://localhost:9999/settings/1', rules);
            setMessage({ type: 'success', text: 'Rules updated successfully!' });
        } catch (err) {
            console.error("Error saving rules:", err);
            setMessage({ type: 'danger', text: 'Error! Could not save changes.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p>Loading data...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h4 className="mb-0">Borrowing Rules Settings</h4>
                        </Card.Header>
                        <Card.Body>
                            {message.text && (
                                <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
                                    {message.text}
                                </Alert>
                            )}

                            <Form onSubmit={handleSave}>
                                {/* Max borrow days */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Maximum Borrow Days</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="maxBorrowDays"
                                            value={rules.maxBorrowDays}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                        />
                                        <InputGroup.Text>days</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Maximum time a user can keep a book.
                                    </Form.Text>
                                </Form.Group>

                                {/* Max books per user */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Maximum Books Per User</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="maxBooksPerUser"
                                            value={rules.maxBooksPerUser}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                        />
                                        <InputGroup.Text>books</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Maximum number of books a user can borrow at the same time.
                                    </Form.Text>
                                </Form.Group>

                                {/* Fine per day */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Overdue Fine (per day)</Form.Label>
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
                                        <InputGroup.Text>VND</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Fine amount added for each day a book is returned late.
                                    </Form.Text>
                                </Form.Group>

                                {/* Price per book */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Borrow Price Per Book</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="pricePerBook"
                                            value={rules.pricePerBook}
                                            onChange={handleChange}
                                            min="0"
                                            step="1000"
                                            required
                                        />
                                        <InputGroup.Text>VND / book</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Fixed price per book when borrowing.
                                    </Form.Text>
                                </Form.Group>

                                {/* Lost book fee */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Lost Book Fee</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="lostbook"
                                            value={rules.lostbook}
                                            onChange={handleChange}
                                            min="0"
                                            step="1000"
                                            required
                                        />
                                        <InputGroup.Text>VND / book</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Amount a user must pay when a book is lost.
                                    </Form.Text>
                                </Form.Group>

                                {/* Damaged book fee */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Damaged Book Fee</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            name="damagedbook"
                                            value={rules.damagedbook}
                                            onChange={handleChange}
                                            min="0"
                                            step="1000"
                                            required
                                        />
                                        <InputGroup.Text>VND / book</InputGroup.Text>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Amount a user must pay when a book is damaged.
                                    </Form.Text>
                                </Form.Group>

                                <hr />

                                <div className="d-flex justify-content-between">
                                    <Button variant="outline-secondary" onClick={handleReset} disabled={saving}>
                                        <FaRedo /> Reset to Default
                                    </Button>
                                    <Button variant="primary" type="submit" disabled={saving}>
                                        {saving ? <Spinner size="sm" animation="border" /> : <><FaSave /> Save Changes</>}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                        <Card.Footer className="text-muted small">
                            <FaInfoCircle /> Changes will take effect immediately for new borrow requests.
                        </Card.Footer>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ManageRules;
