export interface ContentSection {
  heading: string
  paragraphs: string[]
}

export interface FaqEntry {
  q: string
  a: string
}

export interface ToolContent {
  brief: string[]
  sections: ContentSection[]
  tips: string[]
  faq: FaqEntry[]
  related: string[]
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  published: string
  updated: string
  readTime: string
  sections: ContentSection[]
  relatedTools: string[]
}