"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TutorialBody } from "./content-body";
import type { PublishedRecord, PublishedTutorial, SiteContent } from "./content-types";
import { ContentDiscussion, type AuthUser } from "./discussion";
import { BeijingClock, HeroArt } from "./hero-art";
import { useReveal, useWorkspaceTransition } from "./motion";

type WorkspaceKey = "home" | "tutorials" | "records";
type Tone = "sky" | "lilac" | "mint";
type ColumnKey = "tools" | "efficiency" | "information" | "life";
type RecordCategoryKey = "career-growth" | "life-efficiency" | "side-project";
type FeedbackType = "suggestion" | "question" | "experience" | "cooperation";

export const workspacePaths: Record<WorkspaceKey, string> = { home: "/", tutorials: "/tutorials", records: "/records" };

function workspaceFromPath(pathname: string): WorkspaceKey {
  const match = (Object.entries(workspacePaths) as Array<[WorkspaceKey, string]>).find(([key, path]) => key !== "home" && (pathname === path || pathname.startsWith(`${path}/`)));
  return match?.[0] ?? "home";
}

// 首页是一条从上到下的个人主页流程；教程和记录内容多，单独成页。
const navItems: Array<{ label: string; workspace: WorkspaceKey; target: string; href: string }> = [
  { label: "首页", workspace: "home", target: "top", href: "/" },
  { label: "内容", workspace: "home", target: "content", href: "/#content" },
  { label: "经历", workspace: "home", target: "journey", href: "/#journey" },
  { label: "教程", workspace: "tutorials", target: "top", href: "/tutorials" },
  { label: "记录", workspace: "records", target: "top", href: "/records" },
  { label: "合作", workspace: "home", target: "services", href: "/#services" },
  { label: "联系", workspace: "home", target: "contact", href: "/#contact" },
];

// 首页各区块对应的导航项：三件事算“首页”，致访客的信算“联系”。
const HOME_ANCHORS: Record<string, string> = { top: "top", doing: "top", content: "content", journey: "journey", services: "services", letter: "contact", contact: "contact" };

const profile = {
  name: "周多福",
  role: "2026 届毕业生 · 一人公司实践者",
  intro: "我把真实经历、个人判断和实用方法整理成一间长期更新的个人工作室。这里不代表任何品牌，内容尽量给出步骤、口径和来源，帮你自己完成判断。",
  promise: ["先去行动，再谈完美", "小步测试，及时止损", "把走过的路写下来"],
};

const contactMethods = [
  { label: "小红书号", value: "191425657", href: "https://www.xiaohongshu.com/user/profile/191425657", external: true },
  { label: "邮箱", value: "otafukuchau@gmail.com", href: "mailto:otafukuchau@gmail.com", external: false },
  { label: "电话", value: "15993551315", href: "tel:15993551315", external: false },
];

const focusWords = ["AI 动效视频", "品牌创业", "自媒体", "Web3 研究"];

const heroStickers = ["为自己，向未知出发", "BUILD IN PUBLIC", "一个人的公司", "KEEP SHIPPING"];

const tickerItems = ["AI 动效视频", "熊奇 · BEAR UP", "自媒体矩阵", "会员代订阅", "网站搭建", "为自己，向未知出发", "BUILD IN PUBLIC"];

const doing: Array<{ en: string; title: string; copy: string; cta: string; workspace: WorkspaceKey; target?: string }> = [
  { en: "create", title: "做视频", copy: "AI 主播口播加信息动效，一条流程稳定产出讲解视频，可以承接商务合作。", cta: "看合作", workspace: "home", target: "services" },
  { en: "build", title: "做品牌", copy: "熊奇 / BEAR UP：公司注册、商标、货源、包装和官网，全部自己跑了一遍。", cta: "看经历", workspace: "home", target: "journey" },
  { en: "share", title: "做内容", copy: "AI、金融、Web3 与职场，在多个平台持续输出，也把方法写成教程和记录。", cta: "看内容", workspace: "home", target: "content" },
];

type JourneyStatus = "起点" | "已离开" | "持续迭代" | "已止损" | "进行中";

// 成长之路：日期均来自项目文件的实际时间，后续有新进展直接在这里追加。
const journey: Array<{ date: string; title: string; copy: string; tags: string[]; status: JourneyStatus }> = [
  { date: "2025.12 起", title: "加密市场研究", copy: "还在学校时开始用 Python 写交易信号和评分脚本，前后迭代了 16 代；后来做成链上预测市场工作台，只做只读核验和纸面前向测试。它让我学会了用数据验证想法，也清楚它还只是个人测试，不能商用。", tags: ["Python", "回测与前向测试", "链上数据", "风险边界"], status: "持续迭代" },
  { date: "2026.06", title: "大学毕业", copy: "赶上了很多人说的最难的求职季。同学们有的求稳，有的在努力上岸，我想试试另一条路。", tags: ["2026 届", "重新选择"], status: "起点" },
  { date: "2026.07 — 08", title: "蔚来 · 乐道 销售顾问", copy: "两个月里接待用户、陪同试驾、跟进交付，也看清了这套体系和自己想要的成长并不一致，于是果断离开，准备做自己的事。", tags: ["一线销售", "用户沟通", "看清边界"], status: "已离开" },
  { date: "2026.08 起", title: "开始做自媒体", copy: "借助 ChatGPT 和各种 AI 技能不断试错，在小红书、领英、公众号、币安广场和 X 运营账号，定位 AI、金融、Web3 和职场。", tags: ["小红书", "领英", "公众号", "币安广场", "X"], status: "进行中" },
  { date: "2026.09", title: "注册公司，做出品牌", copy: "注册杭州熊奇电子商务有限公司，写完商业计划书和创业担保贷款方案，定下品牌“熊奇 / BEAR UP”和主张“为自己，向未知出发”，完成标志设计、商标初检和公司官网。", tags: ["公司注册", "商业计划书", "品牌战略", "商标", "官网"], status: "进行中" },
  { date: "2026.09", title: "去景德镇做瓷器", copy: "跑到景德镇找货源，为万花杯等商品做透光写实的商品图，开起淘宝店。后来商家的货品和发货无法继续配合，运营又在持续烧钱，于是及时止损。", tags: ["景德镇", "淘宝店", "商品图", "供应链"], status: "已止损" },
  { date: "2026.10", title: "BEARUP 袜子品牌", copy: "转向袜子：运动、商务、休闲三个系列的自有品牌。商标、货源、透明袋与抽拉盒包装、行动书签、给厂家的打样文件和 60 秒品牌故事片，都自己跑完。", tags: ["自有品牌", "包装设计", "打样", "品牌片"], status: "进行中" },
  { date: "2026.10", title: "海外会员代订阅", copy: "搭了一个订阅商店，代订阅国外的 AI 会员服务：多种付款方式、订单查询、人工核款和自己的商家后台。", tags: ["订阅商店", "支付核款", "商家后台"], status: "进行中" },
  { date: "现在进行时", title: "AI 动效视频跑通", copy: "摸索出一条稳定的生产流程：AI 主播口播、信息动效模组、剪映合成，可以按需求持续产出带动效的视频，开始承接商务合作。", tags: ["AI 主播", "动效模组", "剪映", "商务合作"], status: "进行中" },
];

