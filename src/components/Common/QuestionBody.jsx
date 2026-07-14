import DOMPurify from "dompurify";
import parse from "html-react-parser";
import katex from "katex";
import MathText from "./MathText";
import { QuestionText } from "./QuestionImageBlock";
import { API_ORIGIN } from "../../config/api";

/**
 * Renders a question body / option, preferring the rich-text HTML when the question
 * was authored in the "Word-like" editor and falling back to the existing plain-text
 * renderer (MathText + the {{img}} composite) otherwise.
 *
 *   <QuestionBody question={q} />              instead of <QuestionText question={q} />
 *   <OptionBody question={q} index={i} option={opt} />   instead of <MathText text={opt} />
 *
 * Math is stored as <span data-latex="x^2">$x^2$</span>, so the plain-text mirror keeps
 * the familiar $...$ convention (and therefore still renders on plain surfaces and in
 * the server PDF). Here we re-render those spans with KaTeX.
 *
 * The backend is the source of truth for sanitisation; DOMPurify here is defence in depth.
 */

const ALLOWED_TAGS = [
  "p", "br", "span", "div",
  "strong", "b", "em", "i", "u", "s", "sup", "sub",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "img", "figure", "figcaption",
  "blockquote", "code", "pre",
];

const ALLOWED_ATTRS = [
  "class", "style", "src", "alt", "width", "height",
  "colspan", "rowspan", "data-latex", "data-type",
];

/** Backend stores relative upload paths; only some endpoints absolutize them. */
const absUrl = (u) => {
  if (!u) return u;
  const s = String(u);
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  return `${API_ORIGIN}/${s.replace(/^\/+/, "")}`;
};

const sanitize = (html) =>
  DOMPurify.sanitize(String(html ?? ""), {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    // No data: URIs — images are uploaded and referenced by URL.
    ALLOWED_URI_REGEXP: /^(?:https?:|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });

/** Render one KaTeX span from its data-latex attribute. */
const renderMath = (latex) => {
  try {
    const html = katex.renderToString(String(latex), { throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span>{`$${latex}$`}</span>;
  }
};

const parseOptions = {
  replace: (node) => {
    if (node.type !== "tag") return undefined;

    // Math node -> KaTeX
    if (node.name === "span" && node.attribs?.["data-latex"]) {
      return renderMath(node.attribs["data-latex"]);
    }

    // Make relative image paths absolute so they load on every surface.
    if (node.name === "img" && node.attribs?.src) {
      const { src, alt, width, height, style, class: cls } = node.attribs;
      return (
        <img
          src={absUrl(src)}
          alt={alt || ""}
          width={width}
          height={height}
          style={{ maxWidth: "100%", height: "auto" }}
          className={cls}
        />
      );
    }

    return undefined;
  },
};

/** True when the question carries a rich-text body. */
export const hasRichBody = (question) =>
  !!(question && typeof question.question_html === "string" && question.question_html.trim());

/** Sanitize + parse an HTML fragment into React nodes. */
export const renderRichHtml = (html) => parse(sanitize(html), parseOptions);

/**
 * Question body — rich HTML when present, else the existing plain renderer.
 */
export const QuestionBody = ({ question, className }) => {
  if (hasRichBody(question)) {
    return (
      <div className={`rich-body ${className || ""}`.trim()}>
        {renderRichHtml(question.question_html)}
      </div>
    );
  }
  // Legacy: plain text + $math$ + the {{img}} composite image.
  return <QuestionText question={question} className={className} />;
};

/**
 * A single option — rich HTML when the question has options_html at this index,
 * else the plain option string through MathText.
 */
export const OptionBody = ({ question, index, option, className }) => {
  const html = question?.options_html?.[index];
  if (typeof html === "string" && html.trim()) {
    return (
      <span className={`rich-body rich-inline ${className || ""}`.trim()}>
        {renderRichHtml(html)}
      </span>
    );
  }
  return <MathText text={option} className={className} />;
};

/**
 * One side of a match pair. Match keeps its {left, right} shape, so options_html
 * is { left: string[], right: string[] } index-aligned with the plain arrays.
 */
export const MatchItemBody = ({ question, side, index, value, className }) => {
  const html = question?.options_html?.[side]?.[index];
  if (typeof html === "string" && html.trim()) {
    return (
      <span className={`rich-body rich-inline ${className || ""}`.trim()}>
        {renderRichHtml(html)}
      </span>
    );
  }
  return <MathText text={value} className={className} />;
};

export default QuestionBody;
