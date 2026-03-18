# Backend: Admin Approve Selections – Update Pending Rows by Master IDs

The frontend calls **POST** `/api/admin/approve-selections/:userId` with **master IDs** (`approve_by_subject_ids`, `approve_by_subject_title_ids`). The backend currently returns success and sets `is_verified = 1`, but **does not update** the pending rows in `user_subjects` and `user_subject_titles`. As a result, GET subject-requests still shows those items as pending and the user’s `subject` / `subject_title` stay empty.

**Example:** For user 79, approve with `approve_by_subject_ids: [1]` and `approve_by_subject_title_ids: []` returns 200 and `is_verified: 1`, but user 79’s Mathematics (user_subjects id 83) and its title (user_subject_titles id 110) remain **pending**. This doc describes the required backend behaviour.

---

## Current request (from frontend)

**POST** `/api/admin/approve-selections/:userId`

**Body (JSON) – master IDs:**

| Field                        | Type     | Description |
|-----------------------------|----------|-------------|
| `approve_by_subject_ids`    | number[] | Master `subject_id` values (e.g. 1 = Mathematics). |
| `approve_by_subject_title_ids` | number[] | Master `subject_title_id` values (e.g. 32 = a workbook). |
| `reject_others`             | boolean  | Optional; if true, reject pending items not in the above lists. |

Example:

```json
{
  "approve_by_subject_ids": [1],
  "approve_by_subject_title_ids": [],
  "reject_others": false
}
```

---

## Required behaviour (fix)

After validating the user and performing any existing logic (e.g. set `is_verified = 1`), the backend **must** do the following when `approve_by_subject_ids` and/or `approve_by_subject_title_ids` are present.

### 1. Approve pending `user_subjects` rows

- **Table:** `user_subjects`
- **Filter:** `user_id = :userId` (from URL), `subject_id IN (:approve_by_subject_ids)`, and status is pending (e.g. `status = 'pending'` or `status IS NULL` or whatever your schema uses).
- **Update:** Set those rows to approved, e.g. `status = 'approved'`, `approved_by = <admin_user_id>`, `approved_at = NOW()`.

Example (pseudo-SQL, adapt to your ORM/DB):

```sql
UPDATE user_subjects
SET status = 'approved', approved_by = :adminId, approved_at = NOW()
WHERE user_id = :userId
  AND subject_id IN (:approve_by_subject_ids)
  AND (status IS NULL OR status = 'pending');
```

- If `approve_by_subject_ids` is empty, skip this step (no subject rows updated by this path).

### 2. Approve pending `user_subject_titles` rows

- **Table:** `user_subject_titles`
- **Filter:** `user_id = :userId`, and either:
  - `subject_title_id IN (:approve_by_subject_title_ids)` when `approve_by_subject_title_ids` is non-empty, or
  - If **only** `approve_by_subject_ids` is sent (and `approve_by_subject_title_ids` is empty), approve all pending title rows whose **subject** is in the approved set (e.g. join to `subject_titles` to get `subject_id` and require `subject_id IN (approve_by_subject_ids)`).
- **Update:** Set those rows to approved: `status = 'approved'`, `approved_by`, `approved_at`.

Example when both arrays are used:

```sql
UPDATE user_subject_titles
SET status = 'approved', approved_by = :adminId, approved_at = NOW()
WHERE user_id = :userId
  AND subject_title_id IN (:approve_by_subject_title_ids)
  AND (status IS NULL OR status = 'pending');
```

Example when only `approve_by_subject_ids` is provided (approve all pending titles under those subjects):

```sql
UPDATE user_subject_titles ust
JOIN subject_titles st ON st.id = ust.subject_title_id
SET ust.status = 'approved', ust.approved_by = :adminId, ust.approved_at = NOW()
WHERE ust.user_id = :userId
  AND st.subject_id IN (:approve_by_subject_ids)
  AND (ust.status IS NULL OR ust.status = 'pending');
```

(Use your actual column names; e.g. some schemas use `subject_titles.subject_id`.)

### 3. Sync user’s `subject` / `subject_title` (if stored on user)

- If the API or app stores aggregated `subject` / `subject_title` on the `users` table (or equivalent), recompute them from **approved** rows in `user_subjects` and `user_subject_titles` after the updates above, so that:
  - The approve response, and
  - **GET** `/api/admin/subject-requests` (and any GET my-selections)
  - show the same state (e.g. user 79 has Mathematics and the approved title in approved lists, not in pending).

### 4. Optional: `reject_others`

- If `reject_others === true`, mark all other **pending** `user_subjects` and `user_subject_titles` for this user as rejected (e.g. `status = 'rejected'`), excluding the ones just approved above.

---

## Result to verify

- **POST** `approve-selections/79` with `approve_by_subject_ids: [1]`, `approve_by_subject_title_ids: []`:
  - user_subjects row for user 79 with `subject_id = 1` (e.g. id 83) → `status = 'approved'`, `approved_by`, `approved_at` set.
  - user_subject_titles row(s) for user 79 under subject_id 1 (e.g. id 110, subject_title_id 32) → `status = 'approved'`, etc.
- **GET** subject-requests: user 79’s Mathematics and its title appear under **approved**, not **pending**.
- Response `user.subject` / `user.subject_title` (if returned) are populated from approved rows so they are no longer empty.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Update **user_subjects**: set pending rows with `user_id = :userId` and `subject_id IN (approve_by_subject_ids)` to approved. |
| 2 | Update **user_subject_titles**: set pending rows with `user_id = :userId` and either `subject_title_id IN (approve_by_subject_title_ids)` or (when only subject IDs sent) subject in `approve_by_subject_ids` to approved. |
| 3 | Recompute/sync user’s `subject` / `subject_title` from approved rows so GET responses match. |
| 4 | If `reject_others`, reject remaining pending rows for that user. |

The bug is that steps 1–3 are missing or incomplete; implementing them in the handler for **POST /api/admin/approve-selections/:userId** will fix the issue.
