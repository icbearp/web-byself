export type ContentSource = { label: string; href: string };

export type PublishedTutorial = {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  content: string;
  sources: ContentSource[];
};

export type PublishedRecord = {
  id: string;
  date: string;
  category: string;
  stage?: string;
  tags: string[];
  title: string;
  summary?: string;
  paragraphs: string[];
  takeaway: string;
  content?: string;
  publishedAt?: string;
  updatedAt?: string;
  sources?: ContentSource[];
};

export type ChangelogItem = { date: string; title: string; detail: string };

export type SiteContent = {
  tutorials: PublishedTutorial[];
  records: PublishedRecord[];
  changelog: ChangelogItem[];
  source: "database" | "bundled";
};

export type EntryType = "tutorial" | "record";
export type EntryStatus = "draft" | "published";

/** 后台编辑使用的完整内容结构，对应 D1 的 entries 表。 */
export type AdminEntry = {
  type: EntryType;
  id: string;
  title: string;
  summary: string;
  category: string;
  stage: string | null;
  tags: string[];
  content: string;
  takeaway: string;
  sources: ContentSource[];
  date: string;
  status: EntryStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const recordCategoryOptions = [
  { key: "career-growth", label: "职场与选择" },
  { key: "life-efficiency", label: "生活效率" },
  { key: "side-project", label: "锦上添花的业余" },
] as const;
