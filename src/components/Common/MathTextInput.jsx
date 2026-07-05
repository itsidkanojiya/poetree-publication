import { useRef } from "react";
import MathText from "./MathText";
import MathFieldPopover from "./MathFieldPopover";

/**
 * A controlled text input/textarea with an "Insert formula" (fx) button and a
 * live rendered preview. Formulas are inserted inline as $...$ at the caret, so
 * math mixes with normal text. Storage is unchanged — the value is a plain
 * string that may contain $...$ LaTeX.
 *
 * Props: value, onChange(string), multiline, rows, placeholder, error, className, inputClassName
 */
const MathTextInput = ({
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder = "",
  error = false,
  className = "",
  inputClassName = "",
}) => {
  const ref = useRef(null);

  const insertAtCursor = (latex) => {
    const el = ref.current;
    const token = `$${latex}$`;
    const cur = value ?? "";
    let start = cur.length;
    let end = cur.length;
    if (el && typeof el.selectionStart === "number") {
      start = el.selectionStart;
      end = el.selectionEnd;
    }
    const next = cur.slice(0, start) + token + cur.slice(end);
    onChange(next);
    // restore focus + place caret right after the inserted token
    setTimeout(() => {
      if (el) {
        try {
          el.focus();
          const pos = start + token.length;
          el.setSelectionRange(pos, pos);
        } catch {
          /* noop */
        }
      }
    }, 0);
  };

  const base = `flex-1 min-w-0 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 transition outline-none ${
    error ? "border-red-300" : "border-gray-200 focus:border-blue-500"
  } ${inputClassName}`;

  const hasMath = (value ?? "").includes("$");

  return (
    <div className={className}>
      <div className="flex gap-2 items-start">
        {multiline ? (
          <textarea
            ref={ref}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className={base}
          />
        ) : (
          <input
            ref={ref}
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={base}
          />
        )}
        <MathFieldPopover onInsert={insertAtCursor} />
      </div>
      {hasMath && (
        <div className="mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
          <span className="text-[11px] text-gray-400 mr-2 align-middle">Preview:</span>
          <MathText text={value} />
        </div>
      )}
    </div>
  );
};

export default MathTextInput;
