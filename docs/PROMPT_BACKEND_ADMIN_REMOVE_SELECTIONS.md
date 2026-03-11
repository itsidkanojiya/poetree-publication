# Backend: Admin Remove User's Approved Selections

The frontend (Admin Subject Requests page) lets admins **revoke** a teacher's approved subject or subject-title selections. To support this, the backend must expose an **admin-only** endpoint.

---

## Required endpoint

**POST** `/api/admin/users/:userId/selections/remove`

**Auth:** Admin only (e.g. admin token or role check). Must not be callable by the target user or other non-admin users.

**URL:** `userId` = the **user id** of the teacher whose selections to change (e.g. from `user.id`).

**Body (JSON):**

| Field                   | Type      | Required | Description |
|-------------------------|-----------|----------|-------------|
| `user_subject_ids`      | number[]  | No*      | Row ids from `user_subjects` (the `id` of each approved subject row to remove). |
| `user_subject_title_ids`| number[]  | No*      | Row ids from `user_subject_titles` (the `id` of each approved subject-title row to remove). |

*At least one of the two arrays must be present and non-empty.

**Example:**

```json
{
  "user_subject_ids": [10, 11],
  "user_subject_title_ids": [22]
}
```

**Success (200):**

```json
{
  "message": "Approved selection(s) removed successfully.",
  "removed": {
    "user_subject_ids": [10, 11],
    "user_subject_title_ids": [22]
  }
}
```

**Errors:**

- **400** – Both arrays missing or empty.
- **401** – Not authenticated.
- **403** – Not admin.
- **500** – Server error.

**Behaviour:**

- Only rows that belong to the given `userId` and are in **approved** status should be removed (delete or set status so they are no longer “approved”).
- Invalid ids or ids for other users can be ignored (no error; just don’t delete them).
- After removal, the user’s profile / subject lists should reflect the change (e.g. no longer include those subjects/titles in approved selections).

---

## Where the ids come from

The admin UI gets data from **GET /api/admin/subject-requests**. Each item in:

- `requests[].requests.subjects.approved[]`
- `requests[].requests.subject_titles.approved[]`

**must include the row id** so the frontend can call the remove API. The frontend looks for (in order):

**For each approved subject** (row in `user_subjects`):

- `id` (preferred)
- `user_subject_id`
- `user_subjects_id`
- `user_subjects.id` (nested)
- `UserSubject.id` (nested)

**For each approved subject title** (row in `user_subject_titles`):

- `id` (preferred)
- `user_subject_title_id`
- `user_subject_titles_id`
- `user_subject_titles.id` (nested)
- `UserSubjectTitle.id` (nested)

If none of these are present, the X (Remove) button still appears but clicking it shows an error asking for the backend to return the row id. So **ensure your GET /api/admin/subject-requests response includes at least `id`** (or one of the above) on each approved subject and subject_title object.

---

## Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | **/api/admin/users/:userId/selections/remove** | **Remove approved selections** for user `userId`. Body: `user_subject_ids`, `user_subject_title_ids`. Admin only. |

Ensure **GET /api/admin/subject-requests** returns the row `id` (or equivalent) for each approved subject and subject_title so the admin UI can pass them to this endpoint.
