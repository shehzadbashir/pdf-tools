import type { BlogPost } from './types.ts'

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-compress-a-pdf-that-is-too-large-for-email',
    title: 'How to compress a PDF that is too large for email',
    excerpt:
      'Email servers reject files over about 25 MB, and scanners love to produce them. Here is how to shrink a PDF in your browser in under a minute without losing readable quality.',
    published: '2026-09-18',
    updated: '2026-10-02',
    readTime: '4 min read',
    sections: [
      {
        heading: 'The 25 MB wall',
        paragraphs: [
          'Most email providers — Gmail, Outlook, Yahoo — cap attachments at roughly 25 MB. When your scanned contract is 40 MB, the send button quietly fails or your colleague receives a download link instead of the file. The fix is not re-scanning everything; it is compressing the PDF you already have.',
          'Why are scanned PDFs so big? A scanner stores every page as a high-resolution image. Ten pages of a 300 DPI scan can easily pass 30 MB even though the actual text is only a few pages worth. The images, not the content, are what you are paying for in file size.',
        ],
      },
      {
        heading: 'Compress, don\u2019t re-scan',
        paragraphs: [
          'Open the Compress PDF tool and drop your file. Pick "Balanced" for a first pass — it re-encodes the images and strips unused data (the same two things that make scans enormous) while keeping the text selectable. Most scans drop by 60–80%.',
          'If the result is still large, use "Strong". It pushes file size lower at the cost of some image sharpness, which is usually invisible on a screen. Only the original from your scanner keeps the print-grade 300 DPI quality, so keep that copy for printing and send the compressed one.',
        ],
      },
      {
        heading: 'When text PDFs barely shrink',
        paragraphs: [
          'Compression works by reducing image data. If your PDF is mostly text with no images, there is little to remove, and the tool will tell you rather than force a worse-looking file. In that case the file was already efficient, and the answer is splitting it — not fighting the compression.',
        ],
      },
      {
        heading: 'Email-friendly workflow in three steps',
        paragraphs: [
          'Compress the PDF in your browser. Confirm the reduced size shown next to the original. Then attach the smaller file to your email — no upload, no watermark, no account.',
        ],
      },
    ],
    relatedTools: ['compress-pdf', 'split-pdf', 'pdf-to-jpg'],
  },

  {
    slug: 'merge-pdfs-without-uploading-your-documents-anywhere',
    title: 'Merge PDFs without uploading your documents anywhere',
    excerpt:
      'Combining PDFs online usually means uploading sensitive documents to a stranger\u2019s server. Here is why merging in the browser is private by design — and a quick walkthrough.',
    published: '2026-09-22',
    updated: '2026-10-02',
    readTime: '4 min read',
    sections: [
      {
        heading: 'The privacy problem with most PDF sites',
        paragraphs: [
          'Most "free" PDF tools upload your file to their servers, process it there, and hand you a download link. That means your contract, payslip or medical record sat on a server you do not control, often in a queue with thousands of other files. You are trusting the operator\u2019s policy entirely.',
          'Stuff happens: breached servers, reused storage, terms that change overnight. Even when a site is honest, an uploaded document is a copy you can never take back.',
        ],
      },
      {
        heading: 'How browser-side merging works',
        paragraphs: [
          'The Merge PDF tool runs JavaScript inside your browser tab. When you pick your files, they are read locally from disk, combined locally, and written back as a download — the network is never involved with the document contents. This is the same technique behind document tools that advertise "100% client-side" processing.',
          'Concretely: no file upload form, no server queue, no processing time proportional to your traffic, and no copy of your document anywhere except on your own device.',
        ],
      },
      {
        heading: 'When privacy actually matters',
        paragraphs: [
          'Contracts under negotiation, bank statements, medical referrals, legal filings and payroll documents are the files you do not want floating on third-party storage. If a document would embarrass you to see published, it is exactly the one that should not be uploaded. Merging it in-browser keeps that rule automatic.',
        ],
      },
      {
        heading: 'Does browser-side mean slower?',
        paragraphs: [
          'Usually the opposite. There is no upload round-trip, so combining a few PDFs is effectively instant on a normal laptop, and you are not limited by a server\u2019s upload cap. The practical ceiling is your device memory — roughly 200 MB is comfortable.',
        ],
      },
    ],
    relatedTools: ['merge-pdf', 'split-pdf', 'organize-pdf'],
  },

  {
    slug: 'how-to-make-a-scanned-pdf-searchable-with-ocr',
    title: 'How to make a scanned PDF searchable with OCR',
    excerpt:
      'A scan is just a picture until you run OCR over it. Learn how to add a real text layer to scanned documents in the browser and get copyable, searchable content.',
    published: '2026-09-24',
    updated: '2026-10-02',
    readTime: '5 min read',
    sections: [
      {
        heading: 'Why a scan is not a document',
        paragraphs: [
          'Open a scanned PDF and press Ctrl+F: search finds nothing. Highlight a paragraph to copy it: nothing copies. That is because a scanner stores pixels, not words. To a computer, a scan is the same as a photograph of a page.',
          'OCR — optical character recognition — reads those pixels and recovers the text. Once a text layer exists you can search the document, copy quotes, or re-flow the content into another format.',
        ],
      },
      {
        heading: 'What OCR PDF does in your browser',
        paragraphs: [
          'The OCR PDF tool runs Tesseract, the open-source recognition engine, locally. You choose the language of the document — English, Arabic, Urdu, French, German or Spanish — and the engine examines each page, detects letter shapes, and recovers words along with a confidence score per page.',
          'You can export plain text, a Word document, or a searchable PDF where the recognised text sits invisibly behind the scan, so the page still looks original but words can be searched and selected.',
        ],
      },
      {
        heading: 'Scan better, recognise better',
        paragraphs: [
          'OCR accuracy starts at the scan. Straight, evenly lit pages at 300 DPI recognise almost perfectly. Flatbed scans beat phone photos because there is no glare or perspective distortion. Printed text works far better than handwriting, and simple fonts beat artistic ones.',
          'The confidence score tells you when to be suspicious: low numbers on a page mean you should look at the extracted text before relying on it.',
        ],
      },
      {
        heading: 'From searchable PDF to a usable document',
        paragraphs: [
          'A searchable scan is still a scan — the text is there, but the layout is fixed. To actually edit the content, export to Word after OCR, or convert the recognised text to Excel when it contains tables. Once OCR has run, the tools that need a text layer (conversion, editing) can finally do their job.',
        ],
      },
    ],
    relatedTools: ['ocr-pdf', 'pdf-to-word', 'pdf-to-excel'],
  },

  {
    slug: 'add-a-password-to-a-pdf-what-it-does-and-how',
    title: 'Add a password to a PDF: what it does and how to do it',
    excerpt:
      'Password protecting a PDF is not magic — it is encryption with specific limits. Here is what to expect, what permissions do, and a browser-based walkthrough.',
    published: '2026-09-28',
    updated: '2026-10-02',
    readTime: '4 min read',
    sections: [
      {
        heading: 'What "password protected" really means',
        paragraphs: [
          'A password-protected PDF is encrypted using a cipher — this tool uses AES-256, the same standard banks rely on. Without the password, the page content stays scrambled and no reader can build the pages. That is a hard guarantee of the technology, not a policy promise.',
          'The flip side is permanent: if you lose the password, the file is locked forever. There is no "forgot password" reset for a correctly encrypted document, because doing so would defeat the encryption.',
        ],
      },
      {
        heading: 'User password vs owner password',
        paragraphs: [
          'An open (user) password is what a reader must type to open the file at all. An owner password separately protects the permissions — whether the reader may print, copy text, edit or annotate. Setting both lets you hand a document to someone and say "read only, no copying", which works in PDF viewers that respect permissions.',
        ],
      },
      {
        heading: 'When protection is actually worth it',
        paragraphs: [
          'Protecting a payable invoice before email is good practice, and so is locking a signed contract or payslips sitting in a cloud folder. In every case, the password is only as strong as how you share it — sending the password in the same email as the file defeats the point, so hand it over separately.',
        ],
      },
      {
        heading: 'Doing it in the browser',
        paragraphs: [
          'On the Protect PDF page, upload the file, type the open password and choose the permissions you want to allow. The AES-256 encryption runs locally, so your password is never transmitted and the file never leaves your device. Download the encrypted copy and send it with confidence.',
        ],
      },
    ],
    relatedTools: ['protect-pdf', 'unlock-pdf', 'watermark-pdf'],
  },

  {
    slug: 'pdf-to-word-when-conversion-works-and-when-it-does-not',
    title: 'PDF to Word: when conversion works and when it doesn\u2019t',
    excerpt:
      'PDF to Word conversion is genuinely useful — when the source is a text document. Find out why designed layouts and scans misbehave, and how to handle each case.',
    published: '2026-09-30',
    updated: '2026-10-02',
    readTime: '5 min read',
    sections: [
      {
        heading: 'Why PDF to Word is not always exact',
        paragraphs: [
          'A PDF stores how a page looks, not the underlying document structure. There is no notion of "this is a heading" or "these four cells form a table" — there are just positioned words. A converter must guess that structure from the text layer and rebuild it as Word objects.',
          'That is why a plain report converts beautifully, while a designed magazine page with overlapping text boxes and inline images converts approximately. The information to reconstruct the design perfectly is simply not in the file.',
        ],
      },
      {
        heading: 'Text documents convert great',
        paragraphs: [
          'Reports, essays, letters, manuals, CVs, and simple forms are built from paragraphs and standard headings — exactly what the structure-rebuilder does well. Text becomes editable text, lists become real lists, and tables are reconstructed as table cells you can type into.',
        ],
      },
      {
        heading: 'The two problem cases',
        paragraphs: [
          'Scans: a scanned PDF has no text layer at all, so there is nothing for the converter to read. Run OCR first, then convert the recognised document to Word.',
          'Design layouts: brochures, newsletters and slides-with-overlap may convert awkwardly. Use the faithful mode, which exports the pages as images inside the Word file, when appearance matters more than editability.',
        ],
      },
      {
        heading: 'A practical conversion flow',
        paragraphs: [
          'Check whether the PDF has real text — press Ctrl+F and search for a common word. If it matches, convert to editable Word directly. If nothing matches, run OCR PDF first, then convert. This two-step habit solves most "my conversion came out blank" complaints.',
        ],
      },
    ],
    relatedTools: ['pdf-to-word', 'ocr-pdf', 'word-to-pdf'],
  },

  {
    slug: 'the-complete-guide-to-signing-pdfs-online',
    title: 'The complete guide to signing PDFs online',
    excerpt:
      'Everything you need to sign a PDF without a printer: drawing a signature, adding text and highlights, date stamps, and what "flattening" actually means.',
    published: '2026-10-01',
    updated: '2026-10-02',
    readTime: '5 min read',
    sections: [
      {
        heading: 'The old way is still the slow way',
        paragraphs: [
          'Print the PDF, sign by hand, scan it back, email the scan. That ritual takes minutes per document, needs a printer and scanner, and produces a lower-quality file than you started with. Signing in the browser removes the round trip entirely: open the file, draw your signature, export, send.',
        ],
      },
      {
        heading: 'Draw, type, highlight, stamp',
        paragraphs: [
          'The Sign PDF tool gives you four elements. Draw uses a signature pad for a handwritten-style signature with a mouse, finger or stylus. Type places your name or a note in text. Highlight marks clauses you want a reader to notice, and the date stamp records the signing day so the trail is visible.',
          'Every element can be dragged into place and resized, so your signature lands on the signature line instead of floating in a margin.',
        ],
      },
      {
        heading: 'Does flattening matter?',
        paragraphs: [
          'When you export, the signature and annotations are flattened — drawn into the page itself rather than kept as a removable layer. The result is a plain PDF that looks identical in every viewer and cannot have its signature casually lifted off. That is what you want to send.',
        ],
      },
      {
        heading: 'When a drawn signature is not enough',
        paragraphs: [
          'For consent forms, approvals, NDAs and most everyday business documents, a typed or drawn signature is routine and accepted. Where the law demands a qualified electronic signature — certain government filings, for example — use a certified e-signature provider. Know which of the two you need before you sign, and keep a copy of the flattened file for your records.',
        ],
      },
    ],
    relatedTools: ['sign-pdf', 'watermark-pdf', 'protect-pdf'],
  },
]

export function postBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}