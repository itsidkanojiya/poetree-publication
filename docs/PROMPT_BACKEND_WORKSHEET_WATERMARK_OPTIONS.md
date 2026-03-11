# Backend Prompt: Worksheet Watermark Options (Text / Image / None / Rotate / Bend)

Share this prompt with your backend developer to support configurable watermark content, **rotation**, and **bend** (skew) on personalized worksheet PDFs.

---

## Goal

Allow each **user** (or school) to choose what appears as the **watermark** on every page of their personalized worksheets, and how it is oriented:

| Option | Meaning |
|--------|--------|
| **none** | No watermark on any page. |
| **text** | Watermark = text only (e.g. school name or custom text), semi-transparent, diagonal. |
| **image** | Watermark = image only (e.g. school logo), semi-transparent, small size. |
| **text_and_image** | Watermark = both text and image (e.g. school name + logo), semi-transparent. |

The existing **watermark opacity** (`worksheet_watermark_opacity`, 0–1) continues to apply to whatever is shown (text and/or image). If the user selects **none**, opacity is ignored for the watermark (no watermark is drawn).

Additionally, the user can set:

- **Rotation**: Angle of the watermark in **degrees** (e.g. -45, -25, 0). Applied when drawing text and/or image (e.g. diagonal watermark = negative angle like -25°).
- **Bend (curved text)**: Optional **curved / arced** text effect. When enabled, the watermark text should follow a circular arc (curved baseline), not just a straight line skew. If the PDF library cannot do truly curved text, the backend may approximate with multiple rotated letters along an arc or fall back to straight text.

---

## 1. Data Model / Profile Fields

Add (or extend) the user profile (or school/tenant settings) with:

| Field | Type | Allowed values | Default |
|-------|------|----------------|---------|
| **worksheet_watermark_type** | string | `"none"` \| `"text"` \| `"image"` \| `"text_and_image"` | `"text"` |
| **worksheet_watermark_text** | string (optional) | Any sanitized string; max length e.g. 200 | If empty, use school name (or "Your School") when type is text or text_and_image |
| **worksheet_watermark_opacity** | float | 0–1 | 0.3 (already existing) |
| **worksheet_watermark_rotation** | number | Degrees, e.g. -180 to 180 (or -90 to 90) | -25 (typical diagonal) |
| **worksheet_watermark_bend** | number (optional) | Curve strength (e.g. 0–100) or arc radius parameter | 0 (no curve) |

- **worksheet_watermark_type** controls what is drawn on every page as the watermark.
- **worksheet_watermark_text** is optional: when the user wants custom watermark text, store it here; when empty, use school name (or a safe default).
- **worksheet_watermark_opacity** (existing) applies to both text and image when they are shown.
- **worksheet_watermark_rotation**: rotation angle in degrees. Apply when drawing the watermark (e.g. transform/rotate by this angle). Common: -25 or -45 for diagonal.
- **worksheet_watermark_bend**: curved-text strength (0–100) or similar scalar. Use this to control how strong the arc/curve of the text is (e.g. 0 = straight line, higher values = more curved). If your PDF library does not support curved text, either approximate by placing characters along an arc manually or treat this as 0 (no curve).

Store these in the same place you already store `worksheet_watermark_opacity` (e.g. `users` table or `schools` table).

---

## 2. Profile API (GET / PUT)

- **GET profile** (e.g. `GET /api/auth/profile`): Include in the response:
  - `worksheet_watermark_type`
  - `worksheet_watermark_text` (optional)
  - `worksheet_watermark_opacity`
  - `worksheet_watermark_rotation` (degrees)
  - `worksheet_watermark_bend` (degrees or 0–100)
  So the frontend can show a dropdown, optional text input, opacity slider, and rotation/bend controls.

- **PUT profile** (e.g. `PUT /api/auth/profile`): Accept in the request body:
  - `worksheet_watermark_type`: one of `"none"`, `"text"`, `"image"`, `"text_and_image"`. Reject invalid values (e.g. 400).
  - `worksheet_watermark_text`: optional string; sanitize and trim; store empty string if not provided or null.
  - `worksheet_watermark_opacity`: 0–1, as already implemented.
  - `worksheet_watermark_rotation`: optional number; clamp to e.g. -180..180 (or -90..90); store as degrees.
  - `worksheet_watermark_bend`: optional number; clamp to e.g. -20..20 (if degrees) or 0..100 (if bend strength); store.

Return the updated user/school object in the response so the frontend can refresh the form and the worksheet preview.

---

## 3. Branding / Payload to PDF Personalization Module

When building the payload for the **worksheet PDF personalization** module (the one that adds header + watermark), include watermark-related fields so the module can decide what to draw:

- **watermark_type**: `"none"` \| `"text"` \| `"image"` \| `"text_and_image"` (from user/school).
- **watermark_text**: string. If the user provided `worksheet_watermark_text`, use it (sanitized); else use school name; if still empty, use a safe default (e.g. "Your School") when type is `text` or `text_and_image`.
- **watermark_opacity**: float 0–1 (existing).
- **watermark_image_path_or_url**: same as the logo used in the header (trusted path/URL). Only used when **watermark_type** is `"image"` or `"text_and_image"`.
- **watermark_rotation**: number, degrees (e.g. -25). Apply when drawing the watermark (rotate text/image by this angle).
- **watermark_bend**: number, curve strength (0–100) or equivalent parameter. Use this to define how curved the watermark text should be; 0 means no curve (straight line).

