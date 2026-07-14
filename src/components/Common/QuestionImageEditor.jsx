import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import {
  X,
  ImagePlus,
  Type,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FlipHorizontal,
} from "lucide-react";
import MathText from "./MathText";
import {
  IMAGE_CANVAS_WIDTH,
  MAX_IMAGE_CANVAS_HEIGHT,
  MIN_IMAGE_CANVAS_HEIGHT,
  IMG_TOKEN,
  splitOnImgToken,
  stripImgToken,
} from "../../utils/questionImage";

/**
 * Fabric.js editor for a question's image block, with a live side-by-side preview
 * of how the composed question will look in the paper.
 *
 * Admin can add multiple images and (optionally) the question text onto a
 * fixed-width, height-capped canvas, then move / resize / rotate / layer / align /
 * flip them. On save it emits the layout JSON, a flattened composite PNG, dims,
 * placement and align. See src/utils/questionImage.js.
 *
 * Props:
 *   questionText     : string   current question text (for preview + "Add text")
 *   initialLayout    : object|string|null  fabric JSON to rehydrate
 *   initialHeight    : number
 *   initialPlacement : 'inline'|'above'|'below'|'left'|'right'
 *   initialAlign     : 'left'|'center'|'right'
 *   onCancel()       : void
 *   onSave(result)   : void
 */
const PLACEMENTS = [
  { value: "inline", label: "Inline (at {{img}})" },
  { value: "above", label: "Above text" },
  { value: "below", label: "Below text" },
  { value: "left", label: "Left (wrap)" },
  { value: "right", label: "Right (wrap)" },
];

