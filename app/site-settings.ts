// 首页可在后台维护的设置：主页信息、联系方式、成长之路。
// 服务端保存前和页面读取时都经过 normalize，保证结构完整、链接安全。

export type JourneyStatus = "起点" | "进行中" | "持续迭代" | "已完成" | "已离开" | "已止损" | "暂停";

export const journeyStatuses: JourneyStatus[] = ["进行中", "持续迭代", "已完成", "起点", "已离开", "已止损", "暂停"];

export type HomeSettings = {
  badge: string;
  name: string;
  focusWords: string[];
  motto: string;
  stickers: string[];
  avatar: string | null;
};

export type ContactItem = {
  id: string;
  label: string;
  value: string;
  href: string;
  image: string | null;
  hero: boolean;
};

export type JourneyItem = {
  id: string;
  date: string;
  title: string;
  copy: string;
  tags: string[];
  status: JourneyStatus;
};

export type SiteSettings = {
  home: HomeSettings;
  contacts: ContactItem[];
  journey: JourneyItem[];
};

export type SettingsKey = keyof SiteSettings;
export const settingsKeys: SettingsKey[] = ["home", "contacts", "journey"];

export const defaultSettings: SiteSettings = {
  home: {
    badge: "2026 届毕业生 · 熊奇主理人",
    name: "周多福",
    focusWords: ["AI 动效视频", "品牌创业", "自媒体", "Web3 研究"],
    motto: "毕业这一年，我选择先去做：把想法变成产品，把经历写成方法。",
    stickers: ["为自己，向未知出发", "BUILD IN PUBLIC", "从 0 到 1", "KEEP SHIPPING"],
    avatar: null,
  },
  // 二维码图片存在数据库里，默认值只保留文字链接；实际内容以后台“联系方式”为准。
  contacts: [
    { id: "xiaohongshu", label: "小红书", value: "191425657", href: "https://xhslink.cn/o/HRPUJWPjPg", image: null, hero: true },
    { id: "email", label: "邮箱", value: "otafukuchau@gmail.com", href: "mailto:otafukuchau@gmail.com", image: null, hero: true },
    { id: "x", label: "X", value: "@Otafuku1315", href: "https://x.com/Otafuku1315", image: null, hero: false },
    { id: "linkedin", label: "领英", value: "junxuuchow", href: "https://www.linkedin.com/in/junxuuchow", image: null, hero: false },
    { id: "phone", label: "电话", value: "15993551315", href: "tel:15993551315", image: null, hero: false },
  ],
  journey: [
    { id: "crypto", date: "2025.12 起", title: "加密市场研究", copy: "还在学校时开始用 Python 写交易信号和评分脚本，前后迭代了 16 代；后来做成链上预测市场工作台，只做只读核验和纸面前向测试。它让我学会了用数据验证想法，也清楚它还只是个人测试，不能商用。", tags: ["Python", "回测与前向测试", "链上数据", "风险边界"], status: "持续迭代" },
    { id: "graduate", date: "2026.06", title: "大学毕业", copy: "赶上了很多人说的最难的求职季。同学们有的求稳，有的在努力上岸，我想试试另一条路。", tags: ["2026 届", "重新选择"], status: "起点" },
    { id: "advisor", date: "2026.07 — 08", title: "蔚来 · 乐道 销售顾问", copy: "两个月里接待用户、陪同试驾、跟进交付，也看清了这套体系和自己想要的成长并不一致，于是果断离开，准备做自己的事。", tags: ["一线销售", "用户沟通", "看清边界"], status: "已离开" },
    { id: "media", date: "2026.08 起", title: "开始做自媒体", copy: "借助 ChatGPT 和各种 AI 技能不断试错，在小红书、领英、公众号、币安广场和 X 运营账号，定位 AI、金融、Web3 和职场。", tags: ["小红书", "领英", "公众号", "币安广场", "X"], status: "进行中" },
    { id: "company", date: "2026.09", title: "做公司，立品牌", copy: "注册了自己的公司，完成商标、品牌与服务的搭建：品牌“熊奇 / BEAR UP”，主张“为自己，向未知出发”，标志设计和公司官网也一并完成。", tags: ["公司注册", "商标", "品牌", "服务", "官网"], status: "进行中" },
    { id: "ceramics", date: "2026.09", title: "去景德镇做瓷器", copy: "跑到景德镇找货源，为万花杯等商品做透光写实的商品图，开起淘宝店。后来商家的货品和发货无法继续配合，运营又在持续烧钱，于是及时止损。", tags: ["景德镇", "淘宝店", "商品图", "供应链"], status: "已止损" },
    { id: "bearup", date: "2026.10", title: "BEARUP 袜子品牌", copy: "转向袜子：运动、商务、休闲三个系列的自有品牌。商标、货源、透明袋与抽拉盒包装、行动书签、给厂家的打样文件和 60 秒品牌故事片，都自己跑完。", tags: ["自有品牌", "包装设计", "打样", "品牌片"], status: "进行中" },
    { id: "subscription", date: "2026.10", title: "海外会员代订阅", copy: "搭了一个订阅商店，代订阅国外的 AI 会员服务：多种付款方式、订单查询、人工核款和自己的商家后台。", tags: ["订阅商店", "支付核款", "商家后台"], status: "进行中" },
    { id: "ai-video", date: "现在进行时", title: "AI 动效视频跑通", copy: "摸索出一条稳定的生产流程：AI 主播口播、信息动效模组、剪映合成，可以按需求持续产出带动效的视频，开始承接商务合作。", tags: ["AI 主播", "动效模组", "剪映", "商务合作"], status: "进行中" },
  ],
};

