# Backend Implementation Prompt: Personalized Worksheet PDFs

Use this prompt when implementing the backend changes for the personalized worksheet PDF feature. Copy the entire section below (from "---" to the end) and provide it to your developer or AI assistant along with your codebase context.

---

## Context

We have an existing Node.js backend with:
- Worksheet upload and storage (admin uploads PDFs; they are stored on the server).
- API: `GET /worksheets`, `POST /worksheets/add`, `DELETE /worksheets/:id`.
- Users have profile data including `school_name` and optionally a school logo (image).
- Role-based access: Admin and User. Users can view/download worksheets they are allowed to access.

## Goal

Implement backend support so that when a **user** (not admin) requests to **view** or **download** a worksheet, they receive a **personalized PDF** that includes:
- **Header** (first page only): **pure white background**, black border, school logo + school name + **address** (when user has address in profile).
- **Watermark** (e.g. faint school name or logo): on **every page** of the PDF.

Requirements:
- The **original worksheet PDF** uploaded by admin must **never be modified**; it remains the single source of truth.
- Personalization must be **dynamic per user** (or per school).
- Each user sees their own school’s branding on the same worksheet.
- Design for **multi-tenant** usage (many schools, many users).

## Tasks to Implement

### 1. New API Endpoint(s)

- Add **one** endpoint (or two if you prefer separate behavior for view vs download):
  - **Option A (recommended):** `GET /api/worksheets/:id/personalized-pdf`
    - Query params (optional): `?action=view` or `?action=download` to set `Content-Disposition` (inline vs attachment).
  - **Option B:** Separate routes: `GET /api/worksheets/:id/view` and `GET /api/worksheets/:id/download`.
- Behavior:
  - Require **authentication** (existing JWT/session). Return 401 if not authenticated.
  - Resolve the current **user** from the auth token/session.
  - **Authorize:** Ensure this user is allowed to access this worksheet (reuse existing authorization logic used for worksheet access, e.g. by board/standard/subject if applicable). Return 403 if not allowed.
  - Load the **canonical worksheet PDF** from storage (using the existing `worksheet_url` or file path from the worksheets table for the given `:id`).
  - Load **branding** for this user: school name, school logo URL or file path, and **address**. If the app has a `schools` table and `user.school_id`, use school-level branding; otherwise use user profile fields (e.g. `school_name`, logo, and **address** from `user.address` or `user.school_address_city` + `user.school_address_state` + `user.school_address_pincode`). The branding payload passed to the PDF module **must include address** when the user has it stored.
  - Call the **PDF personalization module** (see below) with: canonical PDF stream/path, branding payload (school name, logo path/URL, **address**).
  - Return the **personalized PDF** as the response body (stream preferred). Set headers:
    - `Content-Type: application/pdf`
    - `Content-Disposition: inline` for view or `attachment; filename="worksheet-{id}.pdf"` for download (based on query param or route).
  - If personalization fails (e.g. PDF too large, timeout), either return 503 with a clear message or fall back to serving the **original** PDF with a response header e.g. `X-Personalized: false` so the client knows.

### 2. PDF Personalization Module

- Create a **new module/service** (e.g. `services/worksheetPersonalization.js` or `lib/pdfPersonalization.js`) that:
  - **Input:** (1) Canonical PDF (stream or file path), (2) Branding object: `{ schoolName: string, logoPathOrUrl?: string, address?: string }` (and optionally tagline, primary color later).
  - **Behavior — two distinct overlays:**
    1. **Header (first page only) — same style as paper header:** Open the canonical PDF (do not modify the original file). On **page 1 only**, add a **header band** that matches the **paper header** look:
      - **Background:** Use **pure white only** (e.g. RGB 255, 255, 255 or equivalent in your PDF library). Do **not** use cream, beige, or any off-white color for the header.
      - **Border:** Black border (e.g. 2pt solid black) around the header band.
      - **Content:** School **logo** on the left (if provided), resized to max height (e.g. 15–20 mm); **school name** (bold/uppercase); **address** (smaller text, e.g. below the school name) — **always render address when it is provided** in the branding object (from user profile). Sanitize school name and address. If no logo, show school name and address (when present) only.
      - **Do not add this header on page 2, 3, 4, etc.**
    2. **Watermark (every page):** On **every page** (including page 1), add a **watermark**: faint/semi-transparent school name (and optionally small logo), e.g. diagonal or bottom corner, low opacity (e.g. 0.1–0.2) so content remains readable.
  - **Output:** Return a **stream** or **buffer** of the personalized PDF (or a path to a temp file that the route will stream and then delete).
- **Libraries:** Use a Node.js PDF library that supports reading an existing PDF and overlaying content (e.g. `pdf-lib`, or `pdf-lib` with a canvas for image/text layout, or Puppeteer/Playwright for HTML-rendered header then merge). Do not use user-supplied URLs for the logo: resolve logo to a **trusted path** (your server’s storage) from the database/config.
- **Edge cases:**
  - **Logo too large:** Resize/thumbnail so the header height is fixed (e.g. max logo height 18 mm).
  - **Missing branding:** If no school name, use a safe default (e.g. "Your School") or omit the text line.
  - **PDF with many pages:** Consider a **page limit** (e.g. 50) for overlay; beyond that, apply header (page 1) + watermark (all pages) to first N pages only, or return original with `X-Personalized: false` and a timeout (e.g. 15 s) to avoid long-running requests.

