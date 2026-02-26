import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Container } from 'react-bootstrap';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Check if username already exists
      const existingUser = await axios.get(`http://localhost:9999/users?username=${username}`);
      if (existingUser.data.length > 0) {
        setError('Username already exists. Please choose a different username.');
        return;
      }

      // Get all users to determine the next ID
      const allUsers = await axios.get('http://localhost:5000/users');
      const nextId = allUsers.data.length > 0 
        ? Math.max(...allUsers.data.map(user => Number(user.id))) + 1 
        : 1;

      // Create new user with auto-incremented ID
      const newUser = {
        id: nextId,
        username,
        password,
        role: 'user'
      };

      await axios.post('http://localhost:5000/users', newUser);
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error("Registration failed:", error);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Container className="mt-5">
      <div className="w-100" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 className="text-center mb-4">Register</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100"
          >
            Register
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export default Register;