const services: Array<{ tone: Tone; tag: string; title: string; copy: string; fit: string; deliver: string; proof: string }> = [
  { tone: "sky", tag: "已跑通", title: "AI 动效视频定制", copy: "AI 主播口播 + 信息动效 + 剪辑合成，适合产品讲解、知识科普和品牌短片。", fit: "需要持续产出讲解类视频的品牌、机构与个人", deliver: "分镜脚本、竖屏 / 横屏成片、可复用的动效模组", proof: "75 秒产品讲解样片与 5 段动效模组（自制样片）" },
  { tone: "lilac", tag: "亲身走完", title: "品牌从 0 到 1", copy: "公司注册、商业计划书、品牌战略、标志与商标初检、包装和打样，我自己的品牌全部走过一遍。", fit: "准备创业的大学生、想做自有品牌的小商家", deliver: "品牌定位与故事、视觉与包装方案、打样说明", proof: "熊奇 / BEARUP 战略路线图、商业计划书、三系列包装" },
  { tone: "mint", tag: "可上线", title: "网站与工具搭建", copy: "个人主页、品牌官网、订阅商店和内容后台，从设计到上线，带后台和安全加固。", fit: "需要一个能长期维护网站的个人与小团队", deliver: "可在线编辑的网站、部署与使用说明", proof: "本站、熊奇公司官网、会员订阅商店" },
  { tone: "sky", tag: "多平台", title: "内容与自媒体合作", copy: "在小红书、领英、公众号、币安广场和 X 输出 AI、金融、Web3 与职场内容。", fit: "AI 工具、金融科技、Web3 项目与职场类品牌", deliver: "测评、教程、联合内容与多平台分发", proof: "五个平台账号持续运营" },
  { tone: "lilac", tag: "在营业", title: "海外会员代订阅", copy: "代订阅国外 AI 会员服务，多种付款方式，订单可查询，人工核款。", fit: "需要海外 AI 工具但付款不便的个人与团队", deliver: "订阅开通与订单查询", proof: "自建订阅商店与商家后台" },
  { tone: "mint", tag: "自有品牌", title: "BEARUP 袜子团购与定制", copy: "运动、商务、休闲三个系列，可做团购、企业礼品和渠道合作。", fit: "企业礼品、运动社团、渠道与店铺", deliver: "现货供应、组合礼盒与包装定制", proof: "商标、货源与包装打样均已完成" },
];

const cooperationSteps = [
  { title: "沟通需求", copy: "说清目标、预算和时间" },
  { title: "方案与报价", copy: "给出范围、交付物和价格" },
  { title: "样片 / 打样", copy: "先做小样，确认方向" },
  { title: "交付与复盘", copy: "按约交付，一起看效果" },
];

const letter = [
  "今年六月，我从大学毕业，赶上了很多人说的最难的一年。在蔚来乐道做了两个月顾问之后，我发现那条路和我想要的成长并不一致，于是选择离开，开始做自己的事。",
  "这几个月我试了很多：研究加密市场、运营自媒体、注册公司、去景德镇找瓷器、做自己的袜子品牌、搭订阅商店，也跑通了 AI 动效视频。有的成了，有的及时止损了，但每一步都让我更清楚自己能做什么。",
  "身边的同学有的安稳，有的在努力，我只是想试试另一种可能：为自己，向未知出发。如果你也在路上，或者有可以一起做的事，欢迎来聊。",
];

const recordCollections: Array<{ key: RecordCategoryKey; tone: Tone; label: string; title: string; intro: string }> = [
  { key: "career-growth", tone: "sky", label: "职场与选择", title: "看清边界，也为下一段路积累能力", intro: "真实职场、劳动权益、沟通方法、离开与重新开始，让选择建立在事实和长期生活之上。" },
  { key: "life-efficiency", tone: "mint", label: "生活效率", title: "让工具真正减少重复消耗", intro: "AI、信息整理、资料检索、自动化和日常工作流，让效率工具变成可落地的生活能力。" },
  { key: "side-project", tone: "lilac", label: "锦上添花的业余", title: "把兴趣和生活质感慢慢放进来", intro: "阅读、旅行、审美、业余项目和灵感收藏，不一定立刻变现，但让生活更丰富。" },
];

