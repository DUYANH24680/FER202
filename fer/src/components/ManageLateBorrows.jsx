import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLateBorrows } from './UseLateBorrows';

const API = 'http://localhost:9999';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : '—';

const daysLate = (dueDate, returnDate) => {
  if (!dueDate || !returnDate) return 0;
  const diff = new Date(returnDate) - new Date(dueDate);
  return Math.max(0, Math.ceil(diff / 86400000));
};

const statusColor = {
  late:     { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  returned: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  approved: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  pending:  { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
  rejected: { bg: '#f5f5f4', color: '#78716c', border: '#e7e5e4' },
};

// ── StatusCell với dropdown cho approved ──────────────────────────────────────
function StatusCell({ row, onReturn }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const sc = statusColor[row.status] || statusColor.rejected;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleReturn = async () => {
    setLoading(true);
    setOpen(false);
    try {
      const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await axios.patch(`${API}/borrows/${row.id}`, {
        status: 'returned',
        returnDate: now,
      });
      onReturn(); // reload
    } catch (err) {
      console.error('[handleReturn] failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (row.status !== 'approved') {
    return (
      <span
        style={{
          ...s.badge,
          background: sc.bg,
          color: sc.color,
          border: `1px solid ${sc.border}`,
        }}
      >
        {row.status === 'late'     && '⚠ Trễ'}
        {row.status === 'returned' && '✓ Đã trả'}
        {row.status === 'pending'  && '⌛ Chờ duyệt'}
        {row.status === 'rejected' && '✕ Từ chối'}
        {!['late','returned','approved','pending','rejected'].includes(row.status) && row.status}
      </span>
    );
  }

  // approved → hiển thị badge có thể click + dropdown
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        style={{
          ...s.badge,
          ...s.badgeBtn,
          background: sc.bg,
          color: sc.color,
          border: `1px solid ${sc.border}`,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'wait' : 'pointer',
        }}
        onClick={() => !loading && setOpen((v) => !v)}
        title="Nhấn để cập nhật trạng thái"
      >
        {loading ? '⏳ Đang lưu...' : '● Đang mượn'}
        {!loading && <span style={s.chevron}>{open ? '▲' : '▼'}</span>}
      </button>

      {open && (
        <div style={s.dropdown}>
          <div style={s.dropdownTitle}>Cập nhật trạng thái</div>
          <button style={s.dropdownItem} onClick={handleReturn}>
            <span style={s.dropdownIcon}>✓</span>
            <span>
              <strong>Đã trả</strong>
              <div style={s.dropdownSub}>Ghi nhận ngày trả hôm nay</div>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ManageLateBorrows() {
  const [rows, setRows]         = useState([]);
  const [users, setUsers]       = useState({});
  const [books, setBooks]       = useState({});
  const [settings, setSettings] = useState({ finePerDay: 5000 });
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('late');
  const [search, setSearch]     = useState('');
  const [sortDir, setSortDir]   = useState('desc');

  const { syncAll } = useLateBorrows();

  const load = useCallback(async () => {
    setLoading(true);
    await syncAll();
    try {
      const [bRes, uRes, bkRes, sRes] = await Promise.all([
        axios.get(`${API}/borrows`),
        axios.get(`${API}/users`),
        axios.get(`${API}/books`),
        axios.get(`${API}/settings/1`),
      ]);
      setUsers(Object.fromEntries(uRes.data.map((u) => [u.id, u])));
      setBooks(Object.fromEntries(bkRes.data.map((b) => [b.id, b])));
      setSettings(sRes.data);
      setRows(bRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [syncAll]);

  useEffect(() => { load(); }, [load]);

  const visible = rows
    .filter((r) => {
      if (filter === 'late')     return r.status === 'late';
      if (filter === 'returned') return r.status === 'returned' || r.status === 'late';
      return true;
    })
    .filter((r) => {
      if (!search) return true;
      const u = users[r.userId];
      const b = books[r.bookId];
      const haystack = [u?.username, u?.email, b?.title, r.receiptCode, r.status]
        .join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const da = daysLate(a.dueDate, a.returnDate);
      const db = daysLate(b.dueDate, b.returnDate);
      return sortDir === 'desc' ? db - da : da - db;
    });

  const totalFine = visible
    .filter((r) => r.status === 'late')
    .reduce((s, r) => s + daysLate(r.dueDate, r.returnDate) * settings.finePerDay, 0);

  const lateCount = rows.filter((r) => r.status === 'late').length;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <div style={s.headerEye}>⚠ LATE RETURNS</div>
          <h1 style={s.headerTitle}>Quản lý Trả Sách Muộn</h1>
          <p style={s.headerSub}>
            Theo dõi và xử lý các lượt mượn trả quá hạn. Phạt:{' '}
            <strong>{settings.finePerDay.toLocaleString('vi-VN')}đ/ngày</strong>
          </p>
        </div>
        <div style={s.headerStats}>
          <div style={s.bigStat}>
            <span style={{ ...s.bigNum, color: '#be123c' }}>{lateCount}</span>
            <span style={s.bigLabel}>Đang trễ</span>
          </div>
          <div style={s.bigStat}>
            <span style={{ ...s.bigNum, color: '#b45309' }}>
              {totalFine.toLocaleString('vi-VN')}đ
            </span>
            <span style={s.bigLabel}>Tổng phạt hiển thị</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Tìm tên, email, sách, mã phiếu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={s.tabs}>
          {[
            { key: 'late',     label: '⚠ Đang trễ' },
            { key: 'returned', label: '✓ Đã trả' },
            { key: 'all',      label: '☰ Tất cả' },
          ].map(({ key, label }) => (
            <button
              key={key}
              style={{ ...s.tab, ...(filter === key ? s.tabActive : {}) }}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          style={s.sortBtn}
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
        >
          {sortDir === 'desc' ? '↓ Trễ nhất' : '↑ Ít trễ nhất'}
        </button>
        <button style={s.refreshBtn} onClick={load}>🔄</button>
      </div>

      {/* ── Table ── */}
      <div style={s.card}>
        {loading ? (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={{ color: '#78716c', marginTop: 12 }}>Đang đồng bộ dữ liệu...</p>
          </div>
        ) : visible.length === 0 ? (
          <div style={s.center}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <p style={{ color: '#78716c', fontWeight: 600 }}>Không có kết quả nào</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Người mượn','Sách','Ngày yêu cầu','Hạn trả','Ngày trả thực','Số ngày trễ','Tiền phạt','Trạng thái'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => {
                  const user = users[r.userId];
                  const book = books[r.bookId];
                  const days = daysLate(r.dueDate, r.returnDate);
                  const fine = days * settings.finePerDay;

                  return (
                    <tr key={r.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#fafaf9' }}>
                      <td style={s.td}>
                        <div style={s.userName}>{user?.username ?? '—'}</div>
                        <div style={s.userEmail}>{user?.email ?? ''}</div>
                      </td>
                      <td style={s.td}>
                        <div style={s.bookTitle}>{book?.title ?? '—'}</div>
                        {r.receiptCode && <div style={s.receipt}>{r.receiptCode}</div>}
                      </td>
                      <td style={{ ...s.td, ...s.dateCell }}>{fmt(r.requestDate)}</td>
                      <td style={{ ...s.td, ...s.dateCell, color: '#be123c', fontWeight: 700 }}>
                        {fmt(r.dueDate)}
                      </td>
                      <td style={{ ...s.td, ...s.dateCell }}>{fmt(r.returnDate)}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        {days > 0 ? (
                          <span style={s.daysChip}>+{days} ngày</span>
                        ) : (
                          <span style={{ color: '#a8a29e' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: fine > 0 ? '#be123c' : '#a8a29e' }}>
                        {fine > 0 ? `${fine.toLocaleString('vi-VN')}đ` : '—'}
                      </td>
                      <td style={s.td}>
                        <StatusCell row={r} onReturn={load} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && visible.length > 0 && (
          <div style={s.tableFooter}>
            Hiển thị <strong>{visible.length}</strong> / <strong>{rows.length}</strong> bản ghi
          </div>
        )}
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const s = {
  page:        { padding: '28px 0', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header:      { background: 'linear-gradient(135deg,#1c1917 0%,#3b1c0a 100%)', borderRadius: 14, padding: '28px 32px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  headerEye:   { fontSize: 11, fontWeight: 800, color: '#f97316', letterSpacing: '0.15em', marginBottom: 6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' },
  headerSub:   { color: '#a8a29e', fontSize: 14, marginTop: 6 },
  headerStats: { display: 'flex', gap: 32 },
  bigStat:     { textAlign: 'right' },
  bigNum:      { display: 'block', fontSize: 32, fontWeight: 900, lineHeight: 1 },
  bigLabel:    { fontSize: 11, color: '#a8a29e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },

  toolbar:     { background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  searchWrap:  { display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e7e5e4', borderRadius: 8, padding: '7px 12px', flex: 1, minWidth: 200, background: '#fafaf9' },
  searchIcon:  { fontSize: 14, flexShrink: 0 },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%', fontFamily: 'inherit', color: '#1c1917' },
  tabs:        { display: 'flex', gap: 6 },
  tab:         { padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e7e5e4', background: '#f5f5f4', color: '#78716c', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' },
  tabActive:   { background: '#1c1917', color: '#fff', borderColor: '#1c1917' },
  sortBtn:     { padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e7e5e4', background: '#fff', color: '#44403c', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  refreshBtn:  { padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e7e5e4', background: '#fff', fontSize: 16, cursor: 'pointer' },

  card:        { background: '#fff', borderRadius: 14, border: '1px solid #e7e5e4', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#fafaf9', borderBottom: '2px solid #e7e5e4' },
  tr:          { transition: 'background .1s' },
  td:          { padding: '13px 16px', borderBottom: '1px solid #f5f5f4', fontSize: 14, verticalAlign: 'middle' },
  userName:    { fontWeight: 700, color: '#1c1917' },
  userEmail:   { fontSize: 12, color: '#a8a29e' },
  bookTitle:   { fontWeight: 600, color: '#292524', maxWidth: 200 },
  receipt:     { fontSize: 11, color: '#a8a29e', fontFamily: 'monospace', marginTop: 2 },
  dateCell:    { fontSize: 13, color: '#57534e', whiteSpace: 'nowrap' },
  daysChip:    { display: 'inline-block', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800 },
  badge:       { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  badgeBtn:    { cursor: 'pointer', fontFamily: 'inherit', gap: 6, transition: 'opacity .15s, box-shadow .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  chevron:     { fontSize: 9, opacity: 0.7 },

  dropdown:      { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, background: '#fff', border: '1.5px solid #e7e5e4', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden' },
  dropdownTitle: { padding: '8px 14px', fontSize: 10, fontWeight: 800, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #f5f5f4', background: '#fafaf9' },
  dropdownItem:  { display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '11px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#1c1917', textAlign: 'left', transition: 'background .12s' },
  dropdownIcon:  { fontSize: 14, color: '#15803d', marginTop: 1, flexShrink: 0 },
  dropdownSub:   { fontSize: 11, color: '#a8a29e', marginTop: 2, fontWeight: 400 },

  center:      { padding: '60px 20px', textAlign: 'center' },
  spinner:     { width: 36, height: 36, border: '3px solid #e7e5e4', borderTopColor: '#be123c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  tableFooter: { padding: '12px 16px', borderTop: '1px solid #f5f5f4', background: '#fafaf9', fontSize: 13, color: '#78716c' },
};

if (typeof document !== 'undefined' && !document.getElementById('spin-kf')) {
  const style = document.createElement('style');
  style.id = 'spin-kf';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    button[style*="border-radius: 20px"]:hover { opacity: 0.85; }
  `;
  document.head.appendChild(style);
}
