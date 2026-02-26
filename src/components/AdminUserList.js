import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';

function AdminUserList() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState({ id: null, username: '', password: '', role: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('http://localhost:9999/users');
                setUsers(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Function to handle Add and Edit User
    const handleSaveUser = async () => {
        setLoading(true);
        try {
            if (!currentUser.username || !currentUser.password || !currentUser.role) {
                setError('Username, Password, and Role are required');
                return;
            }

            if (currentUser.id) {
                // Update User
                await axios.put(`http://localhost:9999/users/${currentUser.id}`, currentUser);
            } else {
                // Add New User
                await axios.post('http://localhost:9999/users', currentUser);
            }
            setShowModal(false);
            setCurrentUser({ id: null, username: '', password: '', role: '' }); // Reset form
            // Re-fetch users after adding/updating
            const res = await axios.get('http://localhost:9999/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    // Function to handle Delete User
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setLoading(true);
            try {
                await axios.delete(`http://localhost:9999/users/${userId}`);
                // Re-fetch users after deletion
                const res = await axios.get('http://localhost:9999/users');
                setUsers(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to delete user');
            } finally {
                setLoading(false);
            }
        }
    };

    // Open modal for adding a new user
    const openAddUserModal = () => {
        setCurrentUser({ id: null, username: '', password: '', role: '' });
        setShowModal(true);
    };

    // Open modal for editing an existing user
    const openEditUserModal = (user) => {
        setCurrentUser(user);
        setShowModal(true);
    };

    return (
        <div>
            <h2>Manage Users</h2>
            <Button className="me-2 mb-2" variant="primary" onClick={openAddUserModal}>Add User</Button>

            {error && <Alert variant="danger">{error}</Alert>}

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="text-center">
                                <Spinner animation="border" /> Loading...
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.password}</td>
                                <td>{user.role}</td>
                                <td>
                                    <Button className="me-2" variant="warning" onClick={() => openEditUserModal(user)}>Edit</Button>
                                    <Button className="me-2" variant="danger" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{currentUser.id ? 'Edit' : 'Add'} User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentUser.username}
                                onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={currentUser.password}
                                onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Role</Form.Label>
                            <Form.Control
                                as="select"
                                value={currentUser.role}
                                onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                                required
                            >
                                <option value="">Select Role</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button variant="primary" onClick={handleSaveUser}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AdminUserList;
