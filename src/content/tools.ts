import type { ToolContent } from './types.ts'

export const TOOL_CONTENT: Record<string, ToolContent> = {
  'merge-pdf': {
    brief: [
      'Merging PDFs is one of the most common document tasks: combining a proposal and its appendix, putting several scanned pages into one file, or joining chapters into a single report. The Merge PDF tool does this in your browser, so the documents are combined locally and never uploaded anywhere.',
    ],
    sections: [
      {
        heading: 'What Merge PDF does',
        paragraphs: [
          'Merge PDF joins two or more PDF files into a single document. You control the exact order of the pages, which matters when a handover pack or a submission needs a specific sequence: cover page first, contents next, signed pages at the end.',
          'The pages are combined by writing a new PDF file locally on your device. Because there is no upload, the process is fast even for large files, and confidential material such as contracts, payslips or medical records stays on the machine where you opened the browser.',
        ],
      },
      {
        heading: 'How to merge PDFs',
        paragraphs: [
          'Add at least two PDF files — use the file picker or drag and drop them anywhere onto the drop zone. The files are read straight from disk, so nothing is transmitted.',
          'Drag the rows to arrange the files in the order you want them to appear, then click Merge. The finished document downloads automatically and you can open, email or archive it right away.',
        ],
      },
      {
        heading: 'When you might need it',
        paragraphs: [
          'Typical uses include combining an invoice with its supporting documents, merging a multi-scanner scan taken in separate batches, assembling course notes, or joining multiple agreement pages before e-signing the result. Many people also use it to reunite a PDF that was split into parts for sending.',
        ],
      },
    ],
    tips: [
      'Double-check the page count of each source file before merging so you can verify the result.',
      'Drag the files card by card — the order in the list is exactly the order in the output.',
      'Merged files keep the pages of every source, at their original size and quality.',
      'You can merge scanned and text PDFs together; each keeps its own look.',
    ],
    faq: [
      {
        q: 'How many PDFs can I merge at once?',
        a: 'There is no hard limit on the number of files. The practical ceiling is your device memory — roughly 200 MB of combined input — which is far beyond what email attachments allow anyway.',
      },
      {
        q: 'Is merging really done on my device?',
        a: 'Yes. The Merge PDF tool runs JavaScript inside your browser. Your files are read locally and the combined document is written locally; nothing is transmitted to a server.',
      },
      {
        q: 'Will the result be smaller or larger?',
        a: 'Merging adds no watermarks and does not recompress your pages, so page quality is unchanged. The output size is roughly the sum of the source sizes.',
      },
      {
        q: 'Can I merge PDF files with different page sizes?',
        a: 'Yes. Each page keeps its original dimensions, which is helpful when mixing A4 documents with letter-size pages or landscape scans.',
      },
    ],
    related: ['split-pdf', 'organize-pdf', 'compress-pdf'],
  },

  'split-pdf': {
    brief: [
      'A large PDF is awkward to email, upload or print. Split PDF lets you pull a single set of pages out of a document, break a big file into smaller chunks, or turn every page into its own PDF — all handled by your browser without uploading the file.',
    ],
    sections: [
      {
        heading: 'What Split PDF does',
        paragraphs: [
          'The tool offers three modes. Extract page ranges copies specific pages (for example 1-3, 4-6, 9) into a new document. Split every N pages divides the file into equally sized parts, and One PDF per page produces a separate file for every page in the document.',
          'All outputs are bundled into a ZIP archive, so a 200-page document can be split into a single download rather than dozens of individual files.',
        ],
      },
      {
        heading: 'How to split a PDF',
        paragraphs: [
          'Upload the PDF, choose the mode that fits, and enter the page ranges or the chunk size. Click Split, then download the ZIP once it finishes. The original file is never changed — you always keep your untouched source.',
        ],
      },
      {
        heading: 'When splitting is useful',
        paragraphs: [
          'Common cases are: emailing just one invoice out of a monthly statement, sending only the signed page of a contract, keeping a large manual under a file-size limit, or posting a single slide as a PDF instead of the whole deck.',
        ],
      },
    ],
    tips: [
      'Ranges are written like 1-3, 4-6, 9 and read the page numbers shown on the document.',
      'Use "One PDF per page" when you need to share individual pages from a scanned book or a long presentation.',
      'Your original document is untouched — splitting always works on a copy.',
    ],
    faq: [
      {
        q: 'Does splitting upload my PDF?',
        a: 'No. The page extraction runs in your browser using the pdf.js engine, and the resulting files are packaged into a ZIP locally before you download them.',
      },
      {
        q: 'What ZIP archive?',
        a: 'When a tool produces more than one file, the results are packed into a single ZIP so you get one download instead of many. You can extract it with any archiver.',
      },
      {
        q: 'How do I extract a single page?',
        a: 'Use the range mode and enter just that page number, for example "7". The output is a one-page PDF.',
      },
    ],
    related: ['merge-pdf', 'organize-pdf', 'pdf-to-jpg'],
  },

  'organize-pdf': {
    brief: [
      'Before you share a document it often needs tidying: pages in the wrong order, a page rotated the wrong way, or a couple of blank pages that should not be there. Organise PDF gives you visual page thumbnails to reorder, rotate and delete pages before exporting a clean document.',
    ],
    sections: [
      {
        heading: 'What Organise PDF does',
        paragraphs: [
          'The tool renders every page of your PDF as a thumbnail. You drag thumbnails to change the order, use the rotate actions to fix sideways scans, and remove pages you do not need. Once you are happy, export a new document with the corrected structure.',
          'Because the work happens in your browser, you can experiment freely — deleting a page only affects the new export, never the file on your disk.',
        ],
      },
      {
        heading: 'How to rearrange pages',
        paragraphs: [
          'Upload the PDF, then drag a thumbnail to a new position in the strip. Select a page and use the toolbar to rotate left or right or to delete it. When the preview looks right, click Export to download the revised PDF.',
        ],
      },
      {
        heading: 'Good uses for page organisation',
        paragraphs: [
          'Typical jobs include moving the last page of a scan to the front, rotating a photo scanned sideways, removing blank sheets produced by a scanner, and deleting duplicate pages before you email a document.',
        ],
      },
    ],
    tips: [
      'Rotate fixes, most sideways scans are turned by 90° either direction.',
      'If a source document was scanned two-sided, blank pages are usually the separator — this tool removes them in seconds.',
      'You can reorganise a file and then compress it in the same sitting: two tools, no uploads.',
    ],
    faq: [
      {
        q: 'Can I put back a page I deleted?',
        a: 'Deleting only removes the page from the new export. Your original file is never modified, so you can re-upload it and start again if you change your mind.',
      },
      {
        q: 'Does organising change the file quality?',
        a: 'No. Pages keep their original rendering and quality; the tool works with the existing page structure.',
      },
      {
        q: 'Is my PDF safe to upload here?',
        a: 'Nothing is uploaded at all. The page previews and the exports are generated entirely inside your browser.',
      },
    ],
    related: ['split-pdf', 'merge-pdf', 'pdf-to-jpg'],
  },

  'compress-pdf': {
    brief: [
      'Most PDFs are larger than they need to be, and oversized files get rejected by email servers, form uploads and document systems. Compress PDF reduces file size in your browser by re-encoding embedded images and stripping unused objects, while keeping text selectable.',
    ],
    sections: [
      {
        heading: 'Why PDF files get big',
        paragraphs: [
          'Two things usually inflate a PDF: high-resolution images embedded inside it, and redundant data left behind by the software that created it. Scanned documents and PDFs exported from design tools are the most common culprits.',
          'Compression tackles this by re-encoding images at a lower quality and removing unused objects. The result is a smaller file that still looks right for its purpose — emailing, uploading, or storing.',
        ],
      },
      {
        heading: 'Choosing a compression level',
        paragraphs: [
          'Light keeps the highest quality and is best for documents that are mostly text or will be printed. Balanced is a good default for email and forms. Strong produces the smallest file and suits scans that only need to be readable on screen.',
          'You can also re-encode embedded images to a target quality, and rebuild pages as images for the biggest possible saving on photo-heavy files.',
        ],
      },
      {
        heading: 'What to expect after compressing',
        paragraphs: [
          'A 10 MB scanned document often drops to 1–2 MB at balanced settings, while a text-only PDF may barely shrink because there are no images to compress. If the result is not smaller than the original, the original is returned untouched.',
        ],
      },
    ],
    tips: [
      'For email, "Balanced" is usually enough; save "Strong" for a stubbornly large scan.',
      'Use 300 DPI sources for print, but compress them only for sending — keep the original for the printer.',
      'Compress first, then upload — most web forms are happier with files under 5 MB.',
      'Email services such as Gmail cap attachments around 25 MB; compressing is faster than re-scanning.',
    ],
    faq: [
      {
        q: 'Does compression damage my document?',
        a: 'The text layer stays selectable and searches, and layout is preserved. Only the image encoding changes, so picture-heavy pages lose some sharpness at stronger levels — which is normally invisible at screen size.',
      },
      {
        q: 'Why did my PDF not get smaller?',
        a: 'A text-only PDF that was already produced efficiently has little to remove. The tool detects this and returns the original file rather than a worse result.',
      },
      {
        q: 'Is compression really free and without watermarks?',
        a: 'Yes — it runs in your browser, so there is no server, no account, no queue, and no watermark ever added to the output.',
      },
      {
        q: 'Can I compress before uploading a form?',
        a: 'Yes, and that is a common workflow: compress the file to stay under a form\u2019s size limit, then upload it knowing the content is still readable.',
      },
    ],
    related: ['pdf-to-jpg', 'split-pdf', 'merge-pdf'],
  },

  'pdf-to-word': {
    brief: [
      'Receiving an editable Word version of a PDF saves retyping a document from scratch. PDF to Word converts a PDF into a .docx file in the browser, reconstructing headings, paragraphs, lists and tables as real editable content.',
    ],
    sections: [
      {
        heading: 'How PDF to Word works',
        paragraphs: [
          'PDFs store page layout, not document structure. The tool reads the text layer of each page and rebuilds it as Word objects: paragraphs become paragraphs, lists become lists, and tables are recreated as tables. The result opens in Microsoft Word, Google Docs or LibreOffice and can be edited normally.',
          'For documents that look right as static pages — such as a designed brochure — the faithful mode exports the pages as images inside the Word file so the layout stays exact.',
        ],
      },
      {
        heading: 'When conversion works best',
        paragraphs: [
          'The editable mode shines with text documents: reports, essays, letters, manuals and simple forms. It is less exact for heavily designed multi-column layouts, which is why you get the choice of modes.',
          'Scanned PDFs contain no text layer, so a pure scan has nothing to convert yet — run OCR on it first and then convert the result to Word.',
        ],
      },
      {
        heading: 'Getting a clean result',
        paragraphs: [
          'Use a PDF that is not rotated and has standard fonts embedded. After conversion, the text is honest Word content, so you can fix spacing or headers with normal editing tools instead of fighting an image.',
        ],
      },
    ],
    tips: [
      'For scanned documents, use OCR PDF first to create a searchable text layer, then convert to Word.',
      'Prefer editable mode when you want to type into the document; faithful mode when appearance matters more than editability.',
      'Complex multi-column PDFs convert better after zooming — the text layer is read from the page structure, not pixels.',
    ],
    faq: [
      {
        q: 'Will my formatting be perfect?',
        a: 'Mostly, for standard single-column documents. Complex layouts like multi-column magazines or text over images convert approximately because the original structure does not exist to copy.',
      },
      {
        q: 'What should I do with a scanned PDF?',
        a: 'Run it through OCR PDF first. OCR adds a recognised text layer, and only then can a converter produce editable text instead of a blank space.',
      },
      {
        q: 'Where is my document processed?',
        a: 'In your browser. The PDF is read locally and the .docx is built locally, so the content never leaves your device.',
      },
    ],
    related: ['ocr-pdf', 'pdf-to-excel', 'word-to-pdf'],
  },

  'pdf-to-excel': {
    brief: [
      'Tables buried in a PDF are painful to retype into a spreadsheet. PDF to Excel detects rows and columns from the page layout and exports them as an .xlsx workbook, ready to sort, filter and analyse.',
    ],
    sections: [
      {
        heading: 'What the conversion extracts',
        paragraphs: [
          'The tool reads the text position of every cell on the page and reconstructs the grid. Values, headings and blank cells are placed in the correct columns, and the result opens as a normal Excel sheet with the tabular content in the right spots.',
          'If the tool cannot detect a clear row/column structure, it exports the page text into the worksheet so nothing is lost.',
        ],
      },
      {
        heading: 'Best inputs for clean tables',
        paragraphs: [
          'Clear printed tables with regular rows and columns convert best: price lists, bank statements, schedules, and simple data sheets. Scan quality matters too — a clean, deskewed, straight scan gives the layout detector far more to work with.',
        ],
      },
      {
        heading: 'When it is not the right tool',
        paragraphs: [
          'Photographs of documents, hand-written tables, or images with no text layer have no machine-readable text. Run OCR first in those cases, then convert the searchable PDF to Excel.',
        ],
      },
    ],
    tips: [
      'Check the "rows detected" preview before downloading so you catch a missing header early.',
      'Name the worksheet something meaningful — the export uses your label as the sheet name.',
      'Straight, well-lit scans convert far better than tilted or shadowed ones.',
    ],
    faq: [
      {
        q: 'Can I convert a scanned table?',
        a: 'Only if a text layer exists. Use OCR PDF to recognise the text first, then convert that output to Excel.',
      },
      {
        q: 'Will formulas come across?',
        a: 'No — PDFs do not store formulas, only values. The result is a static grid you can re-apply formulas to if you need them.',
      },
      {
        q: 'Do numbers stay numbers?',
        a: 'Numbers are exported as numeric cells where the layout is detected correctly, so you can sum and sort them in Excel.',
      },
    ],
    related: ['ocr-pdf', 'pdf-to-word', 'pdf-to-jpg'],
  },

  'pdf-to-jpg': {
    brief: [
      'Turning PDF pages into JPG or PNG images is useful for slides, thumbnails, previews and uploads that only accept pictures. PDF to JPG renders every page in your browser at the resolution you choose and packages the images as a ZIP.',
    ],
    sections: [
      {
        heading: 'Choosing a format and resolution',
        paragraphs: [
          'JPG is the right format for photos and slides because it keeps files small; PNG is better for graphics, text-heavy pages and anything that needs sharp edges. The resolution options map to common needs: 72 DPI for quick screen previews, 150 DPI for the web, and 300 DPI for print.',
          'Higher DPI means sharper images and larger files, so pick the lowest setting that still looks right for where the image will be used.',
        ],
      },
      {
        heading: 'Turning slides into images',
        paragraphs: [
          'A frequent use is turning a presentation PDF into slide images for posting on social, inserting into a document, or sharing one slide at a time. Choose the slide\u2019s matching DPI, export, and each page comes out as its own image in a single ZIP download.',
        ],
      },
    ],
    tips: [
      'Use 150 DPI for pages that will be viewed on a screen; 300 DPI only for printing.',
      'Choose PNG for text and logos so edges stay crisp.',
      'The ZIP download keeps the original page order and names files by page number.',
    ],
    faq: [
      {
        q: 'Does converting to image reduce the file size?',
        a: 'Photo-heavy files usually get smaller as images; text-only PDFs often get larger because pixels take more space than vector text.',
      },
      {
        q: 'How many images will I get?',
        a: 'One image per page, delivered as a single ZIP. A 10-page PDF yields 10 image files.',
      },
      {
        q: 'Is my PDF safe to use here?',
        a: 'The rendering runs locally — pages are drawn inside your browser and your file is never uploaded.',
      },
    ],
    related: ['image-to-pdf', 'compress-pdf', 'split-pdf'],
  },

  'word-to-pdf': {
    brief: [
      'PDF is the safest format for sharing documents because it looks the same on every device. Word to PDF converts .docx files into PDFs in the browser, laying out headings, lists, tables and images onto clean pages.',
    ],
    sections: [
      {
        heading: 'What Word to PDF produces',
        paragraphs: [
          'The converter reads the document structure — headings, paragraphs, lists, tables and images — and paints them onto pages with the page size and margins you choose (A4 or US Letter). The result is a PDF that fonts, breaklines and images correctly on screen, in previews, and in print.',
        ],
      },
      {
        heading: 'Convert \u201cjust in case\u201d files',
        paragraphs: [
          'Sending a CV, contract or proposal as a PDF prevents a colleague from breaking the layout in Word or opening it with missing fonts. It is also the format most application portals and publishers expect.',
        ],
      },
    ],
    tips: [
      'Convert before emailing an important document so it renders identically everywhere.',
      'Leave the page size matching your originals to avoid unexpected re-flow.',
      'For a CV or report, A4 is standard across most of the world; Letter for US-based recipients.',
    ],
    faq: [
      {
        q: 'Will embedded images stay sharp?',
        a: 'Images are included at their original resolution, so they render crisply in the PDF output.',
      },
      {
        q: 'Can I convert without installing anything?',
        a: 'Yes — the whole conversion runs in your browser. Drop the .docx file, wait for layout, and download the PDF.',
      },
      {
        q: 'Does it look the same as printing in Word?',
        a: 'Close. Text and layout follow the document structure; unusual fonts that are not installed on your machine fall back to system fonts.',
      },
    ],
    related: ['pdf-to-word', 'image-to-pdf', 'merge-pdf'],
  },

  'image-to-pdf': {
    brief: [
      'Photographs, screenshots and scans are often easier to share and store as a single PDF. Image to PDF combines PNG, JPG and WebP images into one document, one per page, with control over page size and margins.',
    ],
    sections: [
      {
        heading: 'Proofing and archiving images',
        paragraphs: [
          'Combine a photo shoot into one shareable album, turn a set of scanned documents into a single file, or wrap a mobile scan taken photo-by-photo into one page order. Each image becomes one page so nothing gets cropped away.',
        ],
      },
      {
        heading: 'Choosing the page layout',
        paragraphs: [
          '"Match image size" keeps each image at its natural dimensions — best for photos and screenshots. A4 and US Letter scale images to fit the sheet, which suits printed documents and forms. You can also set a margin and choose whether each image fits the page or keeps its own size.',
        ],
      },
    ],
    tips: [
      'For a photo album to share, match the image size so nothing is cropped.',
      'For printed submissions, use A4 or Letter with a small margin.',
      'Add the images in the order you want — the final PDF follows your list.',
      'Reorder by dragging the file chips before exporting.',
    ],
    faq: [
      {
        q: 'Which image formats are supported?',
        a: 'PNG, JPG and WebP. The images are combined into a single PDF, one image per page.',
      },
      {
        q: 'Will my images be compressed?',
        a: 'No. Images are embedded at their original resolution, so the PDF keeps the full quality of your originals.',
      },
      {
        q: 'Where does this run?',
        a: 'Entirely in your browser — combine photos of documents privately without uploading them anywhere.',
      },
    ],
    related: ['pdf-to-jpg', 'merge-pdf', 'word-to-pdf'],
  },

  'watermark-pdf': {
    brief: [
      'Watermarks tell readers a document is confidential, branded or versioned before they even open the first page. Watermark PDF stamps diagonal or repeated text, a logo image and page numbers across your document — all inside your browser.',
    ],
    sections: [
      {
        heading: 'What you can add',
        paragraphs: [
          'Add a text watermark such as CONFIDENTIAL, DRAFT or a company name, with control over angle, opacity, size and colour. The stamp can sit diagonally across the page or repeat as a tiled pattern. You can also place a logo image on every page.',
          'Page numbers can be added in formats like 1, 2, 3 / 1 of 10 / — 1 —, positioned in the header or footer, with a custom starting number.',
        ],
      },
      {
        heading: 'When watermarks are genuinely useful',
        paragraphs: [
          'Sending a contract, bid, payslips or a design preview? A light "CONFIDENTIAL" watermark discourages casual forwarding and makes leaked copies traceable. Brands stamp repeat logos on white-label documents, and teams add draft markers so recipients do not mistake early versions for final ones.',
        ],
      },
    ],
    tips: [
      'Keep opacity low (around 15–25%) so the text underneath stays readable.',
      'For legal documents, place the watermark diagonally and repeat it on the page.',
      'Add page numbers when sharing multi-page contracts or reports for easy reference.',
    ],
    faq: [
      {
        q: 'Can I remove a watermark later?',
        a: 'Not from the exported file — the stamp becomes part of the pages. Set a low opacity if you want it easy to read but visually light.',
      },
      {
        q: 'Can I use my company logo as a watermark?',
        a: 'Yes, upload a logo image (PNG with transparency works best) and it is placed on every page at your chosen position.',
      },
      {
        q: 'Do page numbers count the original pages?',
        a: 'They number the exported pages of the document you uploaded; you can offset the start value if the PDF is part of a larger set.',
      },
    ],
    related: ['sign-pdf', 'protect-pdf', 'merge-pdf'],
  },

  'sign-pdf': {
    brief: [
      'Signing a PDF usually means printing, signing by hand and scanning it back — slow and messy. Sign PDF lets you draw a signature, type text, add highlights and stamp dates directly onto the file, then export a flat, ready-to-send document.',
    ],
    sections: [
      {
        heading: 'What the sign tool includes',
        paragraphs: [
          'Draw a signature with your mouse, finger or stylus in the built-in pad, or type your name in a font of your choice. Add highlight marks to flag clauses, place text notes, and stamp the date with the day you sign. Every element can be dragged into position and resized.',
          'When you export, all elements are flattened onto the PDF pages, so what you download is a plain document that opens identically in any viewer',
        ],
      },
      {
        heading: 'Signing a contract in a few steps',
        paragraphs: [
          'Upload the PDF, pick the page, and draw or add the elements you need. Position them exactly — signature on the signature line, date below it, highlights on the key paragraphs — then export the signed PDF and send it straight from your download folder.',
        ],
      },
    ],
    tips: [
      'Draw your signature in a single motion and keep it large in the pad; it stays legible when scaled down.',
      'Use the date stamp so a reviewer can see when the document was signed.',
      'Highlighting the clauses you actually accepted makes the document easier to review later.',
    ],
    faq: [
      {
        q: 'Is a drawn signature legally valid?',
        a: 'It depends on the context and jurisdiction. For day-to-day consent forms, internal approvals and most business documents, a name or drawn signature is fine. For documents where law requires a qualified electronic signature, use a certified provider.',
      },
      {
        q: 'Can I sign multiple pages?',
        a: 'Yes — switch between pages and place elements on each one, then export the whole document once.',
      },
      {
        q: 'What does "flatten" mean?',
        a: 'The signature and annotations are burned into the pages rather than kept as editable layers. The exported PDF is a plain document file with no interactive elements to tamper with.',
      },
    ],
    related: ['watermark-pdf', 'protect-pdf', 'merge-pdf'],
  },

  'protect-pdf': {
    brief: [
      'A password keeps a PDF from being opened, copied, printed or edited by anyone who does not have permission. Protect PDF encrypts your file with AES-256 directly in the browser, so the encryption happens locally and the password is never sent anywhere.',
    ],
    sections: [
      {
        heading: 'How password protection works',
        paragraphs: [
          'The tool encrypts the PDF using a user password required to open the document, and an optional owner password that controls the permissions — whether readers may print, copy text, edit or annotate. AES-256 encryption means a lost password cannot be recovered, so choose something you will not forget.',
        ],
      },
      {
        heading: 'What protections you can set',
        paragraphs: [
          'Tick printing, copying, editing and annotation permissions on or off from the start. A payslip that should only be viewed, a contract that must not be copied, or an invoice destined for finance are typical cases where restrictive permissions matter as much as the open password.',
        ],
      },
    ],
    tips: [
      'Use a strong open password and keep it in a password manager — there is no recovery route.',
      'Set the owner password separately when you want permissions to stay locked.',
      'Protect files before sending them in email; encrypted PDFs are also safer for cloud shares.',
    ],
    faq: [
      {
        q: 'Can the password be removed by someone else?',
        a: 'A correctly encrypted PDF cannot be opened without its password. Some consumer tools can strip weak old-style protection, which is why this tool uses AES-256.',
      },
      {
        q: 'What happens if I forget the password?',
        a: 'Your file cannot be recovered. Encrypt only copies you can afford to lock, and store the password somewhere safe.',
      },
      {
        q: 'Is the encryption performed on my device?',
        a: 'Yes — the AES-256 encryption runs in your browser, so the password and the file never touch a server.',
      },
    ],
    related: ['unlock-pdf', 'watermark-pdf', 'sign-pdf'],
  },

  'unlock-pdf': {
    brief: [
      'You might have a PDF you are allowed to use that still demands a password — an old report, a document protected before you were given it, or a file password-protected by a colleague who has since left. Unlock PDF removes the user password from a file you can open, so you can work with it freely or re-protect it yourself.',
    ],
    sections: [
      {
        heading: 'What Unlock PDF removes',
        paragraphs: [
          'Enter the password and the tool writes out a new PDF with the open password stripped but the page content intact. This is for documents you are authorised to open — you still need their password to unlock them at all.',
        ],
      },
      {
        heading: 'When it is not possible',
        paragraphs: [
          'Files using very modern encryption schemes, or documents whose permissions forbid it, are rejected with a clear message; re-export the file from your editor if the protection is your own and you need a clean copy.',
        ],
      },
    ],
    tips: [
      'Only remove protection from files you own or are authorised to open.',
      'After unlocking, re-protect the document how you want it and keep that password safe.',
      'A message about unsupported encryption usually means the file uses a format this browser build cannot decrypt — re-export it from the original source instead.',
    ],
    faq: [
      {
        q: 'Is unlocking legal?',
        a: 'Removing protection is lawful when you own the document or hold permission to modify it. Using it to bypass protection you do not control may violate the document owner\u2019s terms or local law.',
      },
      {
        q: 'Does unlocking harm the document?',
        a: 'No. The pages are rewritten in the clear; text and images remain intact.',
      },
      {
        q: 'Will it work on every protected PDF?',
        a: 'Most consumer-encrypted files unlock cleanly. Very new or unusual encryption schemes may not be readable by browser tools and return an explicit error.',
      },
    ],
    related: ['protect-pdf', 'sign-pdf', 'compress-pdf'],
  },

  'ocr-pdf': {
    brief: [
      'A scanned PDF is just a picture — you cannot search it, edit it, or copy text out of it. OCR PDF runs optical character recognition in your browser to pull real text out of scans and export it as plain text, a Word document or a searchable PDF.',
    ],
    sections: [
      {
        heading: 'How OCR works here',
        paragraphs: [
          'The tool runs Tesseract, a widely used OCR engine, entirely in your browser. You choose the document language — English, Arabic, Urdu, French, German or Spanish — and each scanned page is analysed to recover the words, their confidence, and their layout.',
        ],
      },
      {
        heading: 'What you can do with the result',
        paragraphs: [
          'Export plain text to reuse or republish, a Word document for editing, or a searchable PDF where the text layer sits invisibly behind the scan — letting you search and select words inside the original-looking page. Confidence scores tell you how reliable each page\u2019s recognition was.',
        ],
      },
      {
        heading: 'Getting the best recognition',
        paragraphs: [
          'Straight, well-lit, high-resolution scans recognise far more accurately than dark or tilted photos. 300 DPI is a good target. Printed text works far better than handwriting, and dense or artistic fonts reduce accuracy no matter which tool you use.',
        ],
      },
    ],
    tips: [
      'Scan at 300 DPI and keep pages straight for the best accuracy.',
      'Pick the exact document language — it dramatically improves letters such as Urdu and Arabic.',
      'Searchable PDF output is available for Latin scripts; export text or Word for Urdu/Arabic content.',
    ],
    faq: [
      {
        q: 'Does OCR understand handwriting?',
        a: 'Printed text recognises well; handwriting is unreliable because every writer is different. For handwritten notes, transcribe or use a specialist handwriting service.',
      },
      {
        q: 'Why is my scan not detected accurately?',
        a: 'Usually because of low resolution, a tilted page, or heavy shadows. Re-scan straight at 300 DPI and the accuracy jumps noticeably.',
      },
      {
        q: 'Are my scans uploaded for processing?',
        a: 'No. OCR runs locally through Tesseract.js, so sensitive scanned documents never leave your device.',
      },
    ],
    related: ['pdf-to-word', 'pdf-to-excel', 'pdf-to-jpg'],
  },
}