### 3. Caching (Optional but Recommended)

- **Cache key:** `worksheet_personalized:{worksheetId}:{schoolId}` (or `userId` if no school entity). Use **school_id** if available so all users of the same school share one cached file.
- **Storage:** Use existing object storage (S3/GCS) or a local temp directory with a TTL. Store the generated PDF binary; set **TTL** (e.g. 10–30 minutes).
- **Flow:** Before calling the personalization module, check cache. If hit, stream from cache. If miss, generate, write to cache, then stream. Optionally **single-flight** per key (e.g. in-memory lock or Redis) so concurrent requests for the same key do not trigger multiple generations.
- **Invalidation:** When the canonical worksheet is updated or deleted, invalidate cache entries for that `worksheetId`. When school logo/name is updated, invalidate by `schoolId` (optional; or rely on TTL).

### 4. Database Changes (Only If Not Already Present)

- If there is **no** `schools` (or `organizations`) table:
  - Create table **schools** with at least: `id` (PK), `name`, `logo_url` or `logo_path` (nullable), `created_at`, `updated_at`. Optionally add `primary_color`, `tagline` for future branding.
  - Add to **users** table: `school_id` (FK to `schools`, nullable). Migrate or backfill if needed.
- If **schools** and **user.school_id** already exist: no schema change; ensure the personalization module receives branding from the school record (and fallback to user profile if needed).

### 5. Branding Data Access

- Create or reuse a **helper** that, given `userId` (and optionally `schoolId`), returns:
  - `{ schoolName: string, logoPathOrUrl: string | null, address: string | null }`
- **Address:** The helper **must** populate `address` when the user has it: use `user.address`, or build from `user.school_address_city`, `user.school_address_state`, `user.school_address_pincode` (e.g. "City, State Pin"). If the user has no address fields, pass `null` or empty string. The PDF module must then **display** this address in the header when it is non-empty.
- If using `schools` table: load school by `user.school_id` and use `school.name`, `school.logo_url` (or resolved path), and school address if stored. If `school_id` is null, fallback to `user.school_name`, user-level logo, and user address fields.
- **Security:** Logo must be a path or URL that your server controls (e.g. your storage bucket or local path). Never fetch logo from an arbitrary user-supplied URL.

### 6. Security and Validation

- **Authorization:** The new endpoint must enforce the **same** worksheet access rules as the rest of the app (e.g. user can only access worksheets for their board/standard/subject). Reuse existing middleware or service logic.
- **Input validation:** Validate `worksheetId` (e.g. integer, exists in DB). Reject invalid IDs with 400.
- **Rate limiting:** Apply rate limiting to the personalized PDF endpoint (e.g. per user or per IP) to prevent abuse (bulk download, DoS).
- **Audit:** Log access: worksheet id, user id, school id (if any), action (view/download), timestamp. Do not log full PDF content.

### 7. Error Handling and Responses

- **401** – Not authenticated.
- **403** – Not allowed to access this worksheet.
- **404** – Worksheet not found or file missing from storage.
- **503** – Personalization failed (e.g. timeout, PDF too large); optionally include `X-Personalized: false` and still return the original PDF if you implement fallback.
- **500** – Unexpected server error; do not expose internal details to the client.

### 8. Configuration

- Make the following **configurable** (env or config file): header height (mm), logo max height (mm), watermark opacity (e.g. 0.1–0.2), cache TTL (seconds), personalization timeout (seconds), max pages to personalize (optional). Do not hardcode these in the PDF module.

### 9. Testing Considerations (Do Not Implement Tests in This Prompt Unless Asked)

- Unit test: personalization module with a sample PDF and mock branding (with and without logo).
- Integration test: authenticated request to `GET /worksheets/:id/personalized-pdf` returns 200 and PDF content-type; unauthenticated returns 401; user without access returns 403.
- Optional: test cache hit/miss and invalidation.

### 10. Summary Checklist

- [ ] New route: `GET /api/worksheets/:id/personalized-pdf` (or view + download).
- [ ] Auth and authz applied; 401/403/404/503/500 handled.
- [ ] PDF personalization module: **header** on **first page only** with **pure white background** (no cream/beige), black border, logo + school name + **address** (when provided); **watermark** on **every page**; no modification of original file.
- [ ] Branding helper: resolve school name and logo from user/school.
- [ ] Optional: cache by (worksheetId, schoolId) with TTL; optional single-flight.
- [ ] Optional: DB migration for `schools` and `user.school_id` if missing.
- [ ] Logo from trusted path only; school name sanitized; rate limiting and audit log.
- [ ] Config for header size, logo size, cache TTL, timeout.

Implement the above in the existing Node.js backend. Preserve existing behavior for admin and for listing/uploading/deleting worksheets; only the **user-facing view/download** of a worksheet should go through the new personalized endpoint once the frontend is updated to call it.