const columns: Array<{ key: ColumnKey; label: string }> = [
  { key: "tools", label: "拆解问题" },
  { key: "efficiency", label: "AI 效率" },
  { key: "information", label: "信息获取" },
  { key: "life", label: "生活建议" },
];

const articles: Array<{ id: string; column: ColumnKey; title: string; excerpt: string; body: string; points: string[] }> = [
  {
    id: "problem-to-proof",
    column: "tools",
    title: "怎样把一个复杂问题拆成可验证的步骤？",
    excerpt: "先定义想得到的结果，再把事实、假设和行动分开。",
    body: "复杂问题常常不是缺少答案，而是多个口径混在一起。先写清目标与限制，再分别收集事实、标记假设、做出判断，最后列出下一步；每一层都能单独检查，结论才更可靠。",
    points: ["用一句话定义问题和需要的输出", "把已经确认的事实与暂时假设分开", "让每个结论都有来源，让每个行动都有下一步"],
  },
  {
    id: "ai-workflow",
    column: "efficiency",
    title: "AI 工具不是魔法，是把重复思考流程化。",
    excerpt: "真正省时间的不是多装几个工具，而是把重复任务拆成可以复用的步骤。",
    body: "一个好工作流通常从问题模板开始：输入什么、判断什么、输出什么、最后由谁确认。工具只是放大器，真正需要沉淀的是自己的判断标准。",
    points: ["先把重复任务写成固定输入格式", "让 AI 先整理和比较，再由人做最后判断", "把有效提示词和检查清单保存成自己的小库"],
  },
  {
    id: "information-judgment",
    column: "information",
    title: "信息差会赚钱，也会让人做错决定。",
    excerpt: "看见更多信息不等于判断更好，来源、时间、利益关系和证据都要一起看。",
    body: "我更愿意把信息获取当成一套生活习惯：找到原始来源，检查发布时间，分开事实与观点，再决定要不要转发或行动。",
    points: ["优先找原始资料和官方页面", "给价格、政策和产品信息标注时间", "重要决定至少交叉核对两个独立来源"],
  },
  {
    id: "life-compound",
    column: "life",
    title: "普通人的复利，来自好好选择。",
    excerpt: "选择并不总是宏大的方向，很多时候是今天少消耗一点，明天多积累一点。",
    body: "关系、金钱、工作和身体都需要长期经营。好的选择不是永远选最贵或最快，而是选一个自己能够持续执行、几年后仍然愿意承担的方案。",
    points: ["把想要的生活拆成可以执行的小动作", "用长期成本而不是一时情绪做决定", "给重要关系和自己的时间留出余量"],
  },
];

const efficiencyNotes = [
  { id: "meeting", title: "把一次沟通变成可追踪的结果", summary: "会前列目标，会中记录决定，会后只保留下一步和负责人。", steps: ["先写清楚这次沟通必须得到的一个结果", "把讨论内容分成事实、判断和待确认", "结束前确认下一步、时间和责任人"] },
  { id: "reading", title: "把长资料读成自己的判断卡片", summary: "不追求记住全部内容，只留下结论、证据、适用条件和疑问。", steps: ["先看目录、结论和数据出处", "用四句话记录核心观点与限制", "把能影响自己行动的部分单独标出来"] },
  { id: "weekly", title: "每周一次轻量复盘", summary: "用 20 分钟回看本周做过的决定，找出最值得保留的一条经验。", steps: ["列出本周三个已经完成的动作", "记录一个反复消耗时间的问题", "决定下周只优化一个环节"] },
];

const collectionLabel = (key: string) => recordCollections.find((item) => item.key === key)?.label ?? "随心记录";
const pad = (value: number) => String(value).padStart(2, "0");

function PageHeader({ tone, eyebrow, title, lead, meta }: { tone: Tone; eyebrow: string; title: ReactNode; lead: string; meta: string[] }) {
  return (
    <section className={`page-hero tone-${tone}`}>
      <div className="page-hero-glow" aria-hidden="true" />
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="split-lines">{title}</h1>
      <div className="page-hero-foot">
        <p>{lead}</p>
        <div className="page-meta">{meta.map((item) => <span key={item}>{item}</span>)}</div>
      </div>
    </section>
  );
}

