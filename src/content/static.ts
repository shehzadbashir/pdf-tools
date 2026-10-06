import type { ContentSection } from './types.ts'

export const CONTACT_EMAIL = 'contact@shehzadbashir.xyz'

export const ABOUT: ContentSection[] = [
  {
    heading: 'What this site is',
    paragraphs: [
      'PDF Tools is a free collection of PDF utilities: merge, split, compress, convert, sign, protect and OCR, all running directly in your browser. There is no account required, no watermark, and no waiting in a processing queue.',
    ],
  },
  {
    heading: 'Why we built it',
    paragraphs: [
      'Most PDF websites work by uploading your documents to their servers, which means your confidential files sit on a machine you do not control. We built this toolkit so the same jobs can be done privately: the code runs on your own device, your files are read locally, and the finished document is written only to your own disk. For contracts, payslips and medical documents, that difference matters.',
    ],
  },
  {
    heading: 'How it is made',
    paragraphs: [
      'The tools are built with open web standards: our own TypeScript components for the interface, backed by widely used open-source libraries such as pdf-lib for document construction, pdf.js for page rendering and unpacking, mammoth and xlsx for Office formats, and Tesseract for OCR. Because everything ships as static pages with serverless helpers, the site stays fast, cheap and largely offline-capable. A file processed here never requires a server to hold it.',
    ],
  },
  {
    heading: 'Our commitment',
    paragraphs: [
      'We do not save your files, we do not sell your files, and none of the tools add branding or watermarks to the output. When advertising is present it is clearly labelled, and your documents are never used as advertorial-adjacent content. If you have a question or a suggestion, we would like to hear it — reach out via the contact page.',
    ],
  },
]

export const CONTACT_INTRO: string[] = [
  'Questions about a tool, a suggestion, or spotted something broken? Use the address below. For privacy, please do not attach actual documents to enquiries — describe what went wrong instead.',
  'For anything related to copyright or reporting abusive content, use the DMCA page rather than this address so it reaches the right person quickly.',
]

export const DMCA_SECTIONS: ContentSection[] = [
  {
    heading: 'Reporting copyright infringement',
    paragraphs: [
      'We respect the intellectual property rights of others and take copyright seriously. If you believe that material on this site infringes your copyright, please send a notice to the contact address with the following information.',
    ],
  },
  {
    heading: 'What to include in a notice',
    paragraphs: [
      'A description of the copyrighted work you claim is infringed, the exact URL(s) of the material, your contact details, a statement that you have a good-faith belief the use is not authorised by the owner, and a statement, under penalty of perjury, that the information in your notice is accurate and that you are the owner or authorised to act on the owner\u2019s behalf. A signature (physical or electronic) of the rights holder completes the notice.',
    ],
  },
  {
    heading: 'What happens next',
    paragraphs: [
      'We will review the notice, remove or disable access to material that is clearly infringing, and contact the party who posted it. Valid, complete notices are processed promptly.',
    ],
  },
]

export const DMCA_NOTES: string[] = [
  'This site processes files locally on your device. We do not host or store user documents, so most copyright enquiries concern text, images or logos appearing in the site itself rather than processed files.',
  'Abusive or knowingly false takedown requests may lead to legal liability for the sender under applicable law.',
]