const dataUrlToBlob = (dataUrl) => {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/png";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const clampHeight = (h) =>
  Math.min(Math.max(h || 300, MIN_IMAGE_CANVAS_HEIGHT), MAX_IMAGE_CANVAS_HEIGHT);

/** Tight bounding box (canvas coords) around all objects, with small padding. */
const computeContentRect = (canvas) => {
  const objs = canvas.getObjects();
  if (!objs.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objs.forEach((o) => {
    const r = o.getBoundingRect();
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.left + r.width);
    maxY = Math.max(maxY, r.top + r.height);
  });
  const pad = 4;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(canvas.getWidth() - left, maxX - minX + pad * 2);
  const height = Math.min(canvas.getHeight() - top, maxY - minY + pad * 2);
  return { left, top, width, height };
};

/** Export the canvas cropped to its content (no surrounding whitespace). */
const exportCanvasImpl = (canvas, multiplier) => {
  const rect = computeContentRect(canvas);
  const opts = { format: "png", multiplier, enableRetinaScaling: false };
  let width = canvas.getWidth();
  let height = canvas.getHeight();
  if (rect) {
    Object.assign(opts, rect);
    width = rect.width;
    height = rect.height;
  }
  return { dataUrl: canvas.toDataURL(opts), width, height };
};

const QuestionImageEditor = ({
  questionText = "",
  onQuestionTextChange,
  initialLayout = null,
  initialHeight = 300,
  initialPlacement = "below",
  initialAlign = "center",
  onCancel,
  onSave,
}) => {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const sourceFilesRef = useRef([]); // File objects picked this session
  const fileInputRef = useRef(null);

  const [placement, setPlacement] = useState(initialPlacement || "below");
  const [align, setAlign] = useState(initialAlign || "center");
  const [height, setHeight] = useState(clampHeight(initialHeight));
  const [hasSelection, setHasSelection] = useState(false);
  const [selWidth, setSelWidth] = useState(0); // displayed width (px) of the selected object
  const [previewUrl, setPreviewUrl] = useState(null); // live canvas snapshot

  const refreshPreview = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      // Crop to content, exactly like the saved composite — otherwise the preview
      // would show the canvas whitespace that never reaches the paper.
      const url = canvas.getObjects().length ? exportCanvasImpl(canvas, 1).dataUrl : null;
      setPreviewUrl(url);
    } catch {
      /* toDataURL can throw on a tainted canvas; ignore for preview */
    }
  }, []);

  // Init fabric canvas once.
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: IMAGE_CANVAS_WIDTH,
      height: clampHeight(initialHeight),
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const syncSel = () => {
      const o = canvas.getActiveObject();
      setHasSelection(!!o);
      setSelWidth(o ? Math.round(o.getScaledWidth()) : 0);
    };
    canvas.on("selection:created", syncSel);
    canvas.on("selection:updated", syncSel);
    canvas.on("selection:cleared", syncSel);
    canvas.on("object:added", refreshPreview);
    canvas.on("object:removed", refreshPreview);
    canvas.on("object:modified", refreshPreview);
    // Keep the width box in sync while dragging the resize handles.
    canvas.on("object:scaling", syncSel);
    canvas.on("object:modified", syncSel);

    if (initialLayout) {
      const json = typeof initialLayout === "string" ? initialLayout : JSON.stringify(initialLayout);
      canvas.loadFromJSON(json).then(() => {
        canvas.requestRenderAll();
        refreshPreview();
      });
    }

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply height changes to the live canvas.
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width: IMAGE_CANVAS_WIDTH, height });
    canvas.requestRenderAll();
    refreshPreview();
  }, [height, refreshPreview]);

  const addImageFromFile = (file) => {
    const canvas = fabricRef.current;
    if (!canvas || !file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const img = await fabric.FabricImage.fromURL(String(reader.result), {
        crossOrigin: "anonymous",
      });
      const maxW = IMAGE_CANVAS_WIDTH - 40;
      if (img.width > maxW) img.scale(maxW / img.width);
      img.set({ left: 20, top: 20 });
      // Tag the object with its source File so deleting it also drops the upload.
      img._srcFile = file;
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      sourceFilesRef.current.push(file);
      refreshPreview();
    };
    reader.readAsDataURL(file);
  };

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(addImageFromFile);
    e.target.value = "";
  };

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Strip math/image markers for a clean on-canvas label.
    const text = stripImgToken(questionText || "").replace(/\$/g, "").trim() || "Question text";
    const box = new fabric.Textbox(text, {
      left: 20,
      top: 20,
      width: IMAGE_CANVAS_WIDTH - 40,
      fontSize: 20,
      fill: "#111827",
      fontFamily: "Arial",
    });
    canvas.add(box);
    canvas.setActiveObject(box);
    canvas.requestRenderAll();
    refreshPreview();
  };

  const withActive = (fn) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      fn(canvas, obj);
      canvas.requestRenderAll();
      refreshPreview();
    }
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    if (!objs.length) return;
    objs.forEach((o) => {
      // Removing an image also drops its source File so it is not uploaded.
      if (o._srcFile) {
        sourceFilesRef.current = sourceFilesRef.current.filter((f) => f !== o._srcFile);
      }
      canvas.remove(o);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    refreshPreview();
  };
  const bringForward = () => withActive((c, o) => c.bringObjectForward(o));
  const sendBackward = () => withActive((c, o) => c.sendObjectBackwards(o));
  const flipH = () => withActive((c, o) => o.set("flipX", !o.flipX));

  const alignSelected = (where) =>
    withActive((c, o) => {
      const w = o.getScaledWidth();
      if (where === "left") o.set("left", 10);
      else if (where === "right") o.set("left", c.getWidth() - w - 10);
      else o.set("left", (c.getWidth() - w) / 2);
      o.setCoords();
    });

  const handleSave = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const layout = canvas.toJSON();
    // Export cropped to the content bounds so the PNG carries no surrounding
    // whitespace and width/height describe the real block the paper must reserve.
    const { dataUrl, width, height: h } = exportCanvasImpl(canvas, 2);
    const compositeBlob = dataUrlToBlob(dataUrl);

    onSave({
      layout,
      compositeBlob,
      compositeDataUrl: dataUrl,
      width,
      height: h,
      placement,
      align,
      sourceFiles: sourceFilesRef.current.slice(),
      isEmpty: canvas.getObjects().length === 0,
    });
  };

  /** Resize the selected object to an exact display width (aspect ratio preserved). */
  const setSelectedWidth = (px) => {
    const canvas = fabricRef.current;
    const o = canvas?.getActiveObject();
    if (!canvas || !o) return;
    const w = Math.max(20, Math.min(IMAGE_CANVAS_WIDTH, Math.round(Number(px) || 0)));
    o.scaleToWidth(w);
    o.setCoords();
    canvas.requestRenderAll();
    setSelWidth(Math.round(o.getScaledWidth()));
    refreshPreview();
  };

  /** Shrink the canvas height so there is no empty space under the content. */
  const fitHeightToContent = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = computeContentRect(canvas);
    if (!rect) return;
    setHeight(clampHeight(Math.ceil(rect.top + rect.height + 8)));
  };

  const toolBtn =
    "p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition";

  // ---- Live preview (mirrors how QuestionImageBlock renders in the paper) ----
  const previewImg = previewUrl ? (
    <img src={previewUrl} alt="" style={{ maxWidth: "100%" }} />
  ) : (
    <span className="text-xs text-gray-400 italic">[image]</span>
  );

  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const hasText = (questionText || "").trim().length > 0;
  const textNode = hasText ? (
    <MathText text={stripImgToken(questionText)} />
  ) : (
    <span className="text-gray-400 italic">Question text will appear here…</span>
  );

  // Interactive inline placement: render the question as words with drop-zones
  // between them; dragging (or clicking) a gap writes the {{img}} marker there.
  const InlineTextEditor = () => {
    const base = stripImgToken(questionText || "");
    const words = base.split(/\s+/).filter(Boolean);
    let tokenIndex = words.length; // default: end
    if ((questionText || "").includes(IMG_TOKEN)) {
      const { before } = splitOnImgToken(questionText);
      tokenIndex = stripImgToken(before).split(/\s+/).filter(Boolean).length;
    }
    const placeAt = (i) =>
      onQuestionTextChange?.([...words.slice(0, i), IMG_TOKEN, ...words.slice(i)].join(" ").trim());

    const Gap = ({ i }) => (
      <span
        onClick={() => placeAt(i)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          placeAt(i);
        }}
        title="Place image here"
        className="inline-block align-middle mx-[1px] rounded cursor-pointer hover:bg-blue-400 transition-colors"
        style={{ width: 8, height: 18, background: "rgba(59,130,246,0.18)" }}
      />
    );

    const imgEl = previewUrl ? (
      <img
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", "img")}
        src={previewUrl}
        alt=""
        style={{ display: "inline-block", verticalAlign: "middle", maxHeight: 56, maxWidth: "45%", cursor: "grab" }}
      />
    ) : null;

    if (!hasText) {
      return (
        <p className="text-sm leading-relaxed">
          <span className="text-gray-400 italic">Enter question text to place the image inside it…</span>
        </p>
      );
    }

    const nodes = [];
    for (let i = 0; i <= words.length; i++) {
      nodes.push(<Gap key={`g${i}`} i={i} />);
      if (i === tokenIndex && imgEl) nodes.push(<span key="img">{imgEl}</span>);
      if (i < words.length) nodes.push(<span key={`w${i}`}>{words[i]} </span>);
    }
    return (
      <>
        <p className="text-sm leading-relaxed">{nodes}</p>
        <p className="mt-2 text-[11px] text-blue-500">
          {imgEl
            ? "Drag the image into a blue gap (or click a gap) to place it between words."
            : "Add an image first, then drag it into a gap between words."}
        </p>
      </>
    );
  };

  const renderPreviewBody = () => {
    if (placement === "inline") return <InlineTextEditor />;
    if (!previewUrl) return <p className="text-sm leading-relaxed">{textNode}</p>;
    if (placement === "left" || placement === "right") {
      return (
        <div>
          <div style={{ float: placement, maxWidth: "45%", margin: placement === "left" ? "0 10px 6px 0" : "0 0 6px 10px" }}>
            {previewImg}
          </div>
          <p className="text-sm leading-relaxed">{textNode}</p>
          <div style={{ clear: "both" }} />
        </div>
      );
    }
    // above / below
    const imageBlock = (
      <div style={{ display: "flex", justifyContent: justify, margin: "6px 0" }}>{previewImg}</div>
    );
    return (
      <div>
        {placement === "above" && imageBlock}
        <p className="text-sm leading-relaxed">{textNode}</p>
        {placement === "below" && imageBlock}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Question Images</h3>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <ImagePlus className="w-4 h-4" /> Add image
          </button>
          <button
            onClick={addText}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-100"
            title="Drop the question text onto the canvas as a draggable block"
          >
            <Type className="w-4 h-4" /> Add text
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilePick}
            className="hidden"
          />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button className={toolBtn} onClick={deleteSelected} disabled={!hasSelection} title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className={toolBtn} onClick={bringForward} disabled={!hasSelection} title="Bring forward">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button className={toolBtn} onClick={sendBackward} disabled={!hasSelection} title="Send backward">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className={toolBtn} onClick={() => alignSelected("left")} disabled={!hasSelection} title="Align left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button className={toolBtn} onClick={() => alignSelected("center")} disabled={!hasSelection} title="Align center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button className={toolBtn} onClick={() => alignSelected("right")} disabled={!hasSelection} title="Align right">
            <AlignRight className="w-4 h-4" />
          </button>
          <button className={toolBtn} onClick={flipH} disabled={!hasSelection} title="Flip horizontal">
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Exact width for the selected item (aspect ratio is preserved). */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            Width
            <input
              type="number"
              min={20}
              max={IMAGE_CANVAS_WIDTH}
              step={10}
              value={hasSelection ? selWidth : ""}
              disabled={!hasSelection}
              onChange={(e) => setSelectedWidth(e.target.value)}
              title="Width of the selected item in px"
              className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-40"
            />
            <span className="text-gray-400 font-normal">px</span>
          </label>
          <button
            className={toolBtn + " text-xs font-semibold px-3"}
            onClick={() => setSelectedWidth(IMAGE_CANVAS_WIDTH - 40)}
            disabled={!hasSelection}
            title="Make the selected item span the full width"
          >
            Full width
          </button>
          <button
            className={toolBtn + " text-xs font-semibold px-3"}
            onClick={fitHeightToContent}
            title="Trim the empty space below the content"
          >
            Fit height
          </button>
        </div>

        {/* Canvas + live preview, side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-5 px-5 py-4">
          <div>
            <div className="inline-block border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              <canvas ref={canvasElRef} />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Drag to move, use handles to resize/rotate. Select an item to enable the tools above.
            </p>
          </div>

          {/* Live preview */}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
            <div className="border border-gray-200 rounded-lg bg-white p-4 text-gray-800" style={{ minHeight: 160 }}>
              <div className="flex gap-1">
                <span className="font-bold text-sm">(1)</span>
                <div className="flex-1 min-w-0">{renderPreviewBody()}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              This is how the question will appear in the paper.
            </p>
          </div>
        </div>

        {/* Layout controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-4 border-t border-gray-100">
          <label className="text-sm">
            <span className="block text-gray-600 mb-1 font-medium">Placement</span>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            >
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1 font-medium">Align (above/below)</span>
            <select
              value={align}
              onChange={(e) => setAlign(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1 font-medium">Canvas height ({height}px)</span>
            <input
              type="range"
              min={MIN_IMAGE_CANVAS_HEIGHT}
              max={MAX_IMAGE_CANVAS_HEIGHT}
              step={10}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full mt-2"
            />
          </label>
        </div>

        {placement === "inline" && (
          <p className="px-5 -mt-2 pb-2 text-xs text-amber-600">
            Insert the <code className="bg-amber-50 px-1 rounded">{"{{img}}"}</code> marker in the
            question text where the image should appear.
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Save images
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionImageEditor;