export function Studio({ content }: { content: SiteContent }) {
  const tutorials = content.tutorials;
  const changelog = content.changelog;
  const records = useMemo(() => [...content.records].sort((first, second) => second.date.localeCompare(first.date)), [content.records]);
  const pathname = usePathname();
  const router = useRouter();
  const pushPath = useCallback((path: string) => router.push(path, { scroll: false }), [router]);
  const activeWorkspace = workspaceFromPath(pathname ?? "/");
  const navigateWithTransition = useWorkspaceTransition(pathname, pushPath);
  useReveal();
  const pendingScrollTarget = useRef<string | null>(null);

  // 新页面真正渲染（路径变化）之后再滚动，避免被路由的滚动复位覆盖。
  useEffect(() => {
    const target = pendingScrollTarget.current;
    if (!target) return;
    pendingScrollTarget.current = null;
    const timer = window.setTimeout(() => {
      if (target === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      else document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRecordCategory, setSelectedRecordCategory] = useState<RecordCategoryKey | "all">("all");
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? "");
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | "all">("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>("problem-to-proof");
  const [expandedEfficiency, setExpandedEfficiency] = useState<string | null>("meeting");
  const [selectedTutorialId, setSelectedTutorialId] = useState(tutorials[0]?.id ?? "");
  const [tutorialCategory, setTutorialCategory] = useState("全部");
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackWebsite, setFeedbackWebsite] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedbackStatusText, setFeedbackStatusText] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConsent, setAuthConsent] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authStatusText, setAuthStatusText] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const filteredRecords = records.filter((record) => selectedRecordCategory === "all" || record.category === selectedRecordCategory);
  const selectedRecord: PublishedRecord | undefined = filteredRecords.find((record) => record.id === selectedRecordId) ?? filteredRecords[0];
  const tutorialCategories = ["全部", ...Array.from(new Set(tutorials.map((tutorial) => tutorial.category)))];
  const visibleTutorials = tutorials.filter((tutorial) => tutorialCategory === "全部" || tutorial.category === tutorialCategory);
  const selectedTutorial: PublishedTutorial | undefined = visibleTutorials.find((tutorial) => tutorial.id === selectedTutorialId) ?? visibleTutorials[0];
  const visibleArticles = articles.filter((article) => selectedColumn === "all" || article.column === selectedColumn);
  const latestTutorials = useMemo(() => [...tutorials].sort((first, second) => (second.updatedAt || second.publishedAt).localeCompare(first.updatedAt || first.publishedAt)).slice(0, 3), [tutorials]);
  const latestRecords = records.slice(0, 3);
  const [focusIndex, setFocusIndex] = useState(0);
  const [activeAnchor, setActiveAnchor] = useState("top");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFocusIndex((index) => (index + 1) % focusWords.length), 2400);
    return () => window.clearInterval(timer);
  }, []);

  // 首页滚动时高亮当前所在的区块（内容 / 经历 / 联系）。
  useEffect(() => {
    if (activeWorkspace !== "home" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0];
      if (visible) setActiveAnchor(HOME_ANCHORS[visible.target.id] ?? "top");
    }, { rootMargin: "-35% 0px -55% 0px" });
    Object.keys(HOME_ANCHORS).forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [activeWorkspace]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((response) => response.json() as Promise<{ user?: AuthUser | null }>)
      .then((payload) => { if (!cancelled && payload.user) setAuthUser(payload.user); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function countVisit() {
      try {
        const method = window.sessionStorage.getItem("zhouduofu-visit-counted") ? "GET" : "POST";
        const response = await fetch("/api/stats/visits", { method });
        const payload = (await response.json()) as { count?: number };
        if (!cancelled && response.ok && typeof payload.count === "number") {
          setVisitCount(payload.count);
          window.sessionStorage.setItem("zhouduofu-visit-counted", "1");
        }
      } catch {
        // 访问统计暂时不可用时，网站其他功能不受影响。
      }
    }
    void countVisit();
    return () => { cancelled = true; };
  }, []);

  function selectWorkspace(workspace: WorkspaceKey, target = "top") {
    setMenuOpen(false);
    if (workspace === activeWorkspace) {
      if (target === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      else document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    pendingScrollTarget.current = target;
    void navigateWithTransition(workspacePaths[workspace]);
  }

  function onNavLink(event: MouseEvent<HTMLAnchorElement>, workspace: WorkspaceKey, target = "top") {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    selectWorkspace(workspace, target);
  }

  function openTutorial(id: string) {
    setTutorialCategory("全部");
    setSelectedTutorialId(id);
    selectWorkspace("tutorials", "tutorial-reader");
  }

  function openRecord(id: string) {
    setSelectedRecordCategory("all");
    setSelectedRecordId(id);
    selectWorkspace("records", "record-reader");
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("otafukuchau@gmail.com");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = "mailto:otafukuchau@gmail.com";
    }
  }

  function startCooperation(title: string) {
    setFeedbackType("cooperation");
    setFeedbackMessage(`我想了解「${title}」合作：`);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const isNavActive = (item: (typeof navItems)[number]) => item.workspace === activeWorkspace && (activeWorkspace !== "home" || item.target === activeAnchor);

  function chooseRecordCategory(category: RecordCategoryKey | "all") {
    setSelectedRecordCategory(category);
    const next = records.find((record) => category === "all" || record.category === category);
    if (next) setSelectedRecordId(next.id);
  }

  function chooseTutorial(id: string) {
    setSelectedTutorialId(id);
    if (window.matchMedia("(max-width: 900px)").matches) {
      window.setTimeout(() => document.getElementById("tutorial-reader")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authMode === "register" && !authConsent) {
      setAuthStatusText("请先阅读并同意服务提示后再注册。");
      return;
    }
    setAuthSubmitting(true);
    setAuthStatusText("");
    try {
      const response = await fetch(`/api/auth/${authMode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: authEmail, password: authPassword }) });
      const payload = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok || !payload.user) throw new Error(payload.error || "操作失败");
      setAuthUser(payload.user);
      setAuthPassword("");
      setAuthOpen(false);
    } catch (error) {
      setAuthStatusText(error instanceof Error ? error.message : "登录暂时失败，请稍后再试。");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function logoutUser() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setAuthOpen(false);
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackStatus("sending");
    setFeedbackStatusText("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: feedbackType, message: feedbackMessage, contact: feedbackContact, website: feedbackWebsite, page: activeWorkspace }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "提交失败");
      setFeedbackMessage("");
      setFeedbackContact("");
      setFeedbackStatus("success");
      setFeedbackStatusText("已收到，谢谢你把具体想法告诉我。后续更新我会优先参考这些建议。");
    } catch (error) {
      setFeedbackStatus("error");
      setFeedbackStatusText(error instanceof Error ? error.message : "留言暂时没有提交成功，请稍后再试。");
    }
  }

  const contactSection = (
    <section className="contact-section" id="contact">
      <div className="contact-copy">
        <p className="eyebrow">联系 · Contact</p>
        <h2 className="split-lines"><span>有问题，</span><span>就从这里开始聊。</span></h2>
        <p>如果你有建议、遇到问题，或者希望我补充某个主题，可以直接留言。留言只进入我的私人收件箱，不会公开展示。</p>
        <div className="contact-methods">
          {contactMethods.map((method) => <a className="contact-method" href={method.href} key={method.label} target={method.external ? "_blank" : undefined} rel={method.external ? "noreferrer" : undefined}><span>{method.label}</span><strong>{method.value}</strong><i aria-hidden="true">↗</i></a>)}
        </div>
      </div>
      <form className="feedback-card" onSubmit={submitFeedback} aria-labelledby="feedback-heading">
        <span className="card-frame" aria-hidden="true" />
        <p className="eyebrow">Feedback</p>
        <h3 id="feedback-heading">留言与建议</h3>
        <p className="feedback-note">提交前请不要填写身份证号、银行卡号或其他不必要的敏感信息。</p>
        <label className="field"><span>你想告诉我什么？</span><select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as FeedbackType)}><option value="suggestion">内容建议</option><option value="question">想问一个问题</option><option value="experience">使用体验</option><option value="cooperation">商务合作</option></select></label>
        <label className="field"><span>留言内容</span><textarea required minLength={2} maxLength={2000} rows={5} value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} placeholder="例如：希望补充某个主题，或者哪里读起来不顺。" /></label>
        <label className="field"><span>联系方式（选填）</span><input type="text" maxLength={200} value={feedbackContact} onChange={(event) => setFeedbackContact(event.target.value)} placeholder="邮箱、微信号或手机号，方便我回复你" /></label>
        <label className="feedback-honeypot" aria-hidden="true">网站<input tabIndex={-1} autoComplete="off" value={feedbackWebsite} onChange={(event) => setFeedbackWebsite(event.target.value)} /></label>
        <button className="button button-primary" type="submit" disabled={feedbackStatus === "sending"}>{feedbackStatus === "sending" ? "正在提交…" : "提交留言"}<span aria-hidden="true">↗</span></button>
        {feedbackStatusText && <p className={feedbackStatus === "success" ? "form-status success" : "form-status error"} role="status">{feedbackStatusText}</p>}
      </form>
    </section>
  );

  return (
    <main className={`site site-${activeWorkspace}`}>
      <div className="grid-lines" aria-hidden="true"><span /><span /><span /><span /><span /></div>

      <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "is-open" : ""}`} aria-label="主导航">
        <Link className="brand" href="/" onClick={(event) => onNavLink(event, "home")} aria-label="周多福首页">
          <span className="brand-mark">周</span>
          <span className="brand-text"><strong>周多福</strong><small>ZHOU DUOFU · STUDIO</small></span>
        </Link>
        <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen((open) => !open)}><span /><span /><em className="sr-only">菜单</em></button>
        <nav className="site-nav" id="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link href={item.href} className={isNavActive(item) ? "active" : ""} aria-current={isNavActive(item) ? "page" : undefined} key={item.label} onClick={(event) => onNavLink(event, item.workspace, item.target)}>
              {item.label}
            </Link>
          ))}
          <button type="button" className="account-button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}>{authUser ? "我的账户" : "登录"}</button>
        </nav>
      </header>

      {activeWorkspace === "home" && <>
        <section className="hero" id="top">
          <HeroArt />
          <div className="hero-stickers" aria-hidden="true">{heroStickers.map((item, index) => <span className={`sticker sticker-${index + 1}`} key={item}>{item}</span>)}</div>
          <div className="hero-inner">
            <span className="hero-badge"><i aria-hidden="true" />{profile.role}</span>
            <h1 className="hero-name">我是<span>周多福</span></h1>
            <p className="hero-focus" aria-label={`专注 ${focusWords.join("、")}`}>
              <span className="hero-focus-label">专注</span>
              {focusWords.map((word, index) => <span className="hero-focus-item" key={word}><span className={index === focusIndex ? "focus-word active" : "focus-word"}>{word}</span>{index < focusWords.length - 1 && <b aria-hidden="true">+</b>}</span>)}
            </p>
            <p className="hero-motto">毕业这一年，我选择先去做：把想法变成产品，把经历写成方法。</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/#content" onClick={(event) => onNavLink(event, "home", "content")}>我的内容<span aria-hidden="true">→</span></Link>
              <Link className="button button-ghost" href="/#journey" onClick={(event) => onNavLink(event, "home", "journey")}>我的经历<span aria-hidden="true">↓</span></Link>
              <Link className="button button-ghost" href="/#services" onClick={(event) => onNavLink(event, "home", "services")}>商务合作<span aria-hidden="true">＋</span></Link>
            </div>
            <div className="hero-cards">
              <a className="hero-card tone-sky" href={contactMethods[0].href} target="_blank" rel="noreferrer"><small>小红书</small><strong>{contactMethods[0].value}</strong><em>打开主页 ↗</em></a>
              <button type="button" className="hero-card tone-lilac" onClick={() => void copyEmail()}><small>邮箱</small><strong>{contactMethods[1].value}</strong><em>{copied ? "已复制 ✓" : "复制邮箱 ＋"}</em></button>
              <div className="hero-card tone-mint"><small>北京时间</small><strong><BeijingClock /></strong><em>{tutorials.length} 篇教程 · {records.length} 篇记录</em></div>
            </div>
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">{[0, 1].map((round) => <span key={round}>{tickerItems.map((item) => <span key={`${round}-${item}`}>{item}<i>✦</i></span>)}</span>)}</div>
        </div>

        <section className="section doing-section" id="doing">
          <div className="section-head"><p className="eyebrow mono">What I do · 我在做的三件事</p><h2>做视频，做品牌，做内容。</h2></div>
          <ol className="doing-list">
            {doing.map((item, index) => (
              <li key={item.en}>
                <span className="mono doing-index">{pad(index + 1)}</span>
                <span className="doing-name"><em className="hand">{item.en}</em><strong>{item.title}</strong></span>
                <p>{item.copy}</p>
                <Link className="doing-link" href={workspacePaths[item.workspace]} onClick={(event) => onNavLink(event, item.workspace, item.target)}>{item.cta}<span aria-hidden="true">→</span></Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="section content-section" id="content">
          <div className="section-head"><p className="eyebrow mono">Learn in public · 我的内容</p><h2>我的内容</h2><p>教程和记录，是我把学习与经历公开出来的两种方式。</p></div>
          <div className="content-columns">
            <div className="content-column tone-sky">
              <div className="content-column-head"><span className="mono">01</span><div><h3>实用教程</h3><p>先亲自跑一遍，再写成能跟着做的步骤。</p></div></div>
              <div className="content-cards">
                {latestTutorials.map((item) => (
                  <button type="button" className="content-card" key={item.id} onClick={() => openTutorial(item.id)}>
                    <span className="pill">{item.category}</span>
                    <strong>{item.title}</strong>
                    <span className="content-card-foot"><span className="mono">{item.updatedAt || item.publishedAt}</span><span className="arrow" aria-hidden="true">↗</span></span>
                  </button>
                ))}
              </div>
              <Link className="text-link" href="/tutorials" onClick={(event) => onNavLink(event, "tutorials")}>查看全部 {tutorials.length} 篇教程 ↗</Link>
            </div>
            <div className="content-column tone-lilac">
              <div className="content-column-head"><span className="mono">02</span><div><h3>随心记录</h3><p>有真实经历和新判断时才写，不为凑数。</p></div></div>
              <div className="content-cards">
                {latestRecords.map((item) => (
                  <button type="button" className="content-card" key={item.id} onClick={() => openRecord(item.id)}>
                    <span className="pill">{collectionLabel(item.category)}</span>
                    <strong>{item.title}</strong>
                    <span className="content-card-foot"><span className="mono">{item.date}</span><span className="arrow" aria-hidden="true">↗</span></span>
                  </button>
                ))}
              </div>
              <Link className="text-link" href="/records" onClick={(event) => onNavLink(event, "records")}>查看全部 {records.length} 篇记录 ↗</Link>
            </div>
          </div>
        </section>

        <section className="section journey-section" id="journey">
          <div className="journey-intro">
            <p className="eyebrow mono">Journey · 成长之路</p>
            <h2>我的成长之路</h2>
            <p>2026 年 6 月毕业，赶上最难的求职季。同学们有的求稳，有的在努力上岸；我选了另一条路：先去做，边做边学。</p>
            <ul className="promise-list">{profile.promise.map((item, index) => <li key={item}><span className="mono">{pad(index + 1)}</span>{item}</li>)}</ul>
          </div>
          <ol className="timeline">
            {journey.map((item) => (
              <li className={item.status === "进行中" ? "is-current" : item.status === "已止损" || item.status === "已离开" ? "is-past" : undefined} key={`${item.date}-${item.title}`}>
                <span className="timeline-dot" aria-hidden="true" />
                <span className="timeline-when"><span className="mono">{item.date}</span><em className={`status status-${item.status}`}>{item.status}</em></span>
                <div className="timeline-body"><h3>{item.title}</h3><p>{item.copy}</p><div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section services-section" id="services">
          <div className="section-head">
            <p className="eyebrow mono">Work with me · 商务合作</p>
            <h2>可以一起做的事</h2>
            <p>下面每一项都是我自己跑过、正在做的事。价格按需求和交付范围报价，先聊清楚再开始。</p>
          </div>
          <div className="service-grid">
            {services.map((item, index) => (
              <article className={`service-card tone-${item.tone}`} key={item.title}>
                <span className="card-frame" aria-hidden="true" />
                <div className="service-head"><span className="mono">{pad(index + 1)}</span><span className="pill">{item.tag}</span></div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <dl>
                  <div><dt>适合</dt><dd>{item.fit}</dd></div>
                  <div><dt>交付</dt><dd>{item.deliver}</dd></div>
                  <div><dt>依据</dt><dd>{item.proof}</dd></div>
                </dl>
                <button type="button" className="service-cta" onClick={() => startCooperation(item.title)}>聊这个合作<span aria-hidden="true">→</span></button>
              </article>
            ))}
          </div>
          <ol className="process-list" aria-label="合作流程">
            {cooperationSteps.map((step, index) => <li key={step.title}><span className="mono">{pad(index + 1)}</span><strong>{step.title}</strong><small>{step.copy}</small></li>)}
          </ol>
        </section>

        <section className="section letter-section" id="letter">
          <article className="letter">
            <span className="card-frame" aria-hidden="true" />
            <p className="mono letter-stamp">EST. 2026 · 致每一位访客</p>
            <h2 className="hand">Dear Friend,</h2>
            <p className="letter-greeting">亲爱的朋友：</p>
            {letter.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="letter-sign"><span className="hand">— 周多福</span><small className="mono">写于 2026</small></p>
          </article>
        </section>

        {contactSection}
      </>}

      {activeWorkspace === "tutorials" && <>
        <PageHeader tone="sky" eyebrow="Practical tutorials · 实用教程" title={<><span>教程不是告诉你“应该”，</span><span>而是陪你把问题做完。</span></>} lead="从网络与隐私、内容搜集到来源表格，每篇都保留步骤、适用边界和可以核对的来源。" meta={[`${tutorials.length} 篇教程`, `${tutorialCategories.length - 1} 个分类`, changelog[0] ? `最近更新 ${changelog[0].date}` : "持续更新"]} />

        <section className="section tutorial-section" id="tutorials">
          <div className="chip-row" role="group" aria-label="教程分类">
            {tutorialCategories.map((category) => <button type="button" className={tutorialCategory === category ? "chip active" : "chip"} key={category} onClick={() => setTutorialCategory(category)}>{category}</button>)}
          </div>
          <div className="reader-layout">
            <aside className="reader-list" aria-label="教程列表">
              {visibleTutorials.map((tutorial, index) => (
                <button type="button" className={selectedTutorial?.id === tutorial.id ? "list-card active" : "list-card"} key={tutorial.id} onClick={() => chooseTutorial(tutorial.id)}>
                  <span className="list-index">{pad(index + 1)} /</span>
                  <span className="list-meta">{tutorial.category} · {tutorial.updatedAt}</span>
                  <strong>{tutorial.title}</strong>
                  <p>{tutorial.summary}</p>
                </button>
              ))}
              {visibleTutorials.length === 0 && <p className="empty-state">这个分类暂时还没有教程。</p>}
            </aside>
            {selectedTutorial && <article className="reader" id="tutorial-reader" key={selectedTutorial.id}>
              <div className="reader-head"><span className="pill tone-sky">{selectedTutorial.category}</span><time>更新于 {selectedTutorial.updatedAt}</time></div>
              <h2>{selectedTutorial.title}</h2>
              <p className="reader-summary">{selectedTutorial.summary}</p>
              {selectedTutorial.tags.length > 0 && <div className="tag-row">{selectedTutorial.tags.map((tag) => <span key={tag}>#{tag.replace(/^#/, "")}</span>)}</div>}
              <ContentDiscussion key={selectedTutorial.id} contentType="tutorial" contentId={selectedTutorial.id} contentTitle={selectedTutorial.title} authUser={authUser}>
                <TutorialBody content={selectedTutorial.content} />
                {selectedTutorial.sources.length > 0 && <div className="sources" data-comment-block="sources"><strong>资料来源</strong>{selectedTutorial.sources.map((source) => <a href={source.href} key={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>}
              </ContentDiscussion>
            </article>}
          </div>
          {changelog.length > 0 && <details className="changelog"><summary>更新日志<span>{changelog.length} 条</span></summary><div>{changelog.map((item) => <article key={`${item.date}-${item.title}`}><time>{item.date}</time><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div></details>}
        </section>

        <section className="section answers-section" id="articles">
          <div className="section-head">
            <p className="eyebrow">短答 · Answers</p>
            <h2>从一个问题开始，读一篇能带走的回答。</h2>
          </div>
          <div className="chip-row" role="group" aria-label="短答栏目">
            <button type="button" className={selectedColumn === "all" ? "chip active" : "chip"} onClick={() => setSelectedColumn("all")}>全部</button>
            {columns.map((column) => <button type="button" className={selectedColumn === column.key ? "chip active" : "chip"} key={column.key} onClick={() => setSelectedColumn(column.key)}>{column.label}</button>)}
          </div>
          <div className="answer-list">
            {visibleArticles.map((article, index) => {
              const isOpen = expandedArticle === article.id;
              return (
                <article className={isOpen ? "answer open" : "answer"} key={article.id}>
                  <button type="button" className="answer-head" aria-expanded={isOpen} onClick={() => setExpandedArticle(isOpen ? null : article.id)}>
                    <span className="list-index">{pad(index + 1)}</span>
                    <span><small>{columns.find((column) => column.key === article.column)?.label}</small><strong>{article.title}</strong><em>{article.excerpt}</em></span>
                    <i aria-hidden="true">{isOpen ? "−" : "+"}</i>
                  </button>
                  {isOpen && <div className="answer-body">
                    <ContentDiscussion key={article.id} contentType="article" contentId={article.id} contentTitle={article.title} authUser={authUser}>
                      <p data-comment-block="answer">{article.body}</p>
                      <ul data-comment-block="points">{article.points.map((point) => <li key={point}>{point}</li>)}</ul>
                    </ContentDiscussion>
                  </div>}
                </article>
              );
            })}
          </div>
        </section>

        <section className="section method-section tone-mint" id="efficiency">
          <div className="method-copy">
            <p className="eyebrow">效率方法 · Methods</p>
            <h2>效率不是把一天塞满，而是把重复消耗变少。</h2>
            <p>这里记录我在工作、资料整理和沟通中真正用过的方法。每一条都拆成步骤，方便你判断是否适合自己的节奏。</p>
          </div>
          <div className="method-list">
            {efficiencyNotes.map((note, index) => {
              const isOpen = expandedEfficiency === note.id;
              return (
                <article className={isOpen ? "method open" : "method"} key={note.id}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setExpandedEfficiency(isOpen ? null : note.id)}>
                    <span className="list-index">{pad(index + 1)}</span><strong>{note.title}</strong><i aria-hidden="true">{isOpen ? "−" : "+"}</i>
                  </button>
                  <p>{note.summary}</p>
                  {isOpen && <ol>{note.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
                </article>
              );
            })}
          </div>
        </section>
      </>}

      {activeWorkspace === "records" && <>
        <PageHeader tone="lilac" eyebrow="Open notes · 随心记录" title={<><span>把值得留下的想法，</span><span>写成可以反复引用的判断。</span></>} lead="不要求日更，也不为了凑数；有真实经历、有新判断时再写下来。" meta={[`${records.length} 篇记录`, `${recordCollections.length} 个集合`]} />

        <section className="section records-section" id="records">
          <div className="collection-grid" role="group" aria-label="记录集合">
            <button type="button" className={selectedRecordCategory === "all" ? "collection active" : "collection"} onClick={() => chooseRecordCategory("all")}>
              <span className="card-frame" aria-hidden="true" /><small>全部记录</small><strong>按日期回看所有沉淀</strong><em>{records.length} 篇</em>
            </button>
            {recordCollections.map((collection) => (
              <button type="button" className={`collection tone-${collection.tone} ${selectedRecordCategory === collection.key ? "active" : ""}`} key={collection.key} onClick={() => chooseRecordCategory(collection.key)}>
                <span className="card-frame" aria-hidden="true" /><small>{collection.label}</small><strong>{collection.title}</strong><em>{records.filter((record) => record.category === collection.key).length} 篇</em>
              </button>
            ))}
          </div>
          {selectedRecordCategory !== "all" && <p className="collection-note">{recordCollections.find((item) => item.key === selectedRecordCategory)?.intro}</p>}

          <div className="reader-layout">
            <aside className="reader-list" aria-label="按日期选择随心记录">
              {filteredRecords.map((record, index) => (
                <button type="button" className={selectedRecord?.id === record.id ? "list-card active" : "list-card"} key={record.id} onClick={() => setSelectedRecordId(record.id)}>
                  <span className="list-index">{pad(index + 1)} /</span>
                  <span className="list-meta">{record.date} · {collectionLabel(record.category)}</span>
                  <strong>{record.title}</strong>
                </button>
              ))}
              {filteredRecords.length === 0 && <p className="empty-state">这个集合暂时还没有记录，先换一个看看。</p>}
            </aside>
            {selectedRecord && <article className="reader" id="record-reader" key={selectedRecord.id}>
              <div className="reader-head"><span className="pill tone-lilac">{collectionLabel(selectedRecord.category)}</span><time>{selectedRecord.date}{selectedRecord.updatedAt && selectedRecord.updatedAt !== selectedRecord.date ? ` · 更新于 ${selectedRecord.updatedAt}` : ""}</time></div>
              <h2>{selectedRecord.title}</h2>
              {selectedRecord.tags.length > 0 && <div className="tag-row">{selectedRecord.tags.map((tag) => <span key={tag}>#{tag.replace(/^#/, "")}</span>)}</div>}
              <ContentDiscussion key={selectedRecord.id} contentType="record" contentId={selectedRecord.id} contentTitle={selectedRecord.title} authUser={authUser}>
                {selectedRecord.content
                  ? <TutorialBody content={selectedRecord.content} />
                  : selectedRecord.paragraphs.map((paragraph, paragraphIndex) => <p data-comment-block={`paragraph-${paragraphIndex}`} key={paragraph}>{paragraph}</p>)}
                {selectedRecord.sources && selectedRecord.sources.length > 0 && (
                  <div className="sources" data-comment-block="sources"><strong>资料来源与核验</strong>{selectedRecord.sources.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
                )}
                <div className="takeaway" data-comment-block="takeaway"><span>记录结论</span><strong>{selectedRecord.takeaway}</strong></div>
              </ContentDiscussion>
            </article>}
          </div>
        </section>
      </>}

      <footer className="site-footer">
        <div className="footer-mark" aria-hidden="true">周多福</div>
        <div className="footer-row">
          <div><strong>周多福个人工作室</strong><span>教程 · 记录 · 效率方法</span></div>
          <nav aria-label="页脚导航">{navItems.map((item) => <Link key={item.label} href={item.href} onClick={(event) => onNavLink(event, item.workspace, item.target)}>{item.label}</Link>)}</nav>
          <p>累计访问 <strong>{visitCount === null ? "—" : new Intl.NumberFormat("zh-CN").format(visitCount)}</strong> 次 · 仅统计总次数，不记录访客身份</p>
        </div>
      </footer>

      {authOpen && (
        <div className="auth-backdrop" role="presentation" onMouseDown={() => setAuthOpen(false)}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-heading" onMouseDown={(event) => event.stopPropagation()}>
            <span className="card-frame" aria-hidden="true" />
            <button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="关闭账户窗口">×</button>
            {authUser ? (
              <div className="account-summary">
                <p className="eyebrow">My account</p>
                <h2 id="auth-dialog-heading">我的账户</h2>
                <div className="account-email"><span>登录邮箱</span><strong>{authUser.email}</strong></div>
                <p>登录后，你的留言会显示为注册读者。</p>
                <div className="auth-actions">
                  {authUser.role === "admin" && <a className="button button-primary" href="/admin">进入内容后台<span aria-hidden="true">↗</span></a>}
                  <button type="button" className="button button-ghost" onClick={logoutUser}>退出登录</button>
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow">Account</p>
                <h2 id="auth-dialog-heading">{authMode === "login" ? "登录" : "创建账户"}</h2>
                <p className="auth-intro">不登录也能阅读和留言；登录后留言会显示为注册读者。</p>
                <div className="auth-tabs" role="tablist" aria-label="账户操作">
                  <button type="button" role="tab" aria-selected={authMode === "login"} className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthStatusText(""); }}>登录</button>
                  <button type="button" role="tab" aria-selected={authMode === "register"} className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setAuthStatusText(""); }}>注册</button>
                </div>
                <form className="auth-form" onSubmit={submitAuth}>
                  <label className="field"><span>邮箱</span><input required type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="name@example.com" /></label>
                  <label className="field"><span>密码</span><input required minLength={8} type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="至少 8 位" /></label>
                  {authMode === "register" && (
                    <div className="service-notice">
                      <strong>注册前请确认</strong>
                      <ul>
                        <li>账户只用于登录和留言身份，不会公开你的邮箱。</li>
                        <li>文章批注经审核后会公开显示；私信留言只有站主能看到。</li>
                        <li>请不要在留言中填写身份证、银行卡等不必要的敏感信息。</li>
                      </ul>
                      <label className="auth-consent"><input type="checkbox" checked={authConsent} onChange={(event) => setAuthConsent(event.target.checked)} /><span>我已阅读并同意以上服务提示</span></label>
                    </div>
                  )}
                  <button className="button button-primary" type="submit" disabled={authSubmitting}>{authSubmitting ? "正在处理…" : authMode === "login" ? "登录" : "同意并注册"}</button>
                  {authStatusText && <p className="form-status error" role="status">{authStatusText}</p>}
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
