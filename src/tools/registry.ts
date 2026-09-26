import { lazy, type ComponentType } from 'react'
import {
  Combine,
  Droplets,
  FileType,
  Images,
  LayoutGrid,
  Lock,
  LockOpen,
  Minimize2,
  PenTool,
  Scissors,
  ScanText,
  Table2,
  Type as TypeIcon,
  Image as ImageIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ToolSlug } from '@/config/site'

export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security'

export interface ToolDefinition {
  slug: ToolSlug
  path: string
  category: ToolCategory
  icon: LucideIcon
  /** Extra search words that do not appear in the translated copy. */
  keywords: string[]
  component: ComponentType
}

export const TOOLS: ToolDefinition[] = [
  {
    slug: 'merge-pdf',
    path: '/merge-pdf',
    category: 'organize',
    icon: Combine,
    keywords: ['join', 'combine', 'unite', 'merger', 'مریج', 'دمج'],
    component: lazy(() => import('./pages/MergePdf')),
  },
  {
    slug: 'split-pdf',
    path: '/split-pdf',
    category: 'organize',
    icon: Scissors,
    keywords: ['extract', 'separate', 'cut', 'divide', 'اسپلٹ', 'تقسيم'],
    component: lazy(() => import('./pages/SplitPdf')),
  },
  {
    slug: 'organize-pdf',
    path: '/organize-pdf',
    category: 'organize',
    icon: LayoutGrid,
    keywords: ['reorder', 'rotate', 'delete', 'pages', 'ترتيب', 'تدوير'],
    component: lazy(() => import('./pages/OrganizePdf')),
  },
  {
    slug: 'compress-pdf',
    path: '/compress-pdf',
    category: 'organize',
    icon: Minimize2,
    keywords: ['shrink', 'reduce', 'smaller', 'optimize', 'ضغط', 'تصغير'],
    component: lazy(() => import('./pages/CompressPdf')),
  },
  {
    slug: 'pdf-to-word',
    path: '/pdf-to-word',
    category: 'convert',
    icon: FileType,
    keywords: ['docx', 'doc', 'convert', 'edit text', 'وورد', 'كلمة'],
    component: lazy(() => import('./pages/PdfToWord')),
  },
  {
    slug: 'pdf-to-excel',
    path: '/pdf-to-excel',
    category: 'convert',
    icon: Table2,
    keywords: ['xlsx', 'spreadsheet', 'table', 'csv', 'ايكسل', 'جدول'],
    component: lazy(() => import('./pages/PdfToExcel')),
  },
  {
    slug: 'pdf-to-jpg',
    path: '/pdf-to-jpg',
    category: 'convert',
    icon: ImageIcon,
    keywords: ['png', 'image', 'photo', 'render', 'صور', 'صورة'],
    component: lazy(() => import('./pages/PdfToJpg')),
  },
  {
    slug: 'word-to-pdf',
    path: '/word-to-pdf',
    category: 'convert',
    icon: TypeIcon,
    keywords: ['docx', 'doc', 'office', 'convert', 'تحويل', 'وورد'],
    component: lazy(() => import('./pages/WordToPdf')),
  },
  {
    slug: 'image-to-pdf',
    path: '/image-to-pdf',
    category: 'convert',
    icon: Images,
    keywords: ['jpg', 'png', 'photo', 'scan', 'صور', 'تحويل'],
    component: lazy(() => import('./pages/ImageToPdf')),
  },
  {
    slug: 'watermark-pdf',
    path: '/watermark-pdf',
    category: 'edit',
    icon: Droplets,
    keywords: ['stamp', 'confidential', 'page numbers', 'brand', 'علامة', 'ترقيم'],
    component: lazy(() => import('./pages/WatermarkPdf')),
  },
  {
    slug: 'sign-pdf',
    path: '/sign-pdf',
    category: 'edit',
    icon: PenTool,
    keywords: ['signature', 'esign', 'annotate', 'highlight', 'توقيع', 'تعليق'],
    component: lazy(() => import('./pages/SignPdf')),
  },
  {
    slug: 'protect-pdf',
    path: '/protect-pdf',
    category: 'security',
    icon: Lock,
    keywords: ['password', 'encrypt', 'aes', 'secure', 'حماية', 'كلمة مرور'],
    component: lazy(() => import('./pages/ProtectPdf')),
  },
  {
    slug: 'unlock-pdf',
    path: '/unlock-pdf',
    category: 'security',
    icon: LockOpen,
    keywords: ['remove password', 'decrypt', 'unlock', 'فك', ' فتح'],
    component: lazy(() => import('./pages/UnlockPdf')),
  },
  {
    slug: 'ocr-pdf',
    path: '/ocr-pdf',
    category: 'security',
    icon: ScanText,
    keywords: ['scan', 'recognise', 'recognize', 'text', 'searchable', 'مسح ضوئي', 'تعرّف'],
    component: lazy(() => import('./pages/OcrPdf')),
  },
]

export function toolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

export const CATEGORY_ORDER: ToolCategory[] = ['organize', 'convert', 'edit', 'security']
