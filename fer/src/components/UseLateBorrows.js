import { useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:9999';

/**
 * Mỗi khi hook này được gọi, nó sẽ:
 * 1. Lấy settings (maxBorrowDays) + tất cả borrows
 * 2. Với mỗi borrow: tính lại dueDate = requestDate + maxBorrowDays
 * 3. Nếu returnDate > dueDate → status = "late"
 * 4. Ghi đè bất kỳ thay đổi nào lên db
 *
 * Gọi syncAll() sau khi thêm/sửa borrow hoặc đổi settings.
 */
export function useLateBorrows() {
  const syncAll = useCallback(async () => {
    try {
      const [settingsRes, borrowsRes] = await Promise.all([
        axios.get(`${API}/settings/1`),
        axios.get(`${API}/borrows`),
      ]);

      const { maxBorrowDays } = settingsRes.data;
      const borrows = borrowsRes.data;

      const updates = borrows.map(async (borrow) => {
        if (!borrow.requestDate) return;

        // Tính dueDate mới
        const borrowms = new Date(borrow.borrowDate).getTime();
        const newDueDate = new Date(borrowms + maxBorrowDays * 86400000)
          .toISOString()
          .split('T')[0]; // YYYY-MM-DD

        // Xác định status mới
        let newStatus = borrow.status;
        if (
          borrow.returnDate &&
          borrow.returnDate > newDueDate &&
          borrow.status !== 'late'
        ) {
          newStatus = 'late';
        }

        // Chỉ PATCH nếu có thay đổi thực sự
        const dueDateChanged = borrow.dueDate !== newDueDate;
        const statusChanged = borrow.status !== newStatus;

        if (dueDateChanged || statusChanged) {
          await axios.patch(`${API}/borrows/${borrow.id}`, {
            dueDate: newDueDate,
            status: newStatus,
          });
        }
      });

      await Promise.all(updates);
    } catch (err) {
      console.error('[useLateBorrows] sync failed:', err);
    }
  }, []);

  // Tự chạy 1 lần khi mount
  useEffect(() => {
    syncAll();
  }, [syncAll]);

  return { syncAll };
}