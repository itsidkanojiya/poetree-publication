import { useMemo } from "react";
import katex from "katex";

/**
 * Renders a string that may contain inline math ($...$) or display math ($$...$$)
 * using KaTeX. Plain text (no "$") is rendered as-is. Malformed LaTeX does not
 * throw (throwOnError: false) — it just shows the raw source.
 *
 * Usage: <MathText text={question.question} />
 */
const MATH_REGEX = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

const MathText = ({ text, className }) => {
  const parts = useMemo(() => {
    if (text == null) return [""];
    const str = String(text);
    if (!str.includes("$")) return [str]; // fast path — no math

    const out = [];
    let lastIndex = 0;
    let key = 0;
    let m;
    MATH_REGEX.lastIndex = 0;
    while ((m = MATH_REGEX.exec(str)) !== null) {
      if (m.index > lastIndex) out.push(str.slice(lastIndex, m.index));
      const isDisplay = m[1] != null;
      const latex = (isDisplay ? m[1] : m[2]) || "";
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: isDisplay,
        });
        out.push(
          <span key={`m${key++}`} dangerouslySetInnerHTML={{ __html: html }} />
        );
      } catch {
        out.push(isDisplay ? `$$${latex}$$` : `$${latex}$`);
      }
      lastIndex = MATH_REGEX.lastIndex;
    }
    if (lastIndex < str.length) out.push(str.slice(lastIndex));
    return out;
  }, [text]);

  return <span className={className}>{parts}</span>;
};

export default MathText;
