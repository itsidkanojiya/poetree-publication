# Backend: Delete Chapter API

The frontend **Manage Chapters** modal (Admin → Subject Titles → Chapters) allows admins to **delete** a chapter. The following API is required.

---

## Endpoint

**DELETE** `/api/chapters/:chapterId`

**Auth:** Required (admin or authenticated user, depending on your rules).

**URL:** `chapterId` = primary key of the chapter to delete (e.g. `chapters.chapter_id`).

**Example:** `DELETE /api/chapters/5`

---

## Success

**204 No Content**  
Or **200 OK** with body, e.g.:

```json
{
  "success": true,
  "message": "Chapter deleted successfully"
}
```

---

## Errors

- **400** – Invalid `chapterId` (e.g. not a number).
- **401** – Not authenticated.
- **403** – Not allowed to delete (e.g. not admin).
- **404** – Chapter not found.
- **409** – Conflict (e.g. chapter is in use and you don’t allow delete).
- **500** – Server error.

---

## Behaviour

1. Resolve the chapter by `chapterId` (e.g. `chapters.chapter_id`).
2. If not found, return 404.
3. Optionally check that the chapter belongs to the expected subject title or that the caller is admin.
4. Decide how to handle existing references:
   - **Option A (recommended):** Set `chapter_id` to `NULL` on `questions`, `worksheets`, `answersheets`, `papers` (or equivalent) for this chapter, then delete the chapter row.
   - **Option B:** Block delete with 409 if any of those reference the chapter; frontend can show a message.
5. Delete the row from `chapters` (or mark as deleted if you use soft delete).

---

## Summary

| Method   | Endpoint              | Description                |
|----------|------------------------|----------------------------|
| **DELETE** | **/api/chapters/:chapterId** | Delete (or soft-delete) a chapter. |

Frontend calls this when the user clicks the delete (trash) button next to a chapter in the Manage Chapters modal.
