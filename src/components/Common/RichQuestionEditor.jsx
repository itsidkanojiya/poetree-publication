import { useMemo, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import katex from "katex";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Table as TableIcon,
  ImagePlus,
  Superscript as SupIcon,
  Subscript as SubIcon,
  Trash2,
} from "lucide-react";
import MathFieldPopover from "./MathFieldPopover";
import { API_ORIGIN } from "../../config/api";
import { uploadQuestionInlineImage } from "../../services/adminService";

/**
 * "Word-like" question editor (TipTap): formatting, lists, tables, inline images
 * and math. Produces HTML that is stored in `question_html` (the backend sanitizes
 * it and regenerates the plain-text mirror from it).
 *
 * Math is an inline atom serialized as:
 *     <span data-latex="x^2">$x^2$</span>
 * so the plain-text mirror keeps the familiar $...$ convention and still renders on
 * plain surfaces and in the server PDF.
 *
 * Images are UPLOADED and referenced by URL — never base64 (row bloat; the sanitizer
 * rejects data: URIs).
 */

const absUrl = (u) => {
  if (!u) return u;
  const s = String(u);
  if (/^(https?:|blob:|data:)/i.test(s)) return s;
  return `${API_ORIGIN}/${s.replace(/^\/+/, "")}`;
};

/* ---------------------------------- math ---------------------------------- */

const MathNodeView = ({ node }) => {
  const latex = node.attrs.latex || "";
  const html = useMemo(() => {
    try {
      return katex.renderToString(String(latex), { throwOnError: false });
    } catch {
      return `$${latex}$`;
    }
  }, [latex]);
  return (
    <NodeViewWrapper as="span" className="math-node" style={{ display: "inline-block" }}>
      <span contentEditable={false} dangerouslySetInnerHTML={{ __html: html }} />
    </NodeViewWrapper>
  );
};

const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs) => ({ "data-latex": attrs.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-latex]" }];
  },

  // Text content is the $...$ source so htmlToPlain() yields the plain-text convention.
  renderHTML({ HTMLAttributes, node }) {
    return ["span", mergeAttributes(HTMLAttributes), `$${node.attrs.latex}$`];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },
});

/* --------------------------------- toolbar -------------------------------- */

const btn =
  "p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition";
const btnOn = "bg-blue-50 border-blue-300 text-blue-700";

const RichQuestionEditor = ({ value, onChange, questionType = "mcq", placeholder }) => {
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit, // bold, italic, underline, strike, lists, headings, history
      Superscript,
      Subscript,
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      MathInline,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-body focus:outline-none px-3 py-2 min-h-[140px]",
      },
    },
  });

  if (!editor) return null;

  const insertMath = (latex) => editor.chain().focus().insertContent({ type: "mathInline", attrs: { latex } }).run();

  const pickImage = () => fileRef.current?.click();

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      // Upload first — we embed a URL, never base64.
      const res = await uploadQuestionInlineImage(file, questionType);
      const url = res?.url;
      if (url) editor.chain().focus().setImage({ src: absUrl(url) }).run();
    } catch (err) {
      console.error("Inline image upload failed:", err);
      alert("Could not upload the image. Please try again.");
    }
  };

  const on = (name, attrs) => (editor.isActive(name, attrs) ? btnOn : "");

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50/80">
        <button type="button" title="Bold" className={`${btn} ${on("bold")}`}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="w-4 h-4" />
        </button>
        <button type="button" title="Italic" className={`${btn} ${on("italic")}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="w-4 h-4" />
        </button>
        <button type="button" title="Underline" className={`${btn} ${on("underline")}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" title="Superscript (x²)" className={`${btn} ${on("superscript")}`}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <SupIcon className="w-4 h-4" />
        </button>
        <button type="button" title="Subscript (H₂O)" className={`${btn} ${on("subscript")}`}
          onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <SubIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" title="Bullet list" className={`${btn} ${on("bulletList")}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" title="Numbered list" className={`${btn} ${on("orderedList")}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" title="Insert table" className={btn}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }>
          <TableIcon className="w-4 h-4" />
        </button>
        {editor.isActive("table") && (
          <>
            <button type="button" className={`${btn} text-xs px-2`} title="Add row"
              onClick={() => editor.chain().focus().addRowAfter().run()}>+Row</button>
            <button type="button" className={`${btn} text-xs px-2`} title="Add column"
              onClick={() => editor.chain().focus().addColumnAfter().run()}>+Col</button>
            <button type="button" className={`${btn} text-xs px-2`} title="Delete table"
              onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button type="button" title="Insert image" className={btn} onClick={pickImage}>
          <ImagePlus className="w-4 h-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />

        {/* Reuses the existing MathLive visual formula builder */}
        <MathFieldPopover
          onInsert={insertMath}
          buttonClassName={`${btn} inline-flex items-center gap-1 text-sm`}
        />
      </div>

      <EditorContent editor={editor} />

      {placeholder && editor.isEmpty && (
        <p className="px-3 pb-2 -mt-2 text-xs text-gray-400 italic">{placeholder}</p>
      )}
    </div>
  );
};

export default RichQuestionEditor;
