import MathText from "./MathText";
import { API_ORIGIN } from "../../config/api";
import {
  splitOnImgToken,
  hasCompositeImage,
  stripImgToken,
  IMG_TOKEN,
} from "../../utils/questionImage";

/**
 * Renders a question's image(s) into the paper. Works with the fabric "composite"
 * model (a single flattened PNG with known width/height + a placement) and falls
 * back to the legacy single `image_url` (200px block) for old questions.
 *
 * Two render points per question site:
 *   <QuestionText question={q} />                       replaces <MathText text={q.question} />
 *   <QuestionImageBlock question={q} slot="top" />      before the question text
 *   <QuestionImageBlock question={q} slot="bottom" />   after the question body
 *
 * The `slot` decides which placements render where:
 *   above       -> top      left/right -> top (floated, text wraps)
 *   below       -> bottom   legacy     -> bottom
 *   inline      -> handled by <QuestionText> (token position in the text)
 */

const placementOf = (q) =>
  String(q?.image_placement || (q?.composite_image_url ? "below" : "")).toLowerCase();

const dim = (v) => (v != null && v !== "" ? `${Number(v)}px` : "auto");

/** Default alignment — matches the editor / add-question modal default. */
const alignOf = (q) => String(q?.image_align || "center").toLowerCase();

const justifyFor = (align) =>
  align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

/**
 * Backend stores relative paths (uploads/question/...). Only some endpoints
 * absolutize them, so prefix the API origin whenever the path is relative.
 */
const absUrl = (u) => {
  if (!u) return u;
  const s = String(u);
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  return `${API_ORIGIN}/${s.replace(/^\/+/, "")}`;
};

/**
 * Width is authoritative; height stays auto so a maxWidth cap can never stretch
 * the image (the composite is exported cropped to its content, so the intrinsic
 * aspect ratio is correct).
 */
const imgStyle = (q, extra = {}) => ({
  width: dim(q.composite_width),
  height: "auto",
  maxWidth: "100%",
  ...extra,
});

/** Question text with inline-image support ({{img}} token). */
export const QuestionText = ({ question, className }) => {
  const text = question?.question ?? "";
  if (
    hasCompositeImage(question) &&
    placementOf(question) === "inline" &&
    text.includes(IMG_TOKEN)
  ) {
    const { before, after } = splitOnImgToken(text);
    return (
      <span className={className}>
        {before && <MathText text={before} />}
        <img
          src={absUrl(question.composite_image_url)}
          alt=""
          style={imgStyle(question, {
            display: "inline-block",
            verticalAlign: "middle",
          })}
        />
        {after && <MathText text={after} />}
      </span>
    );
  }
  // Non-inline: strip any stray token so it never prints as literal text.
  return (
    <MathText
      text={text.includes(IMG_TOKEN) ? stripImgToken(text) : text}
      className={className}
    />
  );
};

/**
 * Block image for a given slot (top = above/left/right, bottom = below/legacy).
 * `standalone` renders the whole composite (any placement) as one aligned block —
 * used on preview surfaces that don't split the question into top/text/bottom.
 */
export const QuestionImageBlock = ({ question, slot = "bottom", standalone = false }) => {
  if (!question) return null;

  if (standalone) {
    if (hasCompositeImage(question)) {
      return (
        <div
          className="mt-3 ml-6"
          style={{ display: "flex", justifyContent: justifyFor(alignOf(question)) }}
        >
          <img
            src={absUrl(question.composite_image_url)}
            alt=""
            style={imgStyle(question)}
          />
        </div>
      );
    }
    const legacy = question.image_url || question.image;
    if (legacy) {
      const src =
        typeof File !== "undefined" && legacy instanceof File
          ? URL.createObjectURL(legacy)
          : absUrl(legacy);
      return (
        <div className="mt-3 ml-6">
          <img src={src} alt="" className="max-w-full" style={{ height: "200px", width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      );
    }
    return null;
  }

  // Legacy single image (no composite) — unchanged 200px block, bottom slot only.
  if (!hasCompositeImage(question)) {
    if (slot === "bottom" && question.image_url) {
      return (
        <div className="mt-3 ml-6">
          <img
            src={absUrl(question.image_url)}
            alt=""
            className="border border-gray-200 max-h-[200px] w-auto"
            style={{ height: "200px" }}
          />
        </div>
      );
    }
    return null;
  }

  const placement = placementOf(question);
  if (placement === "inline") return null; // rendered inline by QuestionText

  const img = (
    <img
      src={absUrl(question.composite_image_url)}
      alt=""
      style={imgStyle(question)}
    />
  );

  // Floated (text wraps beside the image) — rendered in the top slot; cleared in
  // the bottom slot so the float never escapes into the next question.
  if (placement === "left" || placement === "right") {
    if (slot === "bottom") return <div style={{ clear: "both" }} />;
    return (
      <div
        style={{
          float: placement,
          margin: placement === "left" ? "0 12px 8px 0" : "0 0 8px 12px",
          maxWidth: "60%",
        }}
      >
        {img}
      </div>
    );
  }

  // above / below — a block aligned left/center/right.
  const targetSlot = placement === "above" ? "top" : "bottom";
  if (slot !== targetSlot) return null;
  return (
    <div
      className="ml-6"
      style={{
        display: "flex",
        justifyContent: justifyFor(alignOf(question)),
        margin: slot === "top" ? "0 0 8px 0" : "8px 0 0 0",
      }}
    >
      {img}
    </div>
  );
};

export default QuestionImageBlock;
