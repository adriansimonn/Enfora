const exifr = require("exifr");
const AdmZip = require("adm-zip");
const { parseStringPromise } = require("xml2js");


/**
 * Extract creation/modification date metadata from various file types
 * Returns the earliest relevant date found (creation date preferred, modification date as fallback)
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - Original filename for extension detection
 * @returns {Promise<{creationDate: Date|null, modificationDate: Date|null}>} - The dates or null if not found
 */
async function extractMetadataDates(fileBuffer, fileName) {
  try {
    const ext = fileName.split(".").pop().toLowerCase();
    let creationDate = null;
    let modificationDate = null;

    // For image files (PNG, JPG, JPEG)
    if (["png", "jpg", "jpeg"].includes(ext)) {
      const metadata = await exifr.parse(fileBuffer, {
        pick: ["DateTimeOriginal", "CreateDate", "ModifyDate", "DateCreated"],
      });

      if (metadata) {
        // DateTimeOriginal and CreateDate are most reliable for creation
        if (metadata.DateTimeOriginal) {
          creationDate = new Date(metadata.DateTimeOriginal);
        } else if (metadata.CreateDate) {
          creationDate = new Date(metadata.CreateDate);
        } else if (metadata.DateCreated) {
          creationDate = new Date(metadata.DateCreated);
        }

        // ModifyDate for modification
        if (metadata.ModifyDate) {
          modificationDate = new Date(metadata.ModifyDate);
        }
      }
    }

    // For PDF files - metadata extraction disabled
    // Many PDF generators (Google Docs, etc.) update metadata on export, making it unreliable
    // Filesystem dates are not available from buffer uploads
    if (ext === "pdf") {
      // No metadata validation for PDFs
      return { creationDate: null, modificationDate: null };
    }

    // For DOCX files - extract from internal XML
    if (ext === "docx") {
      try {
        const zip = new AdmZip(fileBuffer);
        const corePropsEntry = zip.getEntry("docProps/core.xml");

        if (corePropsEntry) {
          const corePropsXml = corePropsEntry.getData().toString("utf8");
          const coreProps = await parseStringPromise(corePropsXml);

          // Navigate the XML structure to find date properties
          const cp = coreProps["cp:coreProperties"];
          if (cp) {
            if (cp["dcterms:created"] && cp["dcterms:created"][0]) {
              const createdStr = cp["dcterms:created"][0]._;
              creationDate = new Date(createdStr);
            }
            if (cp["dcterms:modified"] && cp["dcterms:modified"][0]) {
              const modifiedStr = cp["dcterms:modified"][0]._;
              modificationDate = new Date(modifiedStr);
            }
          }
        }
      } catch (docxError) {
        console.error("Error parsing DOCX metadata:", docxError);
      }
    }

    // For TXT and MD files - no embedded metadata available
    // These files don't have internal metadata structures
    if (["txt", "md"].includes(ext)) {
      // No metadata extraction possible for plain text files
      // Filesystem timestamps would be needed, but they're unreliable
      return { creationDate: null, modificationDate: null };
    }

    return { creationDate, modificationDate };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    // Return nulls instead of throwing - missing metadata shouldn't block upload
    return { creationDate: null, modificationDate: null };
  }
}

module.exports = { extractMetadataDates };
