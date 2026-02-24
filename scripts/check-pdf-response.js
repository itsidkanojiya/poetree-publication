/**
 * Diagnostic: Check what the backend returns for a worksheet PDF URL.
 * Run: node scripts/check-pdf-response.js
 */

const pdfUrl = "http://localhost:4000/uploads/worksheet/pdf/9442442928.pdf";

async function check() {
  console.log("Fetching:", pdfUrl);
  const res = await fetch(pdfUrl, { method: "GET" });
  const contentType = res.headers.get("Content-Type") || "";
  const contentLength = res.headers.get("Content-Length");
  const firstBytes = await res.arrayBuffer().then((b) => new Uint8Array(b).slice(0, 8));

  console.log("\n--- Response ---");
  console.log("Status:", res.status, res.statusText);
  console.log("Content-Type:", contentType);
  console.log("Content-Length:", contentLength);
  console.log("First 8 bytes (hex):", Array.from(firstBytes).map((b) => b.toString(16).padStart(2, "0")).join(" "));

  const isPdf = firstBytes[0] === 0x25 && firstBytes[1] === 0x50 && firstBytes[2] === 0x44 && firstBytes[3] === 0x46; // %PDF
  const looksLikeHtml = contentType.includes("text/html") || (firstBytes[0] === 0x3c && firstBytes[1] === 0x21); // <!

  console.log("\n--- Diagnosis ---");
  if (res.status !== 200) {
    console.log("ERROR: Backend returned status", res.status, "- not 200. The PDF viewer will fail.");
  }
  if (!contentType.toLowerCase().includes("application/pdf") && !contentType.includes("application/octet-stream")) {
    console.log("WARNING: Content-Type is not application/pdf. Got:", contentType);
  }
  if (isPdf) {
    console.log("OK: Body starts with %PDF - valid PDF bytes.");
  } else if (looksLikeHtml) {
    console.log("ERROR: Response looks like HTML (starts with <!). Backend is likely returning an error page instead of the PDF file.");
  } else {
    console.log("WARNING: Body does not start with %PDF. File may be corrupted or not a PDF.");
  }
}

check().catch((err) => {
  console.error("Request failed:", err.message);
});
