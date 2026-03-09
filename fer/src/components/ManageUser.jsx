import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:9999";

const C = {
  bg: "#f5f6fa",
  surface: "#ffffff",
  surfaceHover: "#f8f9ff",
  border: "#e8eaf0",
  accent: "#6c63ff",
  accentSoft: "rgba(108,99,255,0.08)",
  accentText: "#5046e5",
  success: "#16a34a",
  successSoft: "rgba(22,163,74,0.09)",
  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,0.08)",
  warning: "#d97706",
  warningSoft: "rgba(217,119,6,0.09)",
  text: "#1e1f2e",
  textMuted: "#9399b2",
  textDim: "#6b7280",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  shadowSm: "0 1px 2px rgba(0,0,0,0.06)",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: C.text,
    padding: "32px 28px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.4px",
    margin: 0,
    color: C.text,
  },
  titleAccent: { color: C.accent },
  btnPrimary: {
    background: C.accent,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(108,99,255,0.3)",
  },
  statsRow: {
    display: "flex",
    gap: "14px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  statCard: (accent) => ({
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderTop: `3px solid ${accent}`,
    borderRadius: "12px",
    padding: "16px 20px",
    flex: "1",
    minWidth: "130px",
    boxShadow: C.shadowSm,
  }),
  statNum: { fontSize: "26px", fontWeight: "700", margin: "0 0 2px" },
  statLabel: { fontSize: "12px", color: C.textMuted, margin: 0, fontWeight: "500" },
  filterBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
    alignItems: "center",
    background: C.surface,
    padding: "14px 16px",
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    boxShadow: C.shadowSm,
  },
  input: {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "9px 14px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    minWidth: "210px",
    flex: 1,
  },
  select: {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "9px 14px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    minWidth: "145px",
  },
  tableWrap: {
    background: C.surface,
    borderRadius: "14px",
    border: `1px solid ${C.border}`,
    boxShadow: C.shadow,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    color: C.textMuted,
    borderBottom: `1px solid ${C.border}`,
    background: "#fafbff",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "middle",
    color: C.text,
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
  },
  badge: (color, bg) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color,
    background: bg,
  }),
  actionBtn: (color, bg) => ({
    background: bg,
    color,
    border: "none",
    borderRadius: "7px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  }),
  emptyRow: {
    textAlign: "center",
    padding: "56px",
    color: C.textMuted,
    fontSize: "14px",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,17,35,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(3px)",
  },
  modalBox: {
    background: C.surface,
    borderRadius: "16px",
    padding: "32px",
    width: "100%",
    maxWidth: "440px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  modalTitle: {
    fontSize: "19px",
    fontWeight: "700",
    margin: "0 0 24px",
    color: C.text,
  },
  formGroup: { marginBottom: "18px" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: C.textDim,
    marginBottom: "6px",
  },
  formInput: {
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "9px",
    padding: "10px 14px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  formSelect: {
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: "9px",
    padding: "10px 14px",
    color: C.text,
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  btnCancel: {
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: "9px",
    padding: "10px 20px",
    color: C.textDim,
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  btnSave: {
    background: C.accent,
    border: "none",
    borderRadius: "9px",
    padding: "10px 22px",
    color: "#fff",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(108,99,255,0.3)",
  },
  btnDanger: {
    background: C.danger,
    border: "none",
    borderRadius: "9px",
    padding: "10px 22px",
    color: "#fff",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: "#16a34a",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 20px",
    fontWeight: "600",
    fontSize: "14px",
    zIndex: 2000,
    boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
  },
};

const avatarColor = (name) => {
  const colors = [
    ["#5046e5", "#ede9ff"],
    ["#16a34a", "#dcfce7"],
    ["#d97706", "#fef3c7"],
    ["#dc2626", "#fee2e2"],
    ["#0284c7", "#e0f2fe"],
  ];
  return colors[name?.charCodeAt(0) % colors.length] || colors[0];
};

export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "user", locked: false });
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`);
    setUsers(res.data);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "locked" ? u.locked : !u.locked);
    return matchSearch && matchRole && matchStatus;
  });

  const openAdd = () => {
    setForm({ username: "", password: "", role: "user", locked: false });
    setModal({ type: "add" });
  };
  const openEdit = (user) => {
    setForm({ username: user.username, password: user.password, role: user.role, locked: !!user.locked });
    setModal({ type: "edit", user });
  };
  const openDelete = (user) => setModal({ type: "delete", user });

  const handleSave = async () => {
    if (!form.username.trim() || !form.password.trim()) return;
    setLoading(true);
    try {
      if (modal.type === "add") {
        const all = await axios.get(`${API}/users`);
        const nextId = String(Math.max(...all.data.map((u) => Number(u.id)), 0) + 1);
        await axios.post(`${API}/users`, { id: nextId, ...form });
        showToast("✓ Đã thêm người dùng");
      } else {
        await axios.put(`${API}/users/${modal.user.id}`, { ...modal.user, ...form });
        showToast("✓ Đã cập nhật");
      }
      await fetchUsers();
      setModal(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API}/users/${modal.user.id}`);
      showToast("✓ Đã xóa người dùng");
      await fetchUsers();
      setModal(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (user) => {
    await axios.patch(`${API}/users/${user.id}`, { locked: !user.locked });
    showToast(user.locked ? "✓ Đã mở khóa tài khoản" : "✓ Đã khóa tài khoản");
    fetchUsers();
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    locked: users.filter((u) => u.locked).length,
    active: users.filter((u) => !u.locked).length,
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Quản lý <span style={styles.titleAccent}>Người dùng</span>
        </h1>
        <button style={styles.btnPrimary} onClick={openAdd}>
          <span style={{ fontSize: "17px" }}>+</span> Thêm người dùng
        </button>
      </div>

      <div style={styles.statsRow}>
        {[
          { label: "Tổng users", num: stats.total, accent: C.accent },
          { label: "Admin", num: stats.admins, accent: C.warning },
          { label: "Đang hoạt động", num: stats.active, accent: C.success },
          { label: "Đã khóa", num: stats.locked, accent: C.danger },
        ].map((s) => (
          <div key={s.label} style={styles.statCard(s.accent)}>
            <p style={{ ...styles.statNum, color: s.accent }}>{s.num}</p>
            <p style={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={styles.filterBar}>
        <input
          style={styles.input}
          placeholder="🔍  Tìm theo username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="user">User</option>
        </select>
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
        <span style={{ color: C.textMuted, fontSize: "13px", marginLeft: "auto", fontWeight: "500" }}>
          {filtered.length} kết quả
        </span>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["#", "Người dùng", "Vai trò", "Trạng thái", "Thao tác"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={styles.emptyRow}>Không tìm thấy người dùng nào</td></tr>
            ) : (
              filtered.map((user, idx) => {
                const [ac, bg] = avatarColor(user.username);
                const isLocked = !!user.locked;
                const isLast = idx === filtered.length - 1;
                const tdStyle = { ...styles.td, ...(isLast ? { borderBottom: "none" } : {}) };
                return (
                  <tr
                    key={user.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ ...tdStyle, color: C.textMuted, width: "48px" }}>{idx + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ ...styles.avatar, color: ac, background: bg }}>
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600" }}>{user.username}</div>
                          <div style={{ fontSize: "12px", color: C.textMuted }}>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {user.role === "admin" ? (
                        <span style={styles.badge(C.warning, C.warningSoft)}>⭐ Admin</span>
                      ) : user.role === "staff" ? (
                        <span style={styles.badge(C.accentText, C.accentSoft)}>🛠 Staff</span>
                      ) : (
                        <span style={styles.badge(C.textDim, "#f1f2f6")}>👤 User</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isLocked ? (
                        <span style={styles.badge(C.danger, C.dangerSoft)}>🔒 Đã khóa</span>
                      ) : (
                        <span style={styles.badge(C.success, C.successSoft)}>✓ Hoạt động</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button style={styles.actionBtn(C.accentText, C.accentSoft)} onClick={() => openEdit(user)}>✏ Sửa</button>
                        <button
                          style={styles.actionBtn(isLocked ? C.success : C.warning, isLocked ? C.successSoft : C.warningSoft)}
                          onClick={() => toggleLock(user)}
                        >
                          {isLocked ? "🔓 Mở" : "🔒 Khóa"}
                        </button>
                        <button style={styles.actionBtn(C.danger, C.dangerSoft)} onClick={() => openDelete(user)}>🗑 Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modal && (modal.type === "add" || modal.type === "edit") && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={styles.modalTitle}>
              {modal.type === "add" ? "➕ Thêm người dùng" : "✏️ Sửa người dùng"}
            </h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input style={styles.formInput} value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Nhập username" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Mật khẩu</label>
              <input style={styles.formInput} type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Nhập mật khẩu" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vai trò</label>
              <select style={styles.formSelect} value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.locked}
                  onChange={(e) => setForm({ ...form, locked: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: C.accent }} />
                Khóa tài khoản
              </label>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnCancel} onClick={() => setModal(null)}>Hủy</button>
              <button style={styles.btnSave} onClick={handleSave} disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.type === "delete" && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div style={styles.modalBox}>
            <h2 style={{ ...styles.modalTitle, color: C.danger }}>🗑 Xác nhận xóa</h2>
            <p style={{ color: C.textDim, marginBottom: "8px", fontSize: "14px" }}>
              Bạn có chắc muốn xóa người dùng <strong style={{ color: C.text }}>{modal.user.username}</strong>?
            </p>
            <p style={{ color: C.textMuted, fontSize: "13px" }}>Hành động này không thể hoàn tác.</p>
            <div style={styles.modalActions}>
              <button style={styles.btnCancel} onClick={() => setModal(null)}>Hủy</button>
              <button style={styles.btnDanger} onClick={handleDelete} disabled={loading}>
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