const MEDIA_PATTERN = /^\/api\/media\/[a-z0-9-]{8,64}$/;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value) ? value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems) : [];
}

function image(value: unknown) {
  const path = text(value, 120);
  return MEDIA_PATTERN.test(path) ? path : null;
}

function slug(value: unknown, fallback: string) {
  const id = text(value, 60).toLowerCase().replace(/[^a-z0-9-]/g, "");
  return id || fallback;
}

/** 只允许 https/http、邮件和电话链接；未填写时按内容自动推断，推断不出就不加链接。 */
export function safeHref(href: unknown, value: unknown) {
  const raw = text(href, 500);
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  if (raw) return "";
  const content = text(value, 200);
  if (/^https?:\/\//i.test(content)) return content;
  if (/^\S+@\S+\.\S+$/.test(content)) return `mailto:${content}`;
  if (/^\+?[\d\s-]{6,20}$/.test(content)) return `tel:${content.replace(/[\s-]/g, "")}`;
  return "";
}

export function normalizeHome(input: unknown): HomeSettings {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const fallback = defaultSettings.home;
  const focusWords = list(source.focusWords, 6, 16);
  return {
    badge: text(source.badge, 40) || fallback.badge,
    name: text(source.name, 12) || fallback.name,
    focusWords: focusWords.length ? focusWords : fallback.focusWords,
    motto: text(source.motto, 80),
    stickers: list(source.stickers, 4, 24),
    avatar: image(source.avatar),
  };
}

export function normalizeContacts(input: unknown): ContactItem[] {
  if (!Array.isArray(input)) return defaultSettings.contacts;
  let heroSlots = 2;
  return input.slice(0, 12).map((raw, index) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const value = text(item.value, 200);
    return {
      id: slug(item.id, `contact-${index + 1}`),
      label: text(item.label, 20),
      value,
      href: safeHref(item.href, value),
      image: image(item.image),
      hero: item.hero === true,
    };
  }).filter((item) => item.label && (item.value || item.image)).map((item) => {
    // 首屏只放得下 2 张联系卡片，超出的按顺序取消。
    if (!item.hero) return item;
    if (heroSlots > 0) {
      heroSlots -= 1;
      return item;
    }
    return { ...item, hero: false };
  });
}

export function normalizeJourney(input: unknown): JourneyItem[] {
  if (!Array.isArray(input)) return defaultSettings.journey;
  return input.slice(0, 40).map((raw, index) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const status = journeyStatuses.includes(item.status as JourneyStatus) ? item.status as JourneyStatus : "进行中";
    return {
      id: slug(item.id, `step-${index + 1}`),
      date: text(item.date, 24),
      title: text(item.title, 40),
      copy: text(item.copy, 400),
      tags: list(item.tags, 8, 16),
      status,
    };
  }).filter((item) => item.title);
}

export function normalizeSetting(key: SettingsKey, value: unknown) {
  if (key === "home") return normalizeHome(value);
  if (key === "contacts") return normalizeContacts(value);
  return normalizeJourney(value);
}
