const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

async function extractText(fileBuffer, fileName) {
  const ext = fileName.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    const parser = new PDFParse({ data: fileBuffer });
    const data = await parser.getText();
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

module.exports = { extractText };