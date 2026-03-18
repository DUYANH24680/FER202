import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';

function AdminUserList({ auth }) {
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
        setError(null);
        try {
            if (!currentUser.username || !currentUser.password || !currentUser.role) {
                setError('Username, Password, and Role are required');
                setLoading(false);
                return;
            }

            if (currentUser.id) {
                // Update User
                await axios.put(`http://localhost:9999/users/${currentUser.id}`, currentUser);
            } else {
                // Add New User
                const { id, ...newUser } = currentUser;
                await axios.post('http://localhost:9999/users', newUser);
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
    const handleDeleteUser = async (userToDelete) => {
        if (userToDelete.id === auth?.id) {
            setError("Bạn không thể xóa chính mình!");
            return;
        }
        if (userToDelete.role === 'admin') {
            setError("Không thể xóa tài khoản Quản trị viên khác!");
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userToDelete.username}"?`)) {
            setLoading(true);
            try {
                await axios.delete(`http://localhost:9999/users/${userToDelete.id}`);
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
        setError(null);
        setShowModal(true);
    };

    // Open modal for editing an existing user
    const openEditUserModal = (user) => {
        setCurrentUser(user);
        setError(null);
        setShowModal(true);
    };

    return (
        <div className="p-4 bg-transparent">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="page-title mb-1">👥 User Management</h1>
                    <p className="text-muted mb-0">Manage system users, administrators and staff members.</p>
                </div>
                <Button variant="primary" className="btn-primary shadow-sm" onClick={openAddUserModal}>
                    + Create New User
                </Button>
            </div>

            {error && <Alert variant="danger" className="border-0 shadow-sm mb-4" dismissible onClose={() => setError(null)}>{error}</Alert>}

            <div className="card-premium border-0 shadow-sm overflow-hidden" style={{ background: "white" }}>
                <Table hover responsive className="mb-0 overflow-hidden" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                    <thead style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
                        <tr>
                            <th className="px-4 py-3 border-0">User Info</th>
                            <th className="px-4 py-3 border-0">Password</th>
                            <th className="px-4 py-3 border-0">Role & Access</th>
                            <th className="px-4 py-3 border-0 text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted mb-0">Loading members...</p>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} style={{ verticalAlign: "middle" }}>
                                    <td className="px-4 py-4 border-0 border-bottom">
                                        <div className="d-flex align-items-center gap-3">
                                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: "#475569" }}>
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="fw-bold d-block">{user.username} {user.id === auth?.id && <Badge bg="secondary" className="ms-1" style={{ fontSize: "9px" }}>YOU</Badge>}</span>
                                                <small className="text-muted">UID: #{user.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom">
                                        <code className="bg-light px-2 py-1 rounded text-muted" style={{ letterSpacing: "1px" }}>••••••</code>
                                        <small className="ms-2 text-muted italic">({user.password})</small>
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom">
                                        <Badge 
                                            pill 
                                            bg={user.role === 'admin' ? 'dark' : user.role === 'staff' ? 'primary' : 'info'} 
                                            className="px-3 py-2 text-uppercase"
                                            style={{ fontSize: "10px", letterSpacing: "0.5px" }}
                                        >
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 border-0 border-bottom text-end">
                                        <div className="d-flex gap-2 justify-content-end">
                                            <Button 
                                                variant="outline-warning" 
                                                size="sm" 
                                                className="border-0 fw-600 px-3" 
                                                onClick={() => openEditUserModal(user)}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                className="border-0 fw-600 px-3" 
                                                onClick={() => handleDeleteUser(user)}
                                                disabled={user.role === 'admin'}
                                                title={user.role === 'admin' ? "Cannot delete Admin accounts" : ""}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!loading && users.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-5 text-muted">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold">{currentUser.id ? 'Edit User' : 'Create New User'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-600 text-muted">Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentUser.username}
                                onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                                className="bg-light border-0 py-2 px-3"
                                style={{ borderRadius: "8px" }}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-600 text-muted">Account Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={currentUser.password}
                                onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                                className="bg-light border-0 py-2 px-3"
                                style={{ borderRadius: "8px" }}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-600 text-muted">Permissions Role</Form.Label>
                            <Form.Select
                                value={currentUser.role}
                                onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                                className="bg-light border-0 py-2 px-3"
                                style={{ borderRadius: "8px" }}
                                required
                            >
                                <option value="">Assign Role</option>
                                <option value="admin">Administrator</option>
                                <option value="staff">Staff Member</option>
                                <option value="user">Standard User</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                    <Button variant="light" onClick={() => setShowModal(false)} className="px-4">Cancel</Button>
                    <Button variant="primary" onClick={handleSaveUser} className="px-4 btn-primary shadow-sm">
                        {currentUser.id ? 'Save Changes' : 'Create User'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default AdminUserList;
