import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(fileBuffer, fileName) {
  const ext = fileName.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  if (ext === "txt" || ext === "md") {
    return fileBuffer.toString("utf-8");
  }

  return null;
}