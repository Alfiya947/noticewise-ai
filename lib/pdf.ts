export async function extractPdfText(file: File): Promise<string> {
  const pdf = await import("pdfjs-dist");
  pdf.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const task = pdf.getDocument({ data: await file.arrayBuffer() });
  const document = await task.promise;
  try {
    if (document.numPages > 50) throw new Error("Choose a PDF with 50 pages or fewer.");
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join(""));
    }
    const text = pages.join("\n").trim();
    if (!text) throw new Error("No readable text was found. Scanned PDFs need Gemini analysis or a pasted transcription.");
    if (text.length > 50_000) throw new Error("Extracted notice exceeds 50,000 characters. Use a shorter PDF or paste the relevant section.");
    return text;
  } finally {
    await task.destroy();
  }
}
