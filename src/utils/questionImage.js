/**
 * Shared helpers for question images (fabric.js composite model).
 *
 * A question may carry a "composite" image block: a single flattened PNG produced
 * by the fabric editor, with a known width/height and a placement relative to the
 * question text. Because the composite has an EXACT, page-capped height, the paper
 * paginator can reserve its height precisely — so image questions are never
 * clipped or dropped by the screenshot-based (html2canvas) PDF export.
 *
 * Fields expected on a question (all optional; legacy `image_url` still works):
 *   composite_image_url : string  — URL of the flattened PNG
 *   composite_width     : number  — CSS px (1x) of the block
 *   composite_height    : number  — CSS px (1x) of the block
 *   image_placement     : 'inline' | 'above' | 'below' | 'left' | 'right'
 *   image_align         : 'left' | 'center' | 'right'  (used for above/below)
 *   question            : string  — may contain the {{img}} caret token (inline)
 */

// Canvas geometry — kept below the paper's usable content area so a single
// question + its image can never exceed one page (avoids clipping).
export const IMAGE_CANVAS_WIDTH = 660; // paper content width (~748 - padding) minus indent
export const MAX_IMAGE_CANVAS_HEIGHT = 900; // hard cap; leaves room for the question text
export const MIN_IMAGE_CANVAS_HEIGHT = 120;

// Inline caret token — mirrors the $...$ convention already used for LaTeX.
export const IMG_TOKEN = "{{img}}";

export const hasImgToken = (text) =>
  typeof text === "string" && text.includes(IMG_TOKEN);

/** Remove the inline image token (e.g. for plain-text contexts / Excel export). */
export const stripImgToken = (text) =>
  typeof text === "string" ? text.split(IMG_TOKEN).join("").replace(/\s{2,}/g, " ").trim() : text;

/** Split a question string around the first {{img}} token. */
export const splitOnImgToken = (text) => {
  const str = typeof text === "string" ? text : "";
  const i = str.indexOf(IMG_TOKEN);
  if (i === -1) return { before: str, after: "", hasToken: false };
  return {
    before: str.slice(0, i),
    after: str.slice(i + IMG_TOKEN.length),
    hasToken: true,
  };
};

/** True when the question has a fabric-composite image block. */
export const hasCompositeImage = (question) =>
  !!(question && question.composite_image_url && Number(question.composite_height) > 0);

/**
 * Height (in px) the paginator should reserve for a question's image block.
 * Composite blocks return their exact (capped) height; legacy single images keep
 * the original flat allowance; questions without images return 0.
 *
 * For left/right/inline placement we still reserve the full composite height
 * rather than max(text, image): a conservative over-estimate can break a page
 * early but will NEVER clip content — the priority is never ruining the layout.
 */
export const estimateImageBlockHeight = (question) => {
  if (hasCompositeImage(question)) {
    const h = Number(question.composite_height) || 0;
    return Math.min(h, MAX_IMAGE_CANVAS_HEIGHT) + 12; // + small vertical margin
  }
  // Legacy single-image support (unchanged behavior). Some surfaces store the
  // image under `image` rather than `image_url`, so honor both.
  const legacy = question && (question.image_url || question.image);
  if (legacy != null && legacy !== "") {
    return 220 + 12;
  }
  return 0;
};
