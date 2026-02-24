import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Modal } from "react-bootstrap";

const API = "http://localhost:3001";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get(`${API}/categories`);
    setCategories(res.data);
  };

  const handleSave = async () => {
    if (editId) {
      await axios.put(`${API}/categories/${editId}`, {
        id: editId,
        name
      });
    } else {
      await axios.post(`${API}/categories`, { name });
    }

    setShow(false);
    setName("");
    setEditId(null);
    fetchCategories();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/categories/${id}`);
    fetchCategories();
  };

  return (
    <div>
      <h2>Manage Categories</h2>
      <Button onClick={() => setShow(true)}>Add Category</Button>

      <Table bordered className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditId(c.id);
                    setName(c.name);
                    setShow(true);
                  }}
                >
                  Edit
                </Button>{" "}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editId ? "Edit" : "Add"} Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminCategories;