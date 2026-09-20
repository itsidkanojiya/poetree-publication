import { createPortal } from "react-dom";

/**
 * Renders its children into a `.print-root` element appended directly to
 * <body>, so in print CSS we can hide the whole app (`body > *:not(.print-root)`)
 * and leave ONLY this in normal document flow. That makes the printed page count
 * deterministic — it equals the print paper's own height, with no blank trailing
 * pages from the hidden on-screen preview and no reliance on paginating an
 * absolutely-positioned element. Hidden on screen via `.print-root{display:none}`.
 *
 * A portal keeps the subtree inside the React tree, so router/auth context and
 * shared components (HeaderCard, MathText, …) work exactly as in the page.
 */
const PrintPortal = ({ children }) =>
  createPortal(
    <div className="print-root" aria-hidden="true">
      {children}
    </div>,
    document.body
  );

export default PrintPortal;