So the branding object passed to the PDF module should look like:

```json
{
  "schoolName": "...",
  "logoPathOrUrl": "...",
  "address": "...",
  "watermark_type": "text_and_image",
  "watermark_text": "Knowledge High School",
  "watermark_opacity": 0.3,
  "watermark_image_path_or_url": "/path/to/logo.png",
  "watermark_rotation": -25,
  "watermark_bend": 0
}
```

---

## 4. PDF Personalization Module – Watermark Behavior

When drawing the **watermark on every page** (including page 1):

1. **If watermark_type is `"none"`**  
   Do not draw any watermark. Skip the watermark step for all pages.

2. **If watermark_type is `"text"`**  
   Draw only the watermark text (from `watermark_text`), with opacity `watermark_opacity`, e.g. diagonal and centered or in a corner. Do not draw the image.

3. **If watermark_type is `"image"`**  
   Draw only the watermark image (from `watermark_image_path_or_url`), with opacity `watermark_opacity`, resized to a small size (e.g. max height 40–60 pt) so it does not dominate the page. Do not draw the text.

4. **If watermark_type is `"text_and_image"`**  
   Draw both: the watermark text and the watermark image, both with the same `watermark_opacity`. Position them so they do not overlap (e.g. text above and image below, or side by side, in a corner or diagonal band).

**Rotation and bend (for all non-none watermarks):**

- **Rotation**: When drawing the watermark (text and/or image), apply a **rotation** transform of `watermark_rotation` degrees (e.g. -25 for a diagonal). Rotate around the center (or anchor point) of the watermark. If `watermark_rotation` is missing, use a default (e.g. -25).
- **Bend (curved text)**: When `watermark_bend` > 0 and the watermark includes **text**:
  - Render the text along a **circular arc** (curved baseline) instead of a straight line.
  - Use `watermark_bend` as a curve-strength value: map it to an arc radius or arc angle (implementation-specific).
  - A simple implementation is: choose a radius, compute positions along the arc for each glyph, and draw each character with its own rotation tangent to the circle.
  - If the PDF library cannot do true curved text, you may approximate as above or, as a fallback, draw straight text and ignore `watermark_bend`.
  - For image-only watermarks, `watermark_bend` can be ignored (image stays normal, only rotation applies).

Use the same placement rules you already have (e.g. diagonal, low opacity) so the watermark does not obscure the worksheet content. Sanitize `watermark_text` before drawing to avoid PDF injection or broken rendering.

---

## 5. Validation and Security

- **worksheet_watermark_type**: Accept only the four values above. Normalize to lowercase. Reject any other value with 400.
- **worksheet_watermark_text**: Trim and length-limit (e.g. 200 chars). Escape or restrict character set for PDF safety.
- **worksheet_watermark_rotation**: Clamp to -180..180 (or -90..90). Sanitize as number.
- **worksheet_watermark_bend**: Clamp to your chosen range (e.g. 0..100). Sanitize as number.
- **watermark_image_path_or_url**: Must be a path or URL that the server controls (e.g. from user/school profile). Never fetch or embed from an arbitrary user-supplied URL.

---

## 6. Summary Checklist for Backend

- [ ] Add **worksheet_watermark_type** (and optionally **worksheet_watermark_text**) to user/school profile storage.
- [ ] Add **worksheet_watermark_rotation** (degrees) and **worksheet_watermark_bend** (curve strength) to profile storage.
- [ ] **GET profile**: return `worksheet_watermark_type`, `worksheet_watermark_text`, `worksheet_watermark_opacity`, `worksheet_watermark_rotation`, `worksheet_watermark_bend`.
- [ ] **PUT profile**: accept and validate `worksheet_watermark_type`, `worksheet_watermark_text`, `worksheet_watermark_opacity`, `worksheet_watermark_rotation`, `worksheet_watermark_bend`; persist and return updated profile.
- [ ] When calling the PDF personalization module, pass **watermark_type**, **watermark_text**, **watermark_opacity**, **watermark_image_path_or_url** (when needed), **watermark_rotation**, and **watermark_bend**.
- [ ] In the PDF module, implement the four watermark behaviors: **none** (no watermark), **text** only, **image** only, **text_and_image** (both), using the same opacity for text and image, and apply **rotation** and **bend** as a **curved text effect** (arc-based) when drawing the watermark text.

---

## 7. Frontend (for reference)

The frontend will add:

- A **dropdown** or radio group for “Watermark” with options: **None**, **Text only**, **Image only**, **Text and image**.
- An **optional text input** for custom watermark text (when “Text only” or “Text and image” is selected); if left empty, the backend uses school name.
- The existing **opacity slider** (0–100% → 0–1) for watermark opacity.
- **Rotation** control: number input or slider for angle in degrees (e.g. -90 to 90, default -25).
- **Bend** control: number input or slider for **curve strength** (e.g. 0–100) that the backend maps to how curved the text is.

All of these will be sent via **PUT /api/auth/profile** and reflected in **GET /api/auth/profile** and in the worksheet preview and personalized PDF response.

---

*End of prompt.*
