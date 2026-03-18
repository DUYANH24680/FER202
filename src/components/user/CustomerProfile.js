import React, { useEffect, useState } from "react";
import "./UserProfile.css";

function UserProfile() {

  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch(`http://localhost:9999/users/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = () => {
    fetch(`http://localhost:9999/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditMode(false);
        alert("Profile updated successfully!");
      });
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">

      <div className="profile-card">

        <div className="profile-left">

          <img
            src={user.avatar}
            alt="avatar"
            className="profile-avatar"
          />

          <h3>{user.fullName}</h3>
          <p className="profile-role">Library Member</p>

        </div>

        <div className="profile-right">

          <h2 className="profile-title">User Profile</h2>

          <div className="profile-field">
            <label>Full Name</label>
            <input
              name="fullName"
              value={user.fullName || ""}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="profile-field">
            <label>Email</label>
            <input
              name="email"
              value={user.email || ""}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="profile-field">
            <label>Phone</label>
            <input
              name="phone"
              value={user.phone || ""}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="profile-field">
            <label>Address</label>
            <input
              name="address"
              value={user.address || ""}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          {!editMode ? (
            <button
              className="profile-btn edit-btn"
              onClick={() => setEditMode(true)}
            >
              ✏ Edit Profile
            </button>
          ) : (
            <button
              className="profile-btn save-btn"
              onClick={handleUpdate}
            >
              💾 Save Changes
            </button>
          )}

        </div>

      </div>

    </div>
  );
}

export default UserProfile;