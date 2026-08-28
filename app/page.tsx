"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import tutorialsData from "../content/tutorials.json";
import changelogData from "../content/changelog.json";
import publishedRecordsData from "../content/records.json";
import { calculateAnnualizedIrr } from "./finance-math";

type PurchaseMode = "vehicle" | "baas";
type BrandKey = "nio" | "onvo" | "firefly" | "tesla" | "xiaomi" | "byd" | "li" | "geely" | "aito" | "xpeng" | "other";
type ColumnKey = "tools" | "efficiency" | "information" | "life";
type RecordCategoryKey = "car-info" | "career-growth" | "life-efficiency" | "side-project";
type StageKey = "plan" | "online" | "offline" | "compare" | "experience" | "budget" | "communication" | "order" | "delivery" | "ownership";
type FinanceMode = "equal-payment" | "equal-principal" | "interest-free";
type PurchaseTaxMode = "new-energy" | "regular";
type FinancePlanKey = "custom";
type WorkspaceKey = "home" | "records" | "car" | "life";
type HomeViewKey = "about" | "columns";
type FeedbackType = "suggestion" | "question" | "experience";
type AuthUser = { id: string; email: string; role: string };
type AdminFeedbackItem = { id: number; type: string; message: string; contact: string; page: string; status: string; createdAt: string; userEmail?: string | null };
type AdminBillItem = { id: string; title: string; createdAt: string; userEmail?: string | null; snapshot: FinanceBillSnapshot };
type ContentComment = {
  id: string;
  contentType: "tutorial" | "record" | "article";
  contentId: string;
  contentTitle: string;
  category: string;
  message: string;
  authorName: string;
  anchorText: string;
  anchorBlock: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
};
type AdminCommentItem = ContentComment & { userId?: string | null; status: string };

type Column = {
  key: ColumnKey;
  label: string;
  title: string;
  copy: string;
  image: string;
};

type Article = {
  id: string;
  column: ColumnKey;
  title: string;
  excerpt: string;
  body: string;
  points: string[];
};

type EfficiencyNote = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
};

type Tutorial = {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  content: string;
  sources: Array<{ label: string; href: string }>;
};

type DailyRecord = {
  id: string;
  date: string;
  category: RecordCategoryKey;
  stage?: StageKey;
  tags: string[];
  title: string;
  paragraphs: string[];
  takeaway: string;
  content?: string;
  publishedAt?: string;
  updatedAt?: string;
  sources?: Array<{ label: string; href: string }>;
};

type LoanQuote = {
  monthlyRate: number;
  monthlyPayments: number[];
  principalPayments: number[];
  remainingPrincipalByMonth: number[];
  totalPayment: number;
  totalInterest: number;
  firstPayment: number;
  lastPayment: number;
};

type FinanceFormState = {
  selectedBrand?: BrandKey;
  batteryReduction?: number;
  purchaseMode: PurchaseMode;
  financePlan: FinancePlanKey;
  financeMode: FinanceMode;
  purchaseTaxMode: PurchaseTaxMode;
  manualVehiclePrice: number;
  downPaymentRate: number;
  financeYears: number;
  annualRate: number;
  fiveYearPayoffMonth?: number;
  loanPayoffMonth: number;
  ownershipYears: number;
  vatRate: number;
  insuranceFee: number;
  registrationFee: number;
  otherUpfrontFee: number;
  financeServiceFee: number;
  batteryRentMonthly: number;
  chargingMonthly: number;
  parkingMonthly: number;
  maintenanceMonthly: number;
  customerName: string;
  billTitle: string;
  billNote: string;
};

type FinanceSnapshotItem = {
  label: string;
  amount: number;
  note: string;
};

type FinanceBillSnapshot = FinanceFormState & {
  generatedAt: string;
  currentModelName: string;
  currentTrimName: string;
  vehicleSubtotal: number;
  purchaseTax: number;
  downPaymentAmount: number;
  firstPaymentAmount: number;
  loanPrincipal: number;
  loanTermMonths: number;
  loanQuote: LoanQuote;
  batteryRentTotal: number;
  monthlyRunningCost: number;
  vehicleCost: number;
  interestPaidThroughSettlement: number;
  financingCost: number;
  usageCost: number;
  ownershipTotal: number;
  earlyPayoffEligibleMonth: number;
  earlyPayoffAmount: number;
  payoffAtOwnership: number;
  settlementMonth: number;
  settlementAmount: number;
  planDescription: string;
  loanIrrPercent: number | null;
  upfrontItems: FinanceSnapshotItem[];
  monthlyItems: FinanceSnapshotItem[];
};

type SavedFinanceBill = {
  id: string;
  createdAt: string;
  snapshot: FinanceBillSnapshot;
};

const workspaceTabs: Array<{ key: WorkspaceKey; label: string; description: string }> = [
  { key: "home", label: "首页", description: "个人选择、长期内容与开放工具" },
  { key: "life", label: "生活效率", description: "实用教程、问题解法与效率方法" },
  { key: "records", label: "随心记录", description: "不追求日更，记录值得留下的判断" },
  { key: "car", label: "汽车数据与金融", description: "品牌价格参考、贷款与持有成本" },
];

const profile = {
  name: "周多福",
  role: "独立内容创作者 / 工具实践者",
  intro:
    "我把真实经历、个人判断和实用工具整理成一间长期更新的个人工作室。这里不代表任何品牌，内容尽量给出步骤、口径和来源，帮助你自己完成判断。",
  promise: ["保持独立判断", "尊重工作与生活的边界", "把能复用的方法留下来"],
};

const contactMethods = [
  {
    label: "小红书号",
    value: "191425657",
    href: "https://www.xiaohongshu.com/user/profile/191425657",
  },
  {
    label: "邮箱",
    value: "otafukuchau@gmail.com",
    href: "mailto:otafukuchau@gmail.com",
  },
  {
    label: "电话",
    value: "15993551315",
    href: "tel:15993551315",
  },
];

const recordCollections: Array<{
  key: RecordCategoryKey;
  label: string;
  title: string;
  intro: string;
}> = [
  {
    key: "car-info",
    label: "购车资讯相关",
    title: "把选车、看车、用车讲成普通人能决策的语言",
    intro: "记录买车阶段、车型判断、补能体验、门店沟通和交付后的长期服务，重点是帮用户少走弯路。",
  },
  {
    key: "career-growth",
    label: "职场与选择",
    title: "看清边界、保护权益，也为下一段路积累能力",
    intro: "记录真实职场、劳动权益、沟通方法、离开与重新开始，让选择建立在事实和长期生活之上。",
  },
  {
    key: "life-efficiency",
    label: "生活效率",
    title: "让工具真正减少重复消耗",
    intro: "分享 AI、信息整理、资料检索、自动化和日常工作流，让效率工具变成可落地的生活能力。",
  },
  {
    key: "side-project",
    label: "锦上添花的业余",
    title: "把兴趣、体验和生活质感慢慢放进来",
    intro: "记录不一定立刻变现、但能让生活更丰富的内容，比如阅读、旅行、审美、业余项目和灵感收藏。",
  },
];

const builtInDailyRecords: DailyRecord[] = [
  {
    id: "2026-07-24-first-car-stage",
    date: "2026-07-24",
    category: "car-info",
    stage: "plan",
    tags: ["#买车的初阶段", "#试驾邀约", "#服务心态"],
    title: "把门店邀约当成服务，而不是催促",
    paragraphs: [
      "其实，只要最近开始了解车，很多车企都会频繁打电话、邀约试驾，后续跟进也会很多。对一些人来说，这会特别反感；但如果把它看成一种服务和出行体验，感受就会完全不一样。",
      "免费的上门接送、试驾安排、礼品和门店陪同，本质上都在帮助你更快把信息补齐。如果还是觉得打扰，直接告诉服务人员，请他们在后台备注，后面通常就不会再继续打扰。",
      "买车的决策周期往往就那么几天，但你不一定要被催着在几天内做决定。真正重要的，不是赶着下单，而是用心把决策做对。",
    ],
    takeaway: "把买车当成一次需要认真完成的决策，而不是一次被动催促的消费。",
  },
  {
    id: "2026-07-26-ev-long-term-value",
    date: "2026-07-26",
    category: "car-info",
    stage: "ownership",
    tags: ["#电动车用车判断", "#换电", "#长期体验"],
    title: "电动车的价值，不只是续航，而是未来的长期使用体验",
    paragraphs: [
      "今天重新梳理自己对电动车的判断：真正值得关注的，不是短期内的续航数字，而是未来几年里，它能不能持续提供稳定、低成本、可升级的使用体验。",
      "对于我来说，买车阶段的成本固然重要，但真正决定一台车是否值得买的，往往是后续的充电便利性、续航稳定性、电池衰减速度和换电方案。",
      "换电的意义不只是解决续航焦虑，更重要的是让未来电池技术升级真正变成红利。电池可以更新，续航可以提升，整体用车成本也更有机会被持续拉低。",
      "如果不能换电，电池性能会随着时间降低，后续升级和更换的成本会越来越高，车的使用体验和保值空间也会被压缩。",
    ],
    takeaway: "买车时不只看当下的价格和续航，更要看未来几年能不能持续省钱、保值和升级。",
  },
];

const dailyRecords: DailyRecord[] = [...(publishedRecordsData as DailyRecord[]), ...builtInDailyRecords]
  .sort((first, second) => second.date.localeCompare(first.date));

const purchaseStages: Array<{ key: StageKey; step: string; title: string; note: string }> = [
  { key: "plan", step: "01", title: "初买车打算", note: "先确认自己为什么要买车，是否真的需要换车或新增一台。" },
  { key: "online", step: "02", title: "网上了解", note: "看官网、口碑、测评和政策，先建立基础认知。" },
  { key: "offline", step: "03", title: "线下了解", note: "进店看实车、摸材质、问清服务和交付流程。" },
  { key: "compare", step: "04", title: "对比", note: "横向看竞品，把价格、空间、补能和权益放在一起。" },
  { key: "experience", step: "05", title: "体验", note: "试驾、试乘和后排体验，感受它是否真的适合家人。" },
  { key: "budget", step: "06", title: "预算", note: "整车、BaaS、保险、补能和停车一起算总账。" },
  { key: "communication", step: "07", title: "沟通", note: "和顾问确认权益、交期、服务和可能的疑问。" },
  { key: "order", step: "08", title: "订车", note: "确定版本、颜色和交付节奏，完成下定。" },
  { key: "delivery", step: "09", title: "交付", note: "验车、提车、熟悉功能，把车真正接回家。" },
  { key: "ownership", step: "10", title: "交付后的生命周期服务", note: "补能、售后、升级、社区和用车问题处理，才是长期体验的开始。" },
];

const deliveryServices = [
  "一键服务和透明跟进",
  "上门取送车与道路救援",
  "换电 / 补能和日常使用支持",
  "社区、活动和长期用户陪伴",
];

const columns: Column[] = [
  {
    key: "tools",
    label: "独立工具",
    title: "把复杂问题拆成可以亲手验证的数字",
    copy: "从金融成本到长期预算，保留开放输入、清楚口径和可导出的结果。",
    image: "/images/family-planning.png",
  },
  {
    key: "efficiency",
    label: "AI 效率工具",
    title: "把新工具变成每天少折腾一点",
    copy: "分享我验证过的提示词、工作流、资料整理和自动化方法，只保留能复用的部分。",
    image: "/images/efficiency-desk.png",
  },
  {
    key: "information",
    label: "信息获取",
    title: "更自由地看世界，也更谨慎地做判断",
    copy: "记录资料检索、订阅源、英文阅读和信息安全经验，强调合规、隐私与独立判断。",
    image: "/images/home-hero.png",
  },
  {
    key: "life",
    label: "生活与人生建议",
    title: "普通人的复利，来自好好选择",
    copy: "关于销售、关系、金钱、情绪和长期主义的观察，尽量写得真诚、具体、有用。",
    image: "/images/family-planning.png",
  },
];

const articles: Article[] = [
  {
    id: "problem-to-proof",
    column: "tools",
    title: "怎样把一个复杂问题拆成可验证的步骤？",
    excerpt: "先定义想得到的结果，再把事实、假设、计算和行动分开。",
    body: "复杂问题常常不是缺少答案，而是多个口径混在一起。先写清目标与限制，再分别收集事实、标记假设、完成计算，最后列出下一步；每一层都能单独检查，结论才更可靠。",
    points: ["用一句话定义问题和需要的输出", "把已经确认的事实与暂时假设分开", "让每个数字都有来源，让每个行动都有下一步"],
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

const efficiencyNotes: EfficiencyNote[] = [
  {
    id: "meeting",
    title: "把一次沟通变成可追踪的结果",
    summary: "会前列目标，会中记录决定，会后只保留下一步和负责人。",
    steps: ["先写清楚这次沟通必须得到的一个结果", "把讨论内容分成事实、判断和待确认", "结束前确认下一步、时间和责任人"],
  },
  {
    id: "reading",
    title: "把长资料读成自己的判断卡片",
    summary: "不追求记住全部内容，只留下结论、证据、适用条件和疑问。",
    steps: ["先看目录、结论和数据出处", "用四句话记录核心观点与限制", "把能影响自己行动的部分单独标出来"],
  },
  {
    id: "weekly",
    title: "每周一次轻量复盘",
    summary: "用 20 分钟回看本周做过的决定，找出最值得保留的一条经验。",
    steps: ["列出本周三个已经完成的动作", "记录一个反复消耗时间的问题", "决定下周只优化一个环节"],
  },
];

const brandReferences: Array<{
  key: Exclude<BrandKey, "other">;
  group: string;
  name: string;
  representative: string;
  price: string;
  structure: string;
  officialUrl: string;
  sourceDate: string;
}> = [
  { key: "nio", group: "蔚来公司", name: "NIO 蔚来", representative: "ET5 / ET5T / ES6 / EC6 / ET9", price: "整车 ¥29.80 万起；BaaS ¥22.80 万起", structure: "纯电；支持换电与 BaaS 手动输入", officialUrl: "https://www.nio.com/news/20250525001", sourceDate: "官方发布 2025-05" },
  { key: "onvo", group: "蔚来公司", name: "ONVO 乐道", representative: "L60 / L90", price: "L60 整车 ¥19.28 万起；BaaS ¥13.58 万起", structure: "纯电；支持换电与 BaaS 手动输入", officialUrl: "https://www.onvo.cn/news/20260611001", sourceDate: "官方发布 2026-06" },
  { key: "firefly", group: "蔚来公司", name: "firefly 萤火虫", representative: "萤火虫 / halo 光之环", price: "整车 ¥11.98 万起；BaaS ¥7.98 万起", structure: "纯电小车；支持换电与 BaaS 手动输入", officialUrl: "https://www.firefly.com.cn/news/20260414001", sourceDate: "官方发布 2026-04" },
  { key: "tesla", group: "独立品牌", name: "特斯拉", representative: "Model 3 / Model Y", price: "Model 3 ¥23.55–33.95 万", structure: "纯电；价格随版本与限时权益变化", officialUrl: "https://www.tesla.cn/model3/design", sourceDate: "官网核对 2026-08" },
  { key: "xiaomi", group: "独立品牌", name: "小米汽车", representative: "SU7 / YU7", price: "新一代 SU7 ¥21.99–30.39 万", structure: "纯电；Standard / Pro / Max 样本", officialUrl: "https://www.mi.com/global/discover/article?id=6117", sourceDate: "官方发布 2026-03" },
  { key: "byd", group: "比亚迪集团", name: "比亚迪", representative: "秦 / 宋 / 海豹 / 海狮", price: "海豹 07 DM-i ¥13.98–19.58 万", structure: "纯电与插混；大众新能源价位样本", officialUrl: "https://www.byd.com/cn/ocean-home/models/haibao/haibao-07-dm-i", sourceDate: "官网核对 2026-08" },
  { key: "li", group: "独立品牌", name: "理想汽车", representative: "L6 / L7 / L8 / L9 / i8", price: "新 L6 ¥24.98 万起", structure: "增程与纯电；版本价格以配置页为准", officialUrl: "https://ir.lixiang.com/news-releases/news-release-details/li-auto-inc-launches-new-li-l6-versatile-all-wheel-drive-suv", sourceDate: "官方发布 2026-07" },
  { key: "geely", group: "吉利集团", name: "吉利银河", representative: "E5 / 星愿 / M9", price: "银河 E5 ¥10.98–14.58 万", structure: "纯电与插混；代表车型公开指导价", officialUrl: "https://galaxy.geely.com/E5", sourceDate: "官网核对 2026-08" },
  { key: "aito", group: "鸿蒙智行", name: "问界", representative: "M5 / M7 / M8 / M9", price: "新 M7 ¥29.98–37.98 万", structure: "增程与纯电；五座、六座版本不同", officialUrl: "https://aito.auto/model/m7-new/configuration/", sourceDate: "官网核对 2026-08" },
  { key: "xpeng", group: "独立品牌", name: "小鹏汽车", representative: "MONA M03 / P7+ / G6 / G9", price: "MONA M03 ¥11.98–15.58 万", structure: "纯电；代表车型发布价样本", officialUrl: "https://www.xpeng.com/news/01919c4e3d0b918dc2b08a0282360019", sourceDate: "官方发布 2024-08" },
];

const brandOptions: Array<{ key: BrandKey; label: string }> = [
  ...brandReferences.map((brand) => ({ key: brand.key, label: brand.name })),
  { key: "other", label: "其他品牌" },
];

const tutorials = tutorialsData as Tutorial[];
const changelog = changelogData as Array<{ date: string; title: string; detail: string }>;
const nioGroupBrands: BrandKey[] = ["nio", "onvo", "firefly"];

const formatPrice = (value: number) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2).replace(/\.00$/, "")}%`;

function formatIrr(value: number | null | undefined) {
  return value === null || value === undefined ? "--" : formatPercent(value);
}

function calculatePurchaseTax(grossAmount: number, taxMode: PurchaseTaxMode, vatRate: number) {
  const vatFactor = 1 + vatRate / 100;
  const taxableBase = grossAmount / vatFactor;
  const taxRate = taxMode === "new-energy" ? 0.05 : 0.1;
  const cap = taxMode === "new-energy" ? 15000 : Number.POSITIVE_INFINITY;
  return Math.min(taxableBase * taxRate, cap);
}

function calculateLoanQuote(principal: number, annualRate: number, months: number, mode: FinanceMode): LoanQuote {
  const safeMonths = Math.max(1, Math.round(months));
  const monthlyRate = mode === "interest-free" ? 0 : annualRate / 100 / 12;
  const remainingPrincipalByMonth = [Math.max(0, principal)];

  if (principal <= 0) {
    return {
      monthlyRate,
      monthlyPayments: Array.from({ length: safeMonths }, () => 0),
      principalPayments: Array.from({ length: safeMonths }, () => 0),
      remainingPrincipalByMonth: Array.from({ length: safeMonths + 1 }, () => 0),
      totalPayment: 0,
      totalInterest: 0,
      firstPayment: 0,
      lastPayment: 0,
    };
  }

  if (mode === "equal-principal") {
    const monthlyPrincipal = principal / safeMonths;
    let balance = principal;
    const monthlyPayments = Array.from({ length: safeMonths }, (_, index) => {
      const outstanding = principal - monthlyPrincipal * index;
      const payment = monthlyPrincipal + outstanding * monthlyRate;
      balance = Math.max(0, balance - monthlyPrincipal);
      remainingPrincipalByMonth.push(balance);
      return payment;
    });
    const totalPayment = monthlyPayments.reduce((sum, payment) => sum + payment, 0);
    return {
      monthlyRate,
      monthlyPayments,
      principalPayments: Array.from({ length: safeMonths }, () => monthlyPrincipal),
      remainingPrincipalByMonth,
      totalPayment,
      totalInterest: totalPayment - principal,
      firstPayment: monthlyPayments[0] ?? 0,
      lastPayment: monthlyPayments[safeMonths - 1] ?? 0,
    };
  }

  const monthlyPayment =
    monthlyRate === 0
      ? principal / safeMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, safeMonths)) /
        (Math.pow(1 + monthlyRate, safeMonths) - 1);

  let balance = principal;
  const principalPayments: number[] = [];
  const monthlyPayments = Array.from({ length: safeMonths }, () => {
    const interest = balance * monthlyRate;
    const principalPayment = Math.min(balance, monthlyPayment - interest);
    balance = Math.max(0, balance - principalPayment);
    principalPayments.push(principalPayment);
    remainingPrincipalByMonth.push(balance);
    return monthlyPayment;
  });
  const totalPayment = monthlyPayment * safeMonths;
  return {
    monthlyRate,
    monthlyPayments,
    principalPayments,
    remainingPrincipalByMonth,
    totalPayment,
    totalInterest: totalPayment - principal,
    firstPayment: monthlyPayment,
    lastPayment: monthlyPayment,
  };
}

const BILL_STORAGE_KEY = "zhouduofu-finance-bills-v2";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function makeCsvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const tokens = value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return tokens.filter(Boolean).map((token, index) => {
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a href={link[2]} key={`${index}-${token}`} target="_blank" rel="noreferrer">{link[1]} ↗</a>;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={`${index}-${token}`}>{token.slice(2, -2)}</strong>;
    return token;
  });
}

function TutorialBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const key = `${index}-${line.slice(0, 12)}`;
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
    const hasTableHeader = line.includes("|") && /^\s*\|?[\s:|-]+\|[\s:|-]+/.test(lines[index + 1] ?? "");

    if (hasTableHeader) {
      const parseRow = (row: string) => row.replace(/^\s*\||\|\s*$/g, "").split("|").map((cell) => cell.trim());
      const headers = parseRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && (lines[index] ?? "").includes("|")) {
        rows.push(parseRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push(<div className="tutorial-table-wrap" data-comment-block={`line-${index}`} key={key}><table><thead><tr>{headers.map((header, cellIndex) => <th key={`${header}-${cellIndex}`}>{renderInlineMarkdown(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{renderInlineMarkdown(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (!line.trim()) blocks.push(<span className="tutorial-space" key={key} />);
    else if (image) blocks.push(<figure className="tutorial-image" data-comment-block={`line-${index}`} key={key}><img src={image[2]} alt={image[1]} loading="lazy" />{image[1] && <figcaption>{image[1]}</figcaption>}</figure>);
    else if (line.startsWith("## ")) blocks.push(<h3 data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line.slice(3))}</h3>);
    else if (line.startsWith("### ")) blocks.push(<h4 data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line.slice(4))}</h4>);
    else if (line.startsWith("- ")) blocks.push(<p className="tutorial-list-line" data-comment-block={`line-${index}`} key={key}>• {renderInlineMarkdown(line.slice(2))}</p>);
    else if (/^\d+\.\s/.test(line)) blocks.push(<p className="tutorial-list-line ordered" data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line)}</p>);
    else if (line.startsWith("> ")) blocks.push(<blockquote data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line.slice(2))}</blockquote>);
    else blocks.push(<p data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line)}</p>);
    index += 1;
  }

  return <div className="tutorial-body">{blocks}</div>;
}

const commentCategoryLabels: Record<string, string> = {
  question: "提问",
  correction: "纠错",
  addition: "补充",
  experience: "经验",
  suggestion: "建议",
  reply: "回复",
};

function ContentDiscussion({
  contentType,
  contentId,
  contentTitle,
  authUser,
  children,
}: {
  contentType: ContentComment["contentType"];
  contentId: string;
  contentTitle: string;
  authUser: AuthUser | null;
  children: ReactNode;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("question");
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [anchorBlock, setAnchorBlock] = useState("");
  const [replyTo, setReplyTo] = useState<ContentComment | null>(null);
  const [website, setWebsite] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submitText, setSubmitText] = useState("");
  const [selectionPoint, setSelectionPoint] = useState<{ left: number; top: number } | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/comments?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`);
      const payload = (await response.json()) as { comments?: ContentComment[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "讨论暂时无法读取。");
      setComments(payload.comments ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "讨论暂时无法读取。");
    } finally {
      setLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => void loadComments(), 0);
    const reload = () => void loadComments();
    window.addEventListener("content-comment-updated", reload);
    return () => {
      window.clearTimeout(initialRequest);
      window.removeEventListener("content-comment-updated", reload);
    };
  }, [loadComments]);

  useEffect(() => {
    const clearSelectionAction = () => setSelectionPoint(null);
    window.addEventListener("scroll", clearSelectionAction, true);
    return () => window.removeEventListener("scroll", clearSelectionAction, true);
  }, []);

  function captureSelection() {
    window.setTimeout(() => {
      const selection = window.getSelection();
      const surface = surfaceRef.current;
      if (!selection || selection.isCollapsed || !surface || selection.rangeCount === 0) {
        setSelectionPoint(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer as Element
        : range.commonAncestorContainer.parentElement;
      if (!node || !surface.contains(node)) {
        setSelectionPoint(null);
        return;
      }
      const quote = selection.toString().trim().replace(/\s+/g, " ").slice(0, 360);
      if (quote.length < 2) {
        setSelectionPoint(null);
        return;
      }
      const block = node.closest("[data-comment-block]") as HTMLElement | null;
      const rect = range.getBoundingClientRect();
      setAnchorText(quote);
      setAnchorBlock(block?.dataset.commentBlock ?? "selected-text");
      setSelectionPoint({
        left: Math.min(window.innerWidth - 132, Math.max(12, rect.left + rect.width / 2 - 58)),
        top: Math.max(12, rect.top - 48),
      });
    }, 0);
  }

  function startAnnotation() {
    setSelectionPoint(null);
    setReplyTo(null);
    window.getSelection()?.removeAllRanges();
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  }

  function startReply(comment: ContentComment) {
    setReplyTo(comment);
    setAnchorText("");
    setAnchorBlock("");
    setCategory("reply");
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("sending");
    setSubmitText("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType, contentId, contentTitle, category, message, authorName, anchorText, anchorBlock, parentId: replyTo?.id, website }),
      });
      const payload = (await response.json()) as { error?: string; reviewRequired?: boolean };
      if (!response.ok) throw new Error(payload.error || "留言没有提交成功。");
      setMessage("");
      setAnchorText("");
      setAnchorBlock("");
      setReplyTo(null);
      setCategory("question");
      setSubmitState("success");
      setSubmitText(payload.reviewRequired ? "已提交。审核公开后，会出现在这篇内容的讨论中。" : "回复已公开。感谢你让这篇内容更完整。 ");
      if (!payload.reviewRequired) await loadComments();
      window.dispatchEvent(new CustomEvent("content-comment-updated"));
    } catch (error) {
      setSubmitState("error");
      setSubmitText(error instanceof Error ? error.message : "留言没有提交成功。");
    }
  }

  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesFor = (id: string) => comments.filter((comment) => comment.parentId === id);

  return <>
    <div className="commentable-surface" ref={surfaceRef} onPointerUp={captureSelection}>{children}</div>
    {selectionPoint && <button className="selection-comment-button" type="button" style={{ left: selectionPoint.left, top: selectionPoint.top }} onClick={startAnnotation}>＋ 批注这段</button>}
    <section className="content-discussion" aria-label={`${contentTitle}的讨论与批注`}>
      <div className="discussion-heading">
        <div><span>Discussion</span><h3>讨论与批注</h3><p>选中正文即可引用提问，也可以直接留下补充、纠错或经验。</p></div>
        <strong>{comments.length}<small> 条公开互动</small></strong>
      </div>

      {comments.length > 0 && <div className="comment-rail" aria-label="横向浏览最新互动">
        {comments.slice().reverse().map((comment) => <button type="button" key={`rail-${comment.id}`} onClick={() => document.getElementById(`comment-${comment.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          <span>{commentCategoryLabels[comment.category] ?? "互动"} · {comment.authorName}</span>
          <strong>{comment.anchorText ? `“${comment.anchorText}”` : comment.message}</strong>
        </button>)}
      </div>}

      <div className="discussion-body">
        <div className="comment-thread-list">
          {loading && <p className="discussion-empty">正在读取讨论…</p>}
          {!loading && loadError && <p className="discussion-empty error">{loadError}</p>}
          {!loading && !loadError && rootComments.length === 0 && <p className="discussion-empty">暂时还没有公开讨论。你可以成为第一个留下具体问题的人。</p>}
          {rootComments.map((comment) => <article className="comment-thread" id={`comment-${comment.id}`} key={comment.id}>
            <div className="comment-meta"><span>{commentCategoryLabels[comment.category] ?? "互动"}</span><strong>{comment.authorName}</strong><time>{comment.createdAt.replace("T", " ").slice(0, 16)}</time></div>
            {comment.anchorText && <blockquote><small>引用自本文</small>“{comment.anchorText}”</blockquote>}
            <p>{comment.message}</p>
            <button className="comment-reply-button" type="button" onClick={() => startReply(comment)}>回复这条</button>
            {repliesFor(comment.id).map((reply) => <div className="comment-reply" id={`comment-${reply.id}`} key={reply.id}>
              <div className="comment-meta"><span>回复</span><strong>{reply.authorName}</strong><time>{reply.createdAt.replace("T", " ").slice(0, 16)}</time></div>
              <p>{reply.message}</p>
            </div>)}
          </article>)}
        </div>

        <form className="comment-form" ref={formRef} onSubmit={submitComment}>
          <div className="comment-form-head"><span>{replyTo ? `回复 ${replyTo.authorName}` : anchorText ? "正在引用正文" : "留下问题或补充"}</span>{(replyTo || anchorText) && <button type="button" onClick={() => { setReplyTo(null); setAnchorText(""); setAnchorBlock(""); setCategory("question"); }}>取消引用</button>}</div>
          {replyTo && <blockquote>“{replyTo.message.slice(0, 120)}”</blockquote>}
          {!replyTo && anchorText && <blockquote>“{anchorText}”</blockquote>}
          <div className="comment-form-grid">
            <label><span>互动类型</span><select value={category} onChange={(event) => setCategory(event.target.value)} disabled={Boolean(replyTo)}><option value="question">提问</option><option value="correction">纠错</option><option value="addition">补充</option><option value="experience">经验</option><option value="suggestion">建议</option>{replyTo && <option value="reply">回复</option>}</select></label>
            {authUser?.role !== "admin" && <label><span>显示昵称（选填）</span><input maxLength={40} value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder={authUser ? "默认显示为注册读者" : "默认显示为匿名读者"} /></label>}
          </div>
          <label><span>内容</span><textarea required minLength={2} maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="写下具体问题、补充依据，或说明你在哪一步遇到了困难。" /></label>
          <label className="feedback-honeypot" aria-hidden="true">网站<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          <div className="comment-form-actions"><small>{authUser?.role === "admin" ? "站主回复会直接公开。" : "提交后先由站主审核，避免广告与无关内容。"}</small><button type="submit" disabled={submitState === "sending"}>{submitState === "sending" ? "正在提交…" : replyTo ? "提交回复" : anchorText ? "提交批注" : "提交留言"}</button></div>
          {submitText && <p className={`comment-submit-status ${submitState}`}>{submitText}</p>}
        </form>
      </div>
    </section>
  </>;
}

function buildCsv(snapshot: FinanceBillSnapshot) {
  const firstPaymentAmount = snapshot.firstPaymentAmount ?? snapshot.downPaymentAmount + snapshot.purchaseTax + snapshot.insuranceFee + snapshot.registrationFee + (snapshot.otherUpfrontFee ?? 0) + snapshot.financeServiceFee;
  const rows = [
    ["分类", "项目", "金额（元）", "说明"],
    ["概要", "称呼", snapshot.customerName, snapshot.billTitle],
    ["概要", "品牌与计价方式", `${snapshot.currentModelName} / ${snapshot.currentTrimName}`, snapshot.purchaseMode === "baas" ? "BaaS 租电" : "整车购买"],
    ["概要", "金融方案", snapshot.financePlan, snapshot.planDescription],
    ["概要", "生成时间", snapshot.generatedAt, snapshot.billNote],
    ["一次性", "车辆小计", String(Math.round(snapshot.vehicleSubtotal)), "用户输入购车金额；蔚来租电时扣除手动填写的减免"],
    ["一次性", "首付现金", String(Math.round(snapshot.downPaymentAmount)), `首付比例 ${snapshot.downPaymentRate}%`],
    ["一次性", "购置税", String(Math.round(snapshot.purchaseTax)), snapshot.purchaseTaxMode === "new-energy" ? "新能源减半口径" : "普通车辆 10% 口径"],
    ["一次性", "首年保险", String(Math.round(snapshot.insuranceFee)), "按实际报价替换"],
    ["一次性", "上牌登记", String(Math.round(snapshot.registrationFee)), "临牌、登记、代办等"],
    ["一次性", "其他首次付款杂项", String(Math.round(snapshot.otherUpfrontFee ?? 0)), "延保、装潢等不进入贷款本金的费用"],
    ["一次性", "金融服务费", String(Math.round(snapshot.financeServiceFee)), "如无则为 0"],
    ["每月", "金融月供", String(Math.round(snapshot.loanQuote.firstPayment)), snapshot.financeMode === "equal-principal" ? "首月月供，后续递减" : snapshot.financeMode === "interest-free" ? "免息分期" : "等额本息"],
    ["每月", "BaaS 月租", String(Math.round(snapshot.batteryRentMonthly)), snapshot.purchaseMode === "baas" ? "租电方案月费" : "未启用 BaaS"],
    ["每月", "充电 / 换电", String(Math.round(snapshot.chargingMonthly)), "按个人里程估算"],
    ["每月", "停车", String(Math.round(snapshot.parkingMonthly)), "车位或临停"],
    ["每月", "保养及杂费", String(Math.round(snapshot.maintenanceMonthly)), "洗车、耗材、轮胎等"],
    ["汇总", "贷款本金", String(Math.round(snapshot.loanPrincipal)), "扣除首付后的贷款金额"],
    ["汇总", "总利息（至结清）", String(Math.round(snapshot.interestPaidThroughSettlement)), "按选择的结清期数估算"],
    ["汇总", "综合年化融资成本（IRR）", formatIrr(snapshot.loanIrrPercent), "含用户填写的金融服务费，按实际现金流估算"],
    ["汇总", "首次付款金额", String(Math.round(firstPaymentAmount)), "首付 + 购置税 + 首年保险 + 上牌登记 + 其他杂项 + 金融服务费"],
    ["汇总", "整车购置成本", String(Math.round(snapshot.vehicleCost)), "整车成交价 + 购置税 + 首年保险 + 上牌登记 + 其他首次付款杂项"],
    ["汇总", "融资费用（利息 + 服务费）", String(Math.round(snapshot.financingCost)), "至结清总利息 + 金融服务费，不含贷款本金"],
    ["汇总", "使用年限成本", String(Math.round(snapshot.usageCost)), `BaaS 和用车支出（${snapshot.ownershipYears} 年）`],
    ["汇总", "结清期数", String(snapshot.settlementMonth), "按当前方案估算的结清时间"],
    ["汇总", "结清金额", String(Math.round(snapshot.settlementAmount)), "结清期剩余本金参考"],
    ["汇总", `${snapshot.ownershipYears} 年总支出`, String(Math.round(snapshot.ownershipTotal)), "整车购置成本 + 融资费用 + 使用年限成本"],
  ];

  return rows.map((row) => row.map(makeCsvValue).join(",")).join("\n");
}

function buildBillDocument(snapshot: FinanceBillSnapshot) {
  const firstPaymentAmount = snapshot.firstPaymentAmount ?? snapshot.downPaymentAmount + snapshot.purchaseTax + snapshot.insuranceFee + snapshot.registrationFee + (snapshot.otherUpfrontFee ?? 0) + snapshot.financeServiceFee;
  const upfrontRows = snapshot.upfrontItems
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${formatPrice(item.amount)}</td>
          <td>${escapeHtml(item.note)}</td>
        </tr>`,
    )
    .join("");

  const monthlyRows = snapshot.monthlyItems
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${formatPrice(item.amount)}</td>
          <td>${escapeHtml(item.note)}</td>
        </tr>`,
    )
    .join("");

  const bars = snapshot.loanQuote.monthlyPayments
    .slice(0, 12)
    .map(
      (payment, index) => `
        <div class="bar">
          <span style="height:${Math.max(8, (payment / Math.max(...snapshot.loanQuote.monthlyPayments.slice(0, 12), 1)) * 100)}%"></span>
          <b>${index + 1}</b>
        </div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(snapshot.billTitle)} - 金融账单</title>
  <style>
    :root{--bg:#f6f4ef;--ink:#10221c;--muted:#5b675f;--line:#d8ddd6;--green:#2d8a67;--gold:#c98a27;}
    *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,Arial,"PingFang SC","Microsoft YaHei",sans-serif}
    .page{max-width:1120px;margin:0 auto;padding:40px 24px 56px}
    .hero{background:#fff;border:1px solid var(--line);border-radius:18px;padding:28px 28px 22px;box-shadow:0 18px 42px rgba(16,34,28,.08)}
    .hero-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}
    .eyebrow{color:var(--green);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px}
    h1{margin:0 0 10px;font-size:34px;line-height:1.08}
    .lead{color:var(--muted);line-height:1.7;max-width:760px;margin:0}
    .badge{background:#eef4ef;border:1px solid #d7e5db;border-radius:999px;padding:10px 14px;color:var(--green);font-weight:800;white-space:nowrap}
    .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}
    .metric{background:#f8faf7;border:1px solid var(--line);border-radius:14px;padding:14px}
    .metric span{display:block;color:var(--muted);font-size:12px;margin-bottom:8px}
    .metric strong{font-size:22px}
    .grid{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-top:18px}
    .card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px}
    h2{margin:0 0 14px;font-size:22px}
    table{width:100%;border-collapse:collapse}
    th,td{padding:12px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
    th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em}
    td:nth-child(2){text-align:right;font-weight:700;white-space:nowrap}
    .note{color:var(--muted);font-size:13px;line-height:1.65}
    .bars{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:8px;height:160px;align-items:end;margin-top:6px}
    .bar{display:grid;gap:8px;align-items:end;justify-items:center}
    .bar span{width:100%;border-radius:12px 12px 3px 3px;background:linear-gradient(180deg,var(--green),rgba(45,138,103,.25));min-height:8px}
    .bar b{font-size:11px;color:var(--muted)}
    .footer{margin-top:18px;color:var(--muted);font-size:12px;line-height:1.6}
    @media print{body{background:#fff}.page{padding:0}.hero,.card{box-shadow:none}}
    @media (max-width:860px){.metrics,.grid{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.hero-top{display:block}}
    @media (max-width:560px){.metrics{grid-template-columns:1fr}.h1{font-size:28px}}
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="hero-top">
        <div>
          <p class="eyebrow">Finance bill</p>
          <h1>${escapeHtml(snapshot.billTitle)}</h1>
          <p class="lead">${escapeHtml(snapshot.customerName)} 的购车金融账单，生成于 ${escapeHtml(snapshot.generatedAt)}。品牌：${escapeHtml(snapshot.currentModelName)}。${escapeHtml(snapshot.planDescription)} ${escapeHtml(snapshot.billNote)}</p>
        </div>
        <div class="badge">${escapeHtml(snapshot.purchaseMode === "baas" ? "BaaS 租电方案" : "整车购买方案")}</div>
      </div>
      <div class="metrics">
        <div class="metric"><span>整车购置成本</span><strong>${formatPrice(snapshot.vehicleCost)}</strong></div>
        <div class="metric"><span>首次付款金额</span><strong>${formatPrice(firstPaymentAmount)}</strong></div>
        <div class="metric"><span>融资费用（利息 + 服务费）</span><strong>${formatPrice(snapshot.financingCost)}</strong></div>
        <div class="metric"><span>使用年限成本</span><strong>${formatPrice(snapshot.usageCost)}</strong></div>
        <div class="metric"><span>综合年化融资成本（IRR）</span><strong>${formatIrr(snapshot.loanIrrPercent)}</strong></div>
        <div class="metric"><span>${snapshot.ownershipYears} 年总支出</span><strong>${formatPrice(snapshot.ownershipTotal)}</strong></div>
      </div>
    </section>
    <div class="grid">
      <section class="card">
        <h2>一次性落地清单</h2>
        <table>
          <thead><tr><th>项目</th><th>金额</th><th>说明</th></tr></thead>
          <tbody>${upfrontRows}</tbody>
        </table>
      </section>
      <section class="card">
        <h2>前 12 个月月供趋势</h2>
        <div class="bars">${bars}</div>
        <p class="note">等额本金会逐月下降；等额本息和免息分期更平滑。你可以把这份账单直接发给家人一起看。</p>
      </section>
    </div>
    <div class="grid">
      <section class="card">
        <h2>每月使用清单</h2>
        <table>
          <thead><tr><th>项目</th><th>金额</th><th>说明</th></tr></thead>
          <tbody>${monthlyRows}</tbody>
        </table>
      </section>
      <section class="card">
        <h2>口径说明</h2>
        <p class="note">等额本息 = 本金 × 月利率 × (1 + 月利率)^期数 ÷ [(1 + 月利率)^期数 - 1]。等额本金按固定本金递减计息。新能源购置税与 BaaS 月租均按页面输入估算，最终以合同为准。</p>
        <p class="note">这份文档适合作为个人账单或家庭讨论页使用。计算结果仅供估算，最终以金融机构和合同为准。</p>
      </section>
    </div>
    <p class="footer">周多福个人工作室 · 汽车金融与持有成本工具</p>
  </div>
</body>
</html>`;
}

export default function Home() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>("home");
  const [homeView, setHomeView] = useState<HomeViewKey>("about");
  const [selectedRecordCategory, setSelectedRecordCategory] = useState<RecordCategoryKey | "all">("all");
  const [selectedStage, setSelectedStage] = useState<StageKey | "all">("all");
  const [selectedDailyId, setSelectedDailyId] = useState("2026-08-28-leaving-is-also-a-choice");
  const [selectedCarRecordId, setSelectedCarRecordId] = useState("2026-07-24-first-car-stage");
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | "all">("all");
  const [articleQuery, setArticleQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>("problem-to-proof");
  const [expandedEfficiency, setExpandedEfficiency] = useState<string | null>(null);
  const [selectedTutorialId, setSelectedTutorialId] = useState(tutorials[0]?.id ?? "");
  const [tutorialCategory, setTutorialCategory] = useState("全部");
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandKey>("other");
  const [batteryReduction, setBatteryReduction] = useState(0);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("vehicle");
  const [manualVehiclePrice, setManualVehiclePrice] = useState(202800);
  const [financeMode, setFinanceMode] = useState<FinanceMode>("equal-payment");
  const [purchaseTaxMode, setPurchaseTaxMode] = useState<PurchaseTaxMode>("new-energy");
  const [downPaymentRate, setDownPaymentRate] = useState(20);
  const [financeYears, setFinanceYears] = useState(5);
  const [annualRate, setAnnualRate] = useState(3.5);
  const [loanPayoffMonth, setLoanPayoffMonth] = useState(60);
  const [ownershipYears, setOwnershipYears] = useState(5);
  const [vatRate, setVatRate] = useState(13);
  const [insuranceFee, setInsuranceFee] = useState(5500);
  const [registrationFee, setRegistrationFee] = useState(800);
  const [otherUpfrontFee, setOtherUpfrontFee] = useState(0);
  const [financeServiceFee, setFinanceServiceFee] = useState(0);
  const [batteryRentMonthly, setBatteryRentMonthly] = useState(599);
  const [chargingMonthly, setChargingMonthly] = useState(300);
  const [parkingMonthly, setParkingMonthly] = useState(0);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(0);
  const [financeTab, setFinanceTab] = useState<"summary" | "details">("summary");
  const [customerName, setCustomerName] = useState("周先生");
  const [billTitle, setBillTitle] = useState("购车金融与持有成本账单");
  const [billNote, setBillNote] = useState("用于个人留档、家庭讨论和长期预算确认。");
  const [savedBills, setSavedBills] = useState<SavedFinanceBill[]>([]);
  const [savedBillsLoaded, setSavedBillsLoaded] = useState(false);
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
  const [billSaveStatus, setBillSaveStatus] = useState("");
  const [adminFeedbackItems, setAdminFeedbackItems] = useState<AdminFeedbackItem[]>([]);
  const [adminBillItems, setAdminBillItems] = useState<AdminBillItem[]>([]);
  const [adminCommentItems, setAdminCommentItems] = useState<AdminCommentItem[]>([]);
  const [adminReplyDrafts, setAdminReplyDrafts] = useState<Record<string, string>>({});
  const [adminInboxOpen, setAdminInboxOpen] = useState(false);

  const filteredArticles = useMemo(() => {
    const query = articleQuery.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesColumn = selectedColumn === "all" || article.column === selectedColumn;
      const text = `${article.title} ${article.excerpt} ${article.body}`.toLowerCase();
      return matchesColumn && (!query || text.includes(query));
    });
  }, [articleQuery, selectedColumn]);

  const filteredDailyRecords = useMemo(() => {
    return dailyRecords.filter((record) => {
      if (record.category === "car-info") return false;
      const matchesCategory = selectedRecordCategory === "all" || record.category === selectedRecordCategory;
      return matchesCategory;
    });
  }, [selectedRecordCategory]);

  const selectedDailyRecord = filteredDailyRecords.find((record) => record.id === selectedDailyId) ?? filteredDailyRecords[0] ?? dailyRecords[0];
  const activeCollection = selectedRecordCategory === "all" ? null : recordCollections.find((collection) => collection.key === selectedRecordCategory);
  const activePurchaseStage = selectedStage === "all" ? null : purchaseStages.find((stage) => stage.key === selectedStage);
  const carRecords = dailyRecords.filter((record) => record.category === "car-info" && (selectedStage === "all" || record.stage === selectedStage));
  const selectedCarRecord = carRecords.find((record) => record.id === selectedCarRecordId) ?? carRecords[0] ?? dailyRecords.find((record) => record.category === "car-info")!;
  const tutorialCategories = ["全部", ...Array.from(new Set(tutorials.map((tutorial) => tutorial.category)))];
  const visibleTutorials = tutorials.filter((tutorial) => tutorialCategory === "全部" || tutorial.category === tutorialCategory);
  const selectedTutorial = visibleTutorials.find((tutorial) => tutorial.id === selectedTutorialId) ?? visibleTutorials[0] ?? tutorials[0];

  const currentBrandLabel = brandOptions.find((brand) => brand.key === selectedBrand)?.label ?? "其他品牌";
  const currentBrandReference = brandReferences.find((brand) => brand.key === selectedBrand);
  const nioBaasEnabled = nioGroupBrands.includes(selectedBrand) && purchaseMode === "baas";
  const basePrice = manualVehiclePrice;
  const vehicleSubtotal = Math.max(0, basePrice - (nioBaasEnabled ? batteryReduction : 0));
  const purchaseTax = calculatePurchaseTax(vehicleSubtotal, purchaseTaxMode, vatRate);
  const downPaymentAmount = (vehicleSubtotal * downPaymentRate) / 100;
  const loanPrincipal = Math.max(0, vehicleSubtotal - downPaymentAmount);
  const customLoanTermMonths = Math.max(1, Math.round(financeYears * 12));
  const loanTermMonths = customLoanTermMonths;
  const ownershipMonths = Math.max(1, Math.round(ownershipYears * 12));
  const loanQuote = calculateLoanQuote(loanPrincipal, annualRate, customLoanTermMonths, financeMode);
  const displayedRateLabel = formatPercent(annualRate);
  const earlyPayoffEligibleMonth = 0;
  const earlyPayoffAmount = 0;
  const settlementMonth = Math.min(loanTermMonths, Math.max(1, Math.round(loanPayoffMonth)));
  const settlementAmount = settlementMonth < loanTermMonths
    ? loanQuote.remainingPrincipalByMonth[settlementMonth] ?? 0
    : 0;
  const settlementCashFlows = [
    loanPrincipal - financeServiceFee,
    ...loanQuote.monthlyPayments.slice(0, settlementMonth).map((payment, index) =>
      -(payment + (index === settlementMonth - 1 ? settlementAmount : 0)),
    ),
  ];
  // Treat a borrower-paid finance service fee as a loan-related cost paid at
  // disbursement. This follows the all-in cash-flow approach used for IRR.
  const loanIrrPercent = calculateAnnualizedIrr(settlementCashFlows);
  const payoffAtOwnership = settlementAmount;
  const monthlyLoanPayment = loanQuote.monthlyPayments[0] ?? 0;
  const loanPaymentsThroughSettlement = loanQuote.monthlyPayments.slice(0, settlementMonth).reduce((sum, payment) => sum + payment, 0);
  const interestPaidThroughSettlement = Math.max(0, loanPaymentsThroughSettlement + settlementAmount - loanPrincipal);
  const planDescription = `自定义 ${financeYears || 0} 年 ${customLoanTermMonths} 期，按你输入的年化利率、还款方式和第 ${settlementMonth} 期结清估算。`;
  const batteryMonths = nioBaasEnabled ? ownershipMonths : 0;
  const batteryRentTotal = batteryRentMonthly * batteryMonths;
  const monthlyRunningCost = chargingMonthly + parkingMonthly + maintenanceMonthly;
  const monthlyOwnershipCost = (nioBaasEnabled ? batteryRentMonthly : 0) + monthlyRunningCost;
  const firstPaymentAmount = downPaymentAmount + purchaseTax + insuranceFee + registrationFee + otherUpfrontFee + financeServiceFee;
  const vehicleCost = vehicleSubtotal + purchaseTax + insuranceFee + registrationFee + otherUpfrontFee;
  const financingCost = interestPaidThroughSettlement + financeServiceFee;
  const loanTotalRepayment = loanPaymentsThroughSettlement + settlementAmount + financeServiceFee;
  const usageCost = batteryRentTotal + monthlyRunningCost * ownershipMonths;
  const ownershipTotal = vehicleCost + financingCost + usageCost;
  const costBreakdown = [
    { key: "vehicle", label: "车辆及首次费用", amount: vehicleCost },
    { key: "finance", label: "融资费用", amount: financingCost },
    { key: "usage", label: `${ownershipYears} 年使用`, amount: usageCost },
  ];
  const repaymentSamples = loanQuote.monthlyPayments.slice(0, Math.min(12, loanQuote.monthlyPayments.length));
  const repaymentChartMax = Math.max(...repaymentSamples, 1);
  const upfrontFeeItems = [
    { label: "首付现金", amount: downPaymentAmount, note: `按车辆成交价的 ${formatPercent(downPaymentRate)} 估算` },
    { label: "购置税", amount: purchaseTax, note: purchaseTaxMode === "new-energy" ? "新能源车 2026-2027 减半口径，单车减免有上限" : "普通车辆按 10% 购置税口径估算" },
    { label: "首年保险", amount: insuranceFee, note: "交强险、商业险等，按实际报价替换" },
    { label: "上牌登记", amount: registrationFee, note: "上牌、临牌、登记或代办费用" },
    { label: "其他首次付款杂项", amount: otherUpfrontFee, note: "延保、装潢或其他不进入贷款本金的费用" },
    { label: "金融服务费", amount: financeServiceFee, note: "如方案没有该项，可保持为 0" },
  ];
  const ownershipMonthlyFeeItems = [
    { label: "BaaS 电池月租", amount: nioBaasEnabled ? batteryRentMonthly : 0, note: "仅蔚来公司三个品牌选择租电方案时计入，按合同月租填写" },
    { label: "充电 / 换电", amount: chargingMonthly, note: "按个人通勤里程和补能习惯估算" },
    { label: "停车", amount: parkingMonthly, note: "车位、临停或单位停车费用" },
    { label: "保养及杂费", amount: maintenanceMonthly, note: "洗车、耗材、轮胎、保养等长期支出" },
  ];
  const monthlyFeeItems = [
    { label: "金融月供", amount: monthlyLoanPayment, note: financeMode === "equal-principal" ? "等额本金首月最高，后续递减" : financeMode === "interest-free" ? "免息分期，本金平均摊还" : "等额本息，每月基本一致" },
    { label: "末期月供", amount: loanQuote.lastPayment, note: "当前输入方案的末期月供参考" },
    { label: "结清金额参考", amount: settlementAmount, note: settlementAmount > 0 ? `按第 ${settlementMonth} 期一次结清估算` : "当前按完整分期还完" },
    ...ownershipMonthlyFeeItems,
  ];
  const currentBillSnapshot: FinanceBillSnapshot = {
    selectedBrand,
    batteryReduction,
    purchaseMode,
    financePlan: "custom",
    financeMode,
    purchaseTaxMode,
    manualVehiclePrice,
    downPaymentRate,
    financeYears,
    annualRate,
    loanPayoffMonth,
    ownershipYears,
    vatRate,
    insuranceFee,
    registrationFee,
    otherUpfrontFee,
    financeServiceFee,
    batteryRentMonthly,
    chargingMonthly,
    parkingMonthly,
    maintenanceMonthly,
    customerName,
    billTitle,
    billNote,
    generatedAt: new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeStyle: "short" }).format(new Date()),
    currentModelName: currentBrandLabel,
    currentTrimName: "自定义购车金额",
    vehicleSubtotal,
    purchaseTax,
    downPaymentAmount,
    firstPaymentAmount,
    loanPrincipal,
    loanTermMonths,
    loanQuote,
    batteryRentTotal,
    monthlyRunningCost,
    vehicleCost,
    interestPaidThroughSettlement,
    financingCost,
    usageCost,
    ownershipTotal,
    earlyPayoffEligibleMonth,
    earlyPayoffAmount,
    payoffAtOwnership,
    settlementMonth,
    settlementAmount,
    planDescription,
    loanIrrPercent,
    upfrontItems: upfrontFeeItems,
    monthlyItems: monthlyFeeItems,
  };

  /* eslint-disable react-hooks/set-state-in-effect -- Saved bills live in browser storage and can only be restored after hydration. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BILL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedFinanceBill[];
      if (Array.isArray(parsed)) {
        setSavedBills(parsed.slice(0, 12));
      }
    } catch {
      setSavedBills([]);
    } finally {
      setSavedBillsLoaded(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!savedBillsLoaded) return;
    try {
      window.localStorage.setItem(BILL_STORAGE_KEY, JSON.stringify(savedBills.slice(0, 12)));
    } catch {
      // ignore storage quota errors
    }
  }, [savedBills, savedBillsLoaded]);

  useEffect(() => {
    let cancelled = false;
    async function restoreAccount() {
      try {
        const response = await fetch("/api/auth/me");
        const payload = (await response.json()) as { user?: AuthUser | null };
        if (cancelled || !payload.user) return;
        setAuthUser(payload.user);
        const billResponse = await fetch("/api/bills");
        const billPayload = (await billResponse.json()) as { bills?: SavedFinanceBill[] };
        if (!cancelled && billResponse.ok && billPayload.bills) setSavedBills(billPayload.bills);
      } catch {
        // The public calculator remains usable when D1 is not connected yet.
      }
    }
    void restoreAccount();
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
        // The site remains usable when the visit counter is temporarily unavailable.
      }
    }
    void countVisit();
    return () => { cancelled = true; };
  }, []);

  function chooseBrand(brand: BrandKey) {
    setSelectedBrand(brand);
    if (!nioGroupBrands.includes(brand)) {
      setPurchaseMode("vehicle");
      setBatteryReduction(0);
      setBatteryRentMonthly(0);
    }
  }

  function switchPurchaseMode(mode: PurchaseMode) {
    setPurchaseMode(mode);
    if (mode === "vehicle") {
      setBatteryReduction(0);
      setBatteryRentMonthly(0);
    }
  }

  async function saveCurrentBill() {
    const savedAt = new Date().toISOString();
    const id = `${selectedBrand}-${savedAt}`;
    const snapshot = { ...currentBillSnapshot, generatedAt: new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeStyle: "short" }).format(new Date()) };
    if (authUser) {
      setBillSaveStatus("正在保存到云端…");
      try {
        const response = await fetch("/api/bills", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ snapshot }) });
        const payload = (await response.json()) as SavedFinanceBill & { error?: string };
        if (!response.ok) throw new Error(payload.error || "保存失败");
        setSavedBills((current) => [payload, ...current.filter((item) => item.id !== payload.id)].slice(0, 30));
        setBillSaveStatus("已保存到云端，可在其他设备登录后继续查看。");
        return;
      } catch (error) {
        setBillSaveStatus(error instanceof Error ? error.message : "云端保存暂时失败。");
        return;
      }
    }
    setSavedBills((current) => [
      {
        id,
        createdAt: savedAt,
        snapshot,
      },
      ...current.slice(0, 11),
    ]);
    setBillSaveStatus("已保存在当前浏览器。登录后可以跨设备保存。");
  }

  function loadSavedBill(item: SavedFinanceBill) {
    const form = item.snapshot;
    const restoredBrand = form.selectedBrand ?? (form.currentModelName?.includes("乐道") ? "onvo" : "other");
    setSelectedBrand(restoredBrand);
    setBatteryReduction(form.batteryReduction ?? 0);
    setPurchaseMode(nioGroupBrands.includes(restoredBrand) ? form.purchaseMode : "vehicle");
    setFinanceMode(form.financeMode);
    setPurchaseTaxMode(form.purchaseTaxMode);
    setManualVehiclePrice(form.manualVehiclePrice);
    setDownPaymentRate(form.downPaymentRate);
    setFinanceYears(form.financeYears);
    setAnnualRate(form.annualRate);
    setLoanPayoffMonth(form.loanPayoffMonth ?? Math.max(1, Math.min(form.financeYears * 12, form.ownershipYears * 12)));
    setOwnershipYears(form.ownershipYears);
    setVatRate(form.vatRate);
    setInsuranceFee(form.insuranceFee);
    setRegistrationFee(form.registrationFee);
    setOtherUpfrontFee(form.otherUpfrontFee ?? 0);
    setFinanceServiceFee(form.financeServiceFee);
    setBatteryRentMonthly(form.batteryRentMonthly);
    setChargingMonthly(form.chargingMonthly);
    setParkingMonthly(form.parkingMonthly);
    setMaintenanceMonthly(form.maintenanceMonthly);
    setCustomerName(form.customerName);
    setBillTitle(form.billTitle);
    setBillNote(form.billNote);
  }

  function exportBillSnapshot(snapshot: FinanceBillSnapshot, kind: "csv" | "html") {
    const safeName = snapshot.billTitle.replace(/[\\/:*?"<>|]+/g, "_").trim() || "finance-bill";
    if (kind === "csv") {
      downloadText(`${safeName}.csv`, buildCsv(snapshot), "text/csv");
      return;
    }
    downloadText(`${safeName}.html`, buildBillDocument(snapshot), "text/html");
  }

  function exportCurrentBill(kind: "csv" | "html") {
    exportBillSnapshot(currentBillSnapshot, kind);
  }

  async function deleteSavedBill(id: string) {
    if (authUser) {
      const response = await fetch("/api/bills", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) {
        setBillSaveStatus("云端账单暂时无法删除，请稍后再试。");
        return;
      }
    }
    setSavedBills((current) => current.filter((item) => item.id !== id));
  }

  function chooseRecordCategory(category: RecordCategoryKey | "all") {
    setSelectedRecordCategory(category);
    const nextRecord = dailyRecords.find((record) => record.category !== "car-info" && (category === "all" || record.category === category));
    if (nextRecord) setSelectedDailyId(nextRecord.id);
  }

  function chooseStage(stage: StageKey | "all") {
    setSelectedStage(stage);
    const nextRecord = dailyRecords.find((record) => stage === "all" ? record.category === "car-info" : record.stage === stage);
    if (nextRecord) setSelectedCarRecordId(nextRecord.id);
  }

  function selectWorkspace(workspace: WorkspaceKey) {
    setActiveWorkspace(workspace);
    window.requestAnimationFrame(() => {
      document.getElementById("workspace-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function goToContact() {
    setActiveWorkspace("home");
    window.requestAnimationFrame(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function loadRemoteBills() {
    const response = await fetch("/api/bills");
    const payload = (await response.json()) as { bills?: SavedFinanceBill[]; error?: string };
    if (!response.ok) throw new Error(payload.error || "账单暂时无法读取。");
    setSavedBills(payload.bills ?? []);
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
      await loadRemoteBills();
      setBillSaveStatus("登录成功；之后保存的账单会同步到云端。");
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
    setSavedBills([]);
    setBillSaveStatus("已退出登录；当前浏览器仍可继续使用计算器。");
  }

  async function loadAdminInbox() {
    try {
      const [feedbackResponse, billsResponse, commentsResponse] = await Promise.all([fetch("/api/admin/feedback"), fetch("/api/admin/bills"), fetch("/api/admin/comments")]);
      const feedbackPayload = (await feedbackResponse.json()) as { feedback?: AdminFeedbackItem[]; error?: string };
      const billsPayload = (await billsResponse.json()) as { bills?: AdminBillItem[]; error?: string };
      const commentsPayload = (await commentsResponse.json()) as { comments?: AdminCommentItem[]; error?: string };
      if (!feedbackResponse.ok) throw new Error(feedbackPayload.error || "留言暂时无法读取。");
      if (!billsResponse.ok) throw new Error(billsPayload.error || "账单暂时无法读取。");
      if (!commentsResponse.ok) throw new Error(commentsPayload.error || "文章讨论暂时无法读取。");
      setAdminFeedbackItems(feedbackPayload.feedback ?? []);
      setAdminBillItems(billsPayload.bills ?? []);
      setAdminCommentItems(commentsPayload.comments ?? []);
      setAdminInboxOpen(true);
    } catch (error) {
      setFeedbackStatus("error");
      setFeedbackStatusText(error instanceof Error ? error.message : "管理员收件箱暂时无法读取。");
    }
  }

  async function updateAdminCommentStatus(id: string, status: "published" | "hidden") {
    const response = await fetch("/api/admin/comments", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFeedbackStatus("error");
      setFeedbackStatusText(payload.error || "文章留言状态暂时无法更新。");
      return;
    }
    await loadAdminInbox();
    window.dispatchEvent(new CustomEvent("content-comment-updated"));
  }

  async function replyToAdminComment(item: AdminCommentItem) {
    const message = adminReplyDrafts[item.id]?.trim() ?? "";
    if (message.length < 2) {
      setFeedbackStatus("error");
      setFeedbackStatusText("请先写下至少两个字的回复。");
      return;
    }
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: item.contentType, contentId: item.contentId, contentTitle: item.contentTitle, category: "reply", message, parentId: item.parentId || item.id }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFeedbackStatus("error");
      setFeedbackStatusText(payload.error || "回复暂时没有提交成功。");
      return;
    }
    setAdminReplyDrafts((current) => ({ ...current, [item.id]: "" }));
    setFeedbackStatus("success");
    setFeedbackStatusText("回复已公开，并保留了原留言的引用关系。");
    await loadAdminInbox();
    window.dispatchEvent(new CustomEvent("content-comment-updated"));
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

  return (
    <main>
      <header className="site-header" aria-label="主导航">
        <button className="brand brand-button" type="button" onClick={() => selectWorkspace("home")} aria-label="周多福首页">
          <span className="brand-mark">周</span>
          <span><strong>周多福</strong><small>个人工作室 · 持续生长</small></span>
        </button>
        <nav className="workspace-nav" aria-label="内容工作区">
          {workspaceTabs.map((tab) => (
            <button type="button" className={activeWorkspace === tab.key ? "active" : ""} key={tab.key} onClick={() => selectWorkspace(tab.key)}>
              {tab.label}
            </button>
          ))}
          <button type="button" onClick={goToContact}>联系</button>
          <button type="button" className="account-nav-button" onClick={() => setAuthOpen(true)}>{authUser ? "我的账户" : "登录"}</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Tutorials · Tools · Open notes</p>
          <h1>把复杂问题，整理成可以直接使用的教程与工具。</h1>
          <p className="hero-text">这是周多福的个人知识与工具网站。这里提供可照着完成的生活效率教程、保留来源的内容整理方法、开放计算工具，以及对真实经历的长期记录。</p>
          <div className="hero-actions"><button className="primary-action" type="button" onClick={() => selectWorkspace("life")}>浏览实用教程</button><button className="secondary-action" type="button" onClick={() => selectWorkspace("car")}>使用计算工具</button></div>
          <div className="hero-proof"><span>网站用途</span><strong>解决问题，而不是堆积信息</strong><small>每篇内容尽量给出步骤、来源和可以复用的结果。</small></div>
        </div>
        <div className="hero-panel studio-orbit" aria-label="个人工作室的三个方向">
          <div className="orbit-core"><span>ZHOU</span><strong>知识工作室</strong><small>持续整理，持续更新</small></div>
          <div className="orbit-note orbit-note-one"><span>01</span><strong>实用教程</strong></div>
          <div className="orbit-note orbit-note-two"><span>02</span><strong>来源与判断</strong></div>
          <div className="orbit-note orbit-note-three"><span>03</span><strong>开放工具</strong></div>
          <div className="signal-card"><span>内容标准</span><strong>看得懂，也能照着做。</strong></div>
        </div>
      </section>

      <section className="intro-band"><p>教程给步骤，工具给结果，记录保留思考过程。</p></section>
      <div className="workspace-anchor" id="workspace-content" aria-hidden="true" />

      {activeWorkspace === "records" && <section className="section daily-record-section" id="daily-record">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Open notes</p>
            <h2>把值得留下的想法，写成可以反复引用的判断。</h2>
          </div>
          <p className="section-lead">不要求日更，也不为了凑数；有真实经历、有新判断时再写下来。</p>
        </div>

        <div className="record-collections" aria-label="随心记录集合分类">
          <button type="button" className={selectedRecordCategory === "all" ? "collection-card active" : "collection-card"} onClick={() => chooseRecordCategory("all")}>
            <span>全部记录</span>
            <strong>按日期回看所有沉淀</strong>
            <p>保留完整时间线，方便快速找到最近写过的内容。</p>
          </button>
          {recordCollections.filter((collection) => collection.key !== "car-info").map((collection) => (
            <button type="button" className={selectedRecordCategory === collection.key ? "collection-card active" : "collection-card"} key={collection.key} onClick={() => chooseRecordCategory(collection.key)}>
              <span>{collection.label}</span>
              <strong>{collection.title}</strong>
              <p>{collection.intro}</p>
            </button>
          ))}
        </div>

        <div className="daily-layout">
          <aside className="record-browser" aria-label="按日期选择随心记录">
            <div className="browser-head">
              <p className="eyebrow">Records</p>
              <h3>按日期阅读</h3>
            </div>
            <div className="record-date-list">
              {filteredDailyRecords.map((entry) => (
                <button type="button" className={selectedDailyRecord.id === entry.id ? "record-date active" : "record-date"} key={entry.id} onClick={() => setSelectedDailyId(entry.id)}>
                  <span>{entry.date}</span>
                  <strong>{entry.title}</strong>
                  <small>{recordCollections.find((collection) => collection.key === entry.category)?.label}</small>
                </button>
              ))}
            </div>
            {filteredDailyRecords.length === 0 && <p className="empty-state">这个分类暂时还没有记录，先换一个集合看看。</p>}
          </aside>

          <article className="daily-entry" key={selectedDailyRecord.id}>
            <div className="daily-meta">
              <span>{selectedDailyRecord.date}</span>
              <span>{recordCollections.find((collection) => collection.key === selectedDailyRecord.category)?.label}</span>
              {selectedDailyRecord.updatedAt && <span>更新于 {selectedDailyRecord.updatedAt}</span>}
            </div>
            <h3>{selectedDailyRecord.title}</h3>
            <div className="record-tags">
              {selectedDailyRecord.tags.map((tag) => (
                <button type="button" key={tag} onClick={() => setSelectedDailyId(selectedDailyRecord.id)}>{tag}</button>
              ))}
            </div>
            <ContentDiscussion key={selectedDailyRecord.id} contentType="record" contentId={selectedDailyRecord.id} contentTitle={selectedDailyRecord.title} authUser={authUser}>
              {selectedDailyRecord.content
                ? <TutorialBody content={selectedDailyRecord.content} />
                : selectedDailyRecord.paragraphs.map((paragraph, paragraphIndex) => <p data-comment-block={`paragraph-${paragraphIndex}`} key={paragraph}>{paragraph}</p>)}
              {selectedDailyRecord.sources && (
                <div className="record-sources" data-comment-block="sources" aria-label="资料来源">
                  <span>资料来源与核验</span>
                  {selectedDailyRecord.sources.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
                </div>
              )}
              <div className="daily-takeaway" data-comment-block="takeaway">
                <span>记录结论</span>
                <strong>{selectedDailyRecord.takeaway}</strong>
              </div>
            </ContentDiscussion>
          </article>

        </div>

        {activeCollection && <p className="collection-note">当前集合：{activeCollection.label}。{activeCollection.intro}</p>}
      </section>}

      {activeWorkspace === "home" && <>
      <section className="section home-view-section" id="home-view-switcher">
        <div className="home-view-nav" role="tablist" aria-label="主页内容切换">
          <button type="button" role="tab" aria-selected={homeView === "about"} className={homeView === "about" ? "active" : ""} onClick={() => setHomeView("about")}>关于我</button>
          <button type="button" role="tab" aria-selected={homeView === "columns"} className={homeView === "columns" ? "active" : ""} onClick={() => setHomeView("columns")}>内容专栏</button>
        </div>

        {homeView === "about" && (
          <div className="home-view-grid">
            <section className="profile-section" id="about">
              <div className="profile-card">
                <div className="profile-mark">周</div>
                <div><p className="eyebrow">About the person behind the page</p><h2>{profile.name}</h2><p className="profile-role">{profile.role}</p><p>{profile.intro}</p><a className="text-link" href="mailto:otafukuchau@gmail.com">发邮件聊聊 →</a></div>
              </div>
              <div className="profile-notes"><p className="eyebrow">工作室原则</p><h3>把经验变成能复用的内容，把判断留给每一位使用者。</h3><ul>{profile.promise.map((item) => <li key={item}>{item}</li>)}</ul><p className="muted-note">长期方向：实用教程、随心记录、开放工具与生活选择。</p></div>
            </section>
            <section className="career-path" aria-labelledby="career-path-heading">
              <div><p className="eyebrow">Personal path</p><h2 id="career-path-heading">经历不是标签，而是下一阶段的材料。</h2></div>
              <ol>
                <li><span>01</span><div><strong>汽车一线销售</strong><p>在真实用户、价格与服务之间，积累沟通、金融计算和决策支持经验。</p></div></li>
                <li><span>02</span><div><strong>重新选择边界</strong><p>离开长期不可持续的工作节奏，重新审视健康、权益与个人发展的关系。</p></div></li>
                <li><span>03</span><div><strong>个人知识工作室</strong><p>把经历整理为教程、工具和有来源的记录，让解决问题的能力持续积累。</p></div></li>
              </ol>
            </section>
          </div>
        )}

        {homeView === "columns" && (
          <section className="section columns-section" id="columns">
            <div className="section-heading"><div><p className="eyebrow">Four long-term columns</p><h2>四个长期栏目，回答不同的生活问题。</h2></div><p className="section-lead">不追热点，不把复杂事情说得更复杂。每个栏目都从一个真实问题开始，慢慢积累可以回看的答案。</p></div>
            <div className="column-grid">{columns.map((column) => <button type="button" className={selectedColumn === column.key ? "column-card active" : "column-card"} key={column.key} onClick={() => { setSelectedColumn(column.key); selectWorkspace("life"); }}><img src={column.image} alt="" /><span>{column.label}</span><h3>{column.title}</h3><p>{column.copy}</p><b>查看这个专栏 ↓</b></button>)}</div>
          </section>
        )}
      </section>
      </>}

      {activeWorkspace === "life" && <>
      <section className="section tutorial-section" id="tutorials">
        <div className="section-heading">
          <div><p className="eyebrow">Practical tutorials</p><h2>教程不是告诉你“应该”，而是陪你把问题做完。</h2></div>
          <p className="section-lead">从网络与隐私、内容搜集到来源表格，每篇都保留步骤、适用边界和可核对来源。新内容可通过本地发布工具直接维护。</p>
        </div>
        <div className="tutorial-filters" aria-label="教程分类">
          {tutorialCategories.map((category) => <button type="button" className={tutorialCategory === category ? "filter-chip active" : "filter-chip"} key={category} onClick={() => setTutorialCategory(category)}>{category}</button>)}
        </div>
        <div className="tutorial-layout">
          <aside className="tutorial-list" aria-label="教程列表">
            {visibleTutorials.map((tutorial) => <button type="button" className={selectedTutorial?.id === tutorial.id ? "tutorial-card active" : "tutorial-card"} key={tutorial.id} onClick={() => setSelectedTutorialId(tutorial.id)}><span>{tutorial.category} · {tutorial.updatedAt}</span><strong>{tutorial.title}</strong><p>{tutorial.summary}</p><small>{tutorial.tags.join(" · ")}</small></button>)}
          </aside>
          {selectedTutorial && <article className="tutorial-reader">
            <div className="tutorial-reader-head"><span>{selectedTutorial.category}</span><time>更新于 {selectedTutorial.updatedAt}</time></div>
            <h2>{selectedTutorial.title}</h2><p className="tutorial-summary">{selectedTutorial.summary}</p>
            <ContentDiscussion key={selectedTutorial.id} contentType="tutorial" contentId={selectedTutorial.id} contentTitle={selectedTutorial.title} authUser={authUser}>
              <TutorialBody content={selectedTutorial.content} />
              {selectedTutorial.sources.length > 0 && <div className="tutorial-sources" data-comment-block="sources"><strong>资料来源</strong>{selectedTutorial.sources.map((source) => <a href={source.href} key={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>}
            </ContentDiscussion>
          </article>}
        </div>
        <details className="changelog-panel"><summary>查看教程更新日志</summary><div>{changelog.map((item) => <article key={`${item.date}-${item.title}`}><time>{item.date}</time><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div></details>
      </section>

      <section className="section article-section" id="articles">
        <div className="section-heading"><div><p className="eyebrow">Column answers</p><h2>从一个问题开始，读一篇能带走的回答。</h2></div><div className="article-tools"><label className="search-field"><span>搜索专栏</span><input type="search" placeholder="输入关键词" value={articleQuery} onChange={(event) => setArticleQuery(event.target.value)} /></label><button type="button" className={selectedColumn === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedColumn("all")}>全部</button></div></div>
        <div className="article-filter">{columns.map((column) => <button type="button" className={selectedColumn === column.key ? "filter-chip active" : "filter-chip"} key={column.key} onClick={() => setSelectedColumn(column.key)}>{column.label}</button>)}</div>
        <div className="article-list">{filteredArticles.map((article) => { const column = columns.find((item) => item.key === article.column)!; const isOpen = expandedArticle === article.id; return <article className={isOpen ? "article-row open" : "article-row"} key={article.id}><div className="article-row-main"><div><span className="article-label">{column.label}</span><h3>{article.title}</h3><p>{article.excerpt}</p></div><button type="button" className="icon-button" aria-label={isOpen ? "收起文章" : "展开文章"} onClick={() => setExpandedArticle(isOpen ? null : article.id)}>{isOpen ? "−" : "+"}</button></div>{isOpen && <div className="article-body"><ContentDiscussion key={article.id} contentType="article" contentId={article.id} contentTitle={article.title} authUser={authUser}><p data-comment-block="answer">{article.body}</p><ul data-comment-block="points">{article.points.map((point) => <li key={point}>{point}</li>)}</ul></ContentDiscussion></div>}</article> })}</div>
        {filteredArticles.length === 0 && <p className="empty-state">暂时没有匹配的文章，换一个关键词试试。</p>}
      </section>

      <section className="section efficiency-section" id="efficiency">
        <div className="efficiency-image"><img src="/images/efficiency-desk.png" alt="桌面整理和效率经验场景" /></div>
        <div className="efficiency-copy"><p className="eyebrow">Efficiency experience</p><h2>效率不是把一天塞满，而是把重复消耗变少。</h2><p>这里会持续记录我在工作、资料整理和沟通中真正用过的方法。每一条经验都尽量拆成步骤，方便你判断是否适合自己的节奏。</p><div className="efficiency-list">{efficiencyNotes.map((note) => { const isOpen = expandedEfficiency === note.id; return <article className={isOpen ? "efficiency-item open" : "efficiency-item"} key={note.id}><button type="button" onClick={() => setExpandedEfficiency(isOpen ? null : note.id)}><span>{note.title}</span><b>{isOpen ? "收起" : "展开步骤"}</b></button><p>{note.summary}</p>{isOpen && <ol>{note.steps.map((step) => <li key={step}>{step}</li>)}</ol>}</article> })}</div></div>
      </section>
      </>}

      {activeWorkspace === "car" && <>
      <section className="section brand-data-section" id="brand-data">
        <div className="section-heading">
          <div><p className="eyebrow">Brand price watch</p><h2>先看品牌价位，再用自己的成交金额计算。</h2></div>
          <p className="section-lead">下面整理十条品牌线与代表车型的官方公开价位样本。蔚来公司旗下 NIO、ONVO 乐道、firefly 萤火虫集中展示；价格和权益会变化，请回到官方来源核对。</p>
        </div>
        <div className="brand-stat-grid" aria-label="品牌样本统计">
          <div><span>跟踪品牌线</span><strong>10</strong><small>覆盖主流新能源品牌</small></div>
          <div><span>价位样本</span><strong>7.98–37.98</strong><small>万元，含 BaaS 起价</small></div>
          <div><span>计算方式</span><strong>开放输入</strong><small>不再绑定车型</small></div>
          <div><span>本次核对</span><strong>2026.08</strong><small>最终以官方为准</small></div>
        </div>
        <div className="brand-table-wrap">
          <table className="brand-price-table">
            <thead><tr><th>品牌归属</th><th>品牌</th><th>车型样本</th><th>官方公开价位样本</th><th>购车结构</th><th>来源</th><th>计算</th></tr></thead>
            <tbody>
              {brandReferences.map((brand) => (
                <tr key={brand.key}>
                  <td><span className={brand.group === "蔚来公司" ? "brand-group nio" : "brand-group"}>{brand.group}</span></td>
                  <td><strong>{brand.name}</strong></td>
                  <td>{brand.representative}</td>
                  <td>{brand.price}</td>
                  <td>{brand.structure}</td>
                  <td><a href={brand.officialUrl} target="_blank" rel="noreferrer">{brand.sourceDate} ↗</a></td>
                  <td><button type="button" onClick={() => { chooseBrand(brand.key); window.requestAnimationFrame(() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>选择品牌</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="brand-data-note">口径说明：价位表只做横向观察，贷款本金始终以你填写的“购车金额”为准。蔚来公司旗下三个品牌可打开 BaaS 输入，租电减免和月租都不会自动带入。</p>
      </section>

      <section className="section car-journey-section" id="car-journey">
        <div className="section-heading"><div><p className="eyebrow">Buyer journey & notes</p><h2>从打算买车到长期使用，记录都放在汽车专区。</h2></div><p className="section-lead">点击横向阶段会筛选相关记录；交付后的补能、售后与长期服务也在同一区域，不再占用随心记录。</p></div>
        <div className="journey-dashboard">
          <section className="timeline-card" id="journey">
            <div className="timeline-head"><div><p className="eyebrow">Buyer journey</p><h3>购车全周期</h3></div><button type="button" className={selectedStage === "all" ? "filter-chip active" : "filter-chip"} onClick={() => chooseStage("all")}>全部阶段</button></div>
            <div className="journey-scroll" tabIndex={0} aria-label="横向浏览买车阶段"><ol className="journey-list">{purchaseStages.map((item) => <li key={item.step} className={selectedStage === item.key ? "active" : ""}><button type="button" aria-pressed={selectedStage === item.key} onClick={() => chooseStage(item.key)}><span>{item.step}</span><strong>{item.title}</strong></button></li>)}</ol></div>
            <div className="journey-active-note" aria-live="polite"><span>{activePurchaseStage ? `阶段 ${activePurchaseStage.step}` : "全部阶段"}</span><strong>{activePurchaseStage?.title ?? "完整购车路径"}</strong><p>{activePurchaseStage?.note ?? "按自己的节奏了解、比较、计算、下单与长期使用。"}</p></div>
          </section>
          <section className="delivery-card compact-delivery-card"><p className="eyebrow">Ownership service</p><h3>交付后的用车生命周期</h3><p>交付不是结束。补能、售后、救援、软件升级与日常使用支持，都会影响长期体验和真实成本。</p><ul>{deliveryServices.map((item) => <li key={item}>{item}</li>)}</ul></section>
        </div>
        <div className="car-record-layout">
          <aside className="car-record-list">{carRecords.map((record) => <button type="button" className={selectedCarRecord.id === record.id ? "active" : ""} key={record.id} onClick={() => setSelectedCarRecordId(record.id)}><span>{record.date}</span><strong>{record.title}</strong></button>)}{carRecords.length === 0 && <p className="empty-state">这个阶段暂无记录，可先查看完整周期。</p>}</aside>
          <article className="daily-entry car-daily-entry"><div className="daily-meta"><span>{selectedCarRecord.date}</span><span>{purchaseStages.find((stage) => stage.key === selectedCarRecord.stage)?.title ?? "汽车记录"}</span>{selectedCarRecord.updatedAt && <span>更新于 {selectedCarRecord.updatedAt}</span>}</div><h3>{selectedCarRecord.title}</h3><ContentDiscussion key={selectedCarRecord.id} contentType="record" contentId={selectedCarRecord.id} contentTitle={selectedCarRecord.title} authUser={authUser}>{selectedCarRecord.content ? <TutorialBody content={selectedCarRecord.content} /> : selectedCarRecord.paragraphs.map((paragraph, paragraphIndex) => <p data-comment-block={`paragraph-${paragraphIndex}`} key={paragraph}>{paragraph}</p>)}<div className="daily-takeaway" data-comment-block="takeaway"><span>记录结论</span><strong>{selectedCarRecord.takeaway}</strong></div></ContentDiscussion></article>
        </div>
      </section>

      </>}

      {activeWorkspace === "car" && <section className="section calculator-section" id="calculator">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Price calculator</p>
            <h2>先算贷款，再列首次付款，最后看养车与长期成本。</h2>
          </div>
          <p className="section-lead">
            直接填写品牌、购车金额和首付比例。页面仍分成贷款金融、税费保险与首次付款、月持有及持有年限费用三个步骤，最终以实际报价、金融审批和合同为准。
          </p>
        </div>

        <div className="calculator-shell finance-shell">
          <div className="calculator-controls">
            <div className="calculator-step-heading">
              <span>步骤 1</span>
              <div><h3>贷款金融</h3><p>不选车型，直接以你填写的含选装购车金额计算月供、总利息、结清金额和 IRR。</p></div>
            </div>
            <div className="control-grid open-finance-grid">
              <label className="budget-input">
                <span>汽车品牌</span>
                <select value={selectedBrand} onChange={(event) => chooseBrand(event.target.value as BrandKey)}>
                  {brandOptions.map((brand) => <option key={brand.key} value={brand.key}>{brand.label}</option>)}
                </select>
              </label>
              <label className="budget-input">
                <span>购车金额（含选装）</span>
                <input min="0" step="1000" type="number" value={manualVehiclePrice === 0 ? "" : manualVehiclePrice} onChange={(event) => setManualVehiclePrice(Math.max(0, Number(event.target.value) || 0))} />
                <small className="input-help">填写合同或报价单中的车辆金额；蔚来租电减免在下方单独扣除。</small>
              </label>
            </div>

            <div className="plan-summary-card">
              <p className="eyebrow">Plan summary</p>
              <h3>用户自定义贷款方案</h3>
              <p>{planDescription}</p>
              <div className="plan-summary-meta">
                <span>计价品牌：{currentBrandLabel}</span>
                <span>计入贷款车辆金额：{formatPrice(vehicleSubtotal)}</span>
                <span>分期：{loanTermMonths} 期</span>
                <span>第 {settlementMonth} 期结清：{formatPrice(settlementAmount)}</span>
              </div>
              <p className="input-help">结清期数只影响贷款成本；下方持有年限只影响用车与持有费用，两者已经分开。</p>
            </div>

            <label className="budget-input payoff-month-input">
              <span>计划结清期数</span>
              <input min="1" max={loanTermMonths} step="1" type="number" value={loanPayoffMonth} onChange={(event) => setLoanPayoffMonth(Math.min(loanTermMonths, Math.max(1, Number(event.target.value) || 1)))} />
              <small className="input-help">只用于贷款结清测算。是否允许提前结清以及违约金，请按你的合同确认。</small>
            </label>

            <div className="control-grid finance-essential-grid">
              <label className="budget-input">
                <span>首付比例</span>
                <input min="0" max="100" step="5" type="number" value={downPaymentRate === 0 ? "" : downPaymentRate} onChange={(event) => setDownPaymentRate(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} />
              </label>
              <label className="budget-input">
                <span>金融服务费（计入 IRR）</span>
                <input min="0" step="100" type="number" value={financeServiceFee === 0 ? "" : financeServiceFee} onChange={(event) => setFinanceServiceFee(Math.max(0, Number(event.target.value) || 0))} />
                <small className="input-help">没有该项可保持为 0。</small>
              </label>
            </div>

            <div className="control-grid custom-finance-grid">
                <label className="budget-input">
                  <span>分期年限（贷款合同）</span>
                  <input min="0" max="8" step="1" type="number" value={financeYears === 0 ? "" : financeYears} onChange={(event) => { const years = Math.min(8, Math.max(0, Number(event.target.value) || 0)); setFinanceYears(years); setLoanPayoffMonth(Math.max(1, years * 12)); }} />
                </label>
                <label className="budget-input">
                  <span>年化利率（合同口径）</span>
                  <input min="0" max="24" step="0.1" type="number" value={annualRate === 0 ? "" : annualRate} onChange={(event) => setAnnualRate(Math.min(24, Math.max(0, Number(event.target.value) || 0)))} />
                  <small className="input-help">直接填写金融机构明示的年化利率；不同品牌与时期的方案由你按实际合同输入。</small>
                </label>
              </div>

            {nioGroupBrands.includes(selectedBrand) && (
              <div className="nio-baas-panel">
                <div className="control-group">
                  <span className="control-label">蔚来公司品牌购买方式</span>
                  <div className="segmented">
                    <button type="button" className={purchaseMode === "vehicle" ? "active" : ""} onClick={() => switchPurchaseMode("vehicle")}>整车购买</button>
                    <button type="button" className={purchaseMode === "baas" ? "active" : ""} onClick={() => switchPurchaseMode("baas")}>BaaS 电池租用</button>
                  </div>
                </div>
                {purchaseMode === "baas" && (
                  <label className="budget-input battery-reduction-input">
                    <span>租电减免金额</span>
                    <input min="0" max={manualVehiclePrice} step="1000" type="number" value={batteryReduction === 0 ? "" : batteryReduction} onChange={(event) => setBatteryReduction(Math.min(manualVehiclePrice, Math.max(0, Number(event.target.value) || 0)))} placeholder="请按实际方案填写" />
                    <small className="input-help">不自动填入。计入贷款的车辆金额 = 购车金额 − 你填写的租电减免。</small>
                  </label>
                )}
              </div>
            )}

            <div className="control-group">
                <span className="control-label">金融方案</span>
                <div className="segmented">
                  <button type="button" className={financeMode === "equal-payment" ? "active" : ""} onClick={() => setFinanceMode("equal-payment")}>等额本息</button>
                  <button type="button" className={financeMode === "equal-principal" ? "active" : ""} onClick={() => setFinanceMode("equal-principal")}>等额本金</button>
                  <button type="button" className={financeMode === "interest-free" ? "active" : ""} onClick={() => { setFinanceMode("interest-free"); setAnnualRate(0); }}>免息分期</button>
                </div>
              </div>

            <details className="calculator-details bill-details">
              <summary>账单信息（可选）</summary>
              <div className="bill-form-grid calculator-details-body">
              <label className="budget-input">
                <span>用户称呼</span>
                <input type="text" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="例如：周先生 / 王女士" />
              </label>
              <label className="budget-input">
                <span>账单标题</span>
                <input type="text" value={billTitle} onChange={(event) => setBillTitle(event.target.value)} placeholder="例如：家庭购车金融账单" />
              </label>
              <label className="budget-input bill-note">
                <span>账单备注</span>
                <textarea value={billNote} onChange={(event) => setBillNote(event.target.value)} rows={3} placeholder="例如：给家人一起看，主要关注月供和总成本。" />
              </label>
              </div>
            </details>
          </div>

          <aside className="estimate-panel finance-panel">
            <span className="estimate-kicker">{currentBrandLabel} · {nioBaasEnabled ? "BaaS 租电" : "整车购买"}</span>
            <strong className="estimate-total">{formatPrice(monthlyLoanPayment)}<small>/ 月</small></strong>
            <p>当前贷款方案的参考月供；持有和用车费用在下方单独计算。</p>

            <div className="total-interest-summary">
              <div><span>按当前结清期数的总利息</span><strong>{formatPrice(interestPaidThroughSettlement)}</strong></div>
            </div>

            <div className="finance-tab-list" role="tablist" aria-label="金融结果切换">
              <button type="button" role="tab" aria-selected={financeTab === "summary"} className={financeTab === "summary" ? "active" : ""} onClick={() => setFinanceTab("summary")}>摘要</button>
              <button type="button" role="tab" aria-selected={financeTab === "details"} className={financeTab === "details" ? "active" : ""} onClick={() => setFinanceTab("details")}>明细</button>
            </div>

            {financeTab === "summary" ? (
              <>
                <div className="finance-metrics">
                  <div><span>贷款本金</span><strong>{formatPrice(loanPrincipal)}</strong></div>
                  <div><span>首付现金</span><strong>{formatPrice(downPaymentAmount)}</strong></div>
                  <div><span>总利息（至结清）</span><strong>{formatPrice(interestPaidThroughSettlement)}</strong></div>
                  <div><span>金融服务费</span><strong>{formatPrice(financeServiceFee)}</strong></div>
                  <div><span>结清前总还款</span><strong>{formatPrice(loanTotalRepayment)}</strong></div>
                  <div><span>方案标示费率</span><strong>{displayedRateLabel}</strong></div>
                  <div className="irr-metric"><span>综合年化融资成本（IRR）</span><strong>{formatIrr(loanIrrPercent)}</strong></div>
                </div>
                <p className="input-help irr-note">
                  综合年化融资成本按贷款本金、相关费用与每期还款现金流反推，更适合比较不同方案；最终以金融机构明示表、提前结清规则和合同为准。
                </p>
              </>
            ) : (
              <div className="finance-details-card">
                <div className="finance-detail-row"><span>贷款期数</span><strong>{loanTermMonths} 期</strong></div>
                <div className="finance-detail-row"><span>结清期数</span><strong>{settlementMonth} 期</strong></div>
                <div className="finance-detail-row"><span>结清金额</span><strong>{formatPrice(settlementAmount)}</strong></div>
                <div className="finance-detail-row"><span>融资费用（利息 + 服务费）</span><strong>{formatPrice(financingCost)}</strong></div>
                <div className="finance-detail-row"><span>其中：总利息（至结清）</span><strong>{formatPrice(interestPaidThroughSettlement)}</strong></div>
                <div className="finance-detail-row"><span>其中：金融服务费</span><strong>{formatPrice(financeServiceFee)}</strong></div>
                <div className="finance-detail-row"><span>方案标示费率 / 综合年化成本</span><strong>{displayedRateLabel} / {formatIrr(loanIrrPercent)}</strong></div>
              </div>
            )}

            <div className="repayment-chart" aria-label="前 12 个月还款趋势">
              <div className="chart-head">
                <strong>前 12 个月月供趋势</strong>
                <small>{financeMode === "equal-principal" ? `末月 ${formatPrice(loanQuote.lastPayment)}` : `${financeYears} 年共 ${loanTermMonths} 期`}</small>
              </div>
              <div className="chart-bars">
                {repaymentSamples.map((payment, index) => (
                  <span key={`${payment}-${index}`} style={{ height: `${Math.max(8, (payment / repaymentChartMax) * 100)}%` }} title={`第 ${index + 1} 个月：${formatPrice(payment)}`} />
                ))}
              </div>
            </div>

            {currentBrandReference && <a href={currentBrandReference.officialUrl} target="_blank" rel="noreferrer">核对该品牌价格来源 →</a>}
            <div className="bill-actions">
              <button type="button" onClick={saveCurrentBill}>保存到账单库</button>
              <button type="button" onClick={() => exportCurrentBill("csv")}>导出表格 CSV</button>
              <button type="button" onClick={() => exportCurrentBill("html")}>导出文档 HTML</button>
            </div>
            {billSaveStatus && <p className="bill-save-status" role="status">{billSaveStatus}</p>}
            <p className="muted-note">{authUser ? "当前为云端保存，登录同一账户即可跨设备查看。" : "未登录时只保存在当前浏览器；登录后可跨设备保存。"} 导出的表格和文档可直接发给家人、顾问或自己留档。</p>
          </aside>
        </div>

        <section className="upfront-section" aria-labelledby="upfront-heading">
          <div className="calculator-step-heading">
            <span>步骤 2</span>
            <div><h3 id="upfront-heading">税费、保险与首次付款</h3><p>保险、购置税和上牌等不进入贷款本金，单独形成首次付款清单。</p></div>
          </div>

          <div className="upfront-shell">
            <div className="upfront-input-panel">
              <div className="control-group">
                <span className="control-label">购置税口径</span>
                <div className="segmented">
                  <button type="button" className={purchaseTaxMode === "new-energy" ? "active" : ""} onClick={() => setPurchaseTaxMode("new-energy")}>新能源减半</button>
                  <button type="button" className={purchaseTaxMode === "regular" ? "active" : ""} onClick={() => setPurchaseTaxMode("regular")}>普通车辆 10%</button>
                </div>
              </div>
              <div className="control-grid upfront-input-grid">
                <label className="budget-input">
                  <span>首年保险</span>
                  <input min="0" step="100" type="number" value={insuranceFee === 0 ? "" : insuranceFee} onChange={(event) => setInsuranceFee(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="budget-input">
                  <span>上牌登记</span>
                  <input min="0" step="100" type="number" value={registrationFee === 0 ? "" : registrationFee} onChange={(event) => setRegistrationFee(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="budget-input">
                  <span>其他首次付款杂项</span>
                  <input min="0" step="100" type="number" value={otherUpfrontFee === 0 ? "" : otherUpfrontFee} onChange={(event) => setOtherUpfrontFee(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="budget-input">
                  <span>增值税折算率</span>
                  <input min="0" max="20" step="0.5" type="number" value={vatRate === 0 ? "" : vatRate} onChange={(event) => setVatRate(Math.min(20, Math.max(0, Number(event.target.value) || 0)))} />
                </label>
              </div>
            </div>

            <aside className="upfront-result-panel">
              <span className="estimate-kicker">首次付款金额</span>
              <strong className="upfront-total">{formatPrice(firstPaymentAmount)}</strong>
              <p>首付、购置税、首年保险、上牌、其他杂项与金融服务费之和，不含后续贷款月供；金融服务费默认在首次付款时支付。</p>
              <div className="fee-list upfront-fee-list">
                {upfrontFeeItems.map((item) => (
                  <div className="fee-row" key={item.label}>
                    <div><strong>{item.label}</strong><small>{item.note}</small></div>
                    <span>{formatPrice(item.amount)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="ownership-section" aria-labelledby="ownership-heading">
          <div className="calculator-step-heading">
            <span>步骤 3</span>
            <div><h3 id="ownership-heading">月持有与持有年限费用</h3><p>贷款结果不变，在这里单独估算养车支出。</p></div>
          </div>

          <div className="ownership-shell">
            <div className="ownership-input-panel">
              <div className="control-grid ownership-input-grid">
                <label className="budget-input">
                  <span>持有年限</span>
                  <input min="0" max="10" step="1" type="number" value={ownershipYears === 0 ? "" : ownershipYears} onChange={(event) => setOwnershipYears(Math.min(10, Math.max(0, Number(event.target.value) || 0)))} />
                  <small className="input-help">用于计算这段时间内的总用车费用。</small>
                </label>
                {nioBaasEnabled && (
                  <label className="budget-input">
                    <span>BaaS 电池月租</span>
                    <input min="0" step="50" type="number" value={batteryRentMonthly === 0 ? "" : batteryRentMonthly} onChange={(event) => setBatteryRentMonthly(Math.max(0, Number(event.target.value) || 0))} />
                    <small className="input-help">请按实际合同填写，计入月持有费用。</small>
                  </label>
                )}
                <label className="budget-input">
                  <span>月充电 / 换电</span>
                  <input min="0" step="50" type="number" value={chargingMonthly === 0 ? "" : chargingMonthly} onChange={(event) => setChargingMonthly(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="budget-input">
                  <span>月停车</span>
                  <input min="0" step="50" type="number" value={parkingMonthly === 0 ? "" : parkingMonthly} onChange={(event) => setParkingMonthly(Math.max(0, Number(event.target.value) || 0))} />
                </label>
                <label className="budget-input">
                  <span>月保养及杂费</span>
                  <input min="0" step="50" type="number" value={maintenanceMonthly === 0 ? "" : maintenanceMonthly} onChange={(event) => setMaintenanceMonthly(Math.max(0, Number(event.target.value) || 0))} />
                </label>
              </div>

            </div>

            <aside className="ownership-result-panel">
              <span className="estimate-kicker">不含贷款月供的月持有费用</span>
              <strong className="ownership-monthly-total">{formatPrice(monthlyOwnershipCost)}<small>/ 月</small></strong>
              <p>BaaS 月租、补能、停车和保养杂费之和；贷款月供已在上方单独展示。</p>
              <div className="ownership-summary-grid">
                <div><span>{ownershipYears} 年使用费用</span><strong>{formatPrice(usageCost)}</strong></div>
                <div><span>{ownershipYears} 年总支出</span><strong>{formatPrice(ownershipTotal)}</strong></div>
              </div>
              <div className="cost-breakdown" aria-label="持有期成本构成">
                <div className="cost-breakdown-head"><span>持有期成本构成</span><strong>{formatPrice(ownershipTotal)}</strong></div>
                {costBreakdown.map((item) => (
                  <div className="cost-breakdown-row" key={item.key}>
                    <div><span>{item.label}</span><strong>{formatPrice(item.amount)}</strong></div>
                    <div className="cost-track" aria-hidden="true"><span className={`cost-fill ${item.key}`} style={{ width: `${Math.max(2, (item.amount / Math.max(ownershipTotal, 1)) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <details className="calculator-details calculator-support">
          <summary>最后查看：一次性付款清单、月费用明细与计算口径</summary>
          <div className="cost-checklist calculator-details-body">
            <section>
              <p className="eyebrow">Upfront cost</p>
              <h3>首次付款清单</h3>
              <div className="fee-list">
                {upfrontFeeItems.map((item) => (
                  <div className="fee-row" key={item.label}>
                    <div><strong>{item.label}</strong><small>{item.note}</small></div>
                    <span>{formatPrice(item.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <p className="eyebrow">Monthly cost</p>
              <h3>每月持有清单</h3>
              <div className="fee-list">
                {ownershipMonthlyFeeItems.map((item) => (
                  <div className="fee-row" key={item.label}>
                    <div><strong>{item.label}</strong><small>{item.note}</small></div>
                    <span>{formatPrice(item.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="formula-card">
              <p className="eyebrow">Formula</p>
              <h3>计算口径</h3>
              <p>等额本息：月供 = 本金 × 月利率 × (1 + 月利率)^期数 ÷ [(1 + 月利率)^期数 - 1]。</p>
              <p>等额本金：每月偿还固定本金，利息按剩余本金递减。免息分期：贷款本金 ÷ 分期期数。</p>
              <p>购置税估算：含税成交价先按增值税折算率还原为不含税计税价，再按所选税收口径估算。蔚来公司品牌的 BaaS 减免由用户手动填写，月租作为长期月度成本单独展示。</p>
              <p>综合年化融资成本采用 IRR 复利口径，默认把金融服务费视为放款当期由借款人承担的贷款相关费用。<a href="https://xining.pbc.gov.cn/goutongjiaoliu/113456/113469/2025092212551432728/index.html" target="_blank" rel="noreferrer">查看中国人民银行口径 →</a></p>
            </section>
          </div>
        </details>

        <div className="bill-library">
          <section className="library-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Bill library</p>
                <h3>保存下来的账单</h3>
              </div>
              <p className="section-lead">每一份账单都带有人名、标题和备注，点一下就能回填继续改。</p>
            </div>
            {savedBills.length > 0 ? (
              <div className="saved-bill-list">
                {savedBills.map((item) => (
                  <article className="saved-bill-card" key={item.id}>
                    <div>
                      <span>{item.snapshot.customerName}</span>
                      <h4>{item.snapshot.billTitle}</h4>
                      <p>
                        {item.snapshot.currentModelName} / {item.snapshot.currentTrimName} · {item.snapshot.generatedAt}
                      </p>
                    </div>
                    <p className="saved-bill-note">{item.snapshot.billNote}</p>
                    <div className="saved-bill-actions">
                      <button type="button" onClick={() => loadSavedBill(item)}>回填编辑</button>
                      <button type="button" onClick={() => exportBillSnapshot(item.snapshot, "csv")}>CSV</button>
                      <button type="button" onClick={() => exportBillSnapshot(item.snapshot, "html")}>文档</button>
                      <button type="button" onClick={() => deleteSavedBill(item.id)}>删除</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-note">还没有保存过账单。先调好参数，点“保存到账单库”试一次。</p>
            )}
          </section>
        </div>
      </section>}

      {activeWorkspace === "home" && <section className="contact-section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow">Contact</p>
          <h2>想交流一个问题，或者给这间工作室提建议，可以从这里开始。</h2>
          <p>如果你有建议、遇到问题，或者希望我补充某项工具与内容，可以直接留言。留言会进入我的反馈列表，不会公开展示。</p>
          <div className="contact-methods">{contactMethods.map((method) => <a className="contact-method" href={method.href} key={method.label} target={method.label === "小红书号" ? "_blank" : undefined} rel={method.label === "小红书号" ? "noreferrer" : undefined}><span>{method.label}</span><strong>{method.value}</strong></a>)}</div>
        </div>
        <form className="feedback-card" onSubmit={submitFeedback} aria-labelledby="feedback-heading">
          <p className="eyebrow">Feedback</p>
          <h3 id="feedback-heading">留言与建议</h3>
          <p className="feedback-note">提交前请不要填写身份证号、银行卡号或其他不必要的敏感信息。</p>
          <label className="feedback-field"><span>你想告诉我什么？</span><select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as FeedbackType)}><option value="suggestion">功能建议</option><option value="question">想问一个问题</option><option value="experience">使用体验</option></select></label>
          <label className="feedback-field"><span>留言内容</span><textarea required minLength={2} maxLength={2000} rows={5} value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} placeholder="例如：希望补充某个主题、工具，或者哪里使用起来不顺手。" /></label>
          <label className="feedback-field"><span>联系方式（选填）</span><input type="text" maxLength={200} value={feedbackContact} onChange={(event) => setFeedbackContact(event.target.value)} placeholder="邮箱、微信号或手机号，方便我回复你" /></label>
          <label className="feedback-honeypot" aria-hidden="true">网站<input tabIndex={-1} autoComplete="off" value={feedbackWebsite} onChange={(event) => setFeedbackWebsite(event.target.value)} /></label>
          <button className="feedback-submit" type="submit" disabled={feedbackStatus === "sending"}>{feedbackStatus === "sending" ? "正在提交…" : "提交留言"}</button>
          {feedbackStatusText && <p className={feedbackStatus === "success" ? "feedback-status success" : "feedback-status error"} role="status">{feedbackStatusText}</p>}
        </form>
        {authUser?.role === "admin" && (
          <aside className="admin-inbox" aria-labelledby="admin-inbox-heading">
            <div className="admin-inbox-head">
              <div>
                <p className="eyebrow">Admin inbox</p>
                <h3 id="admin-inbox-heading">文章讨论、留言与用户账单</h3>
                <p>文章讨论可以审核、隐藏并原位回复；账单仅展示用户主动保存到云端的内容。</p>
              </div>
              <button type="button" onClick={loadAdminInbox}>{adminInboxOpen ? "刷新收件箱" : "打开收件箱"}</button>
            </div>
            {adminInboxOpen && (
              <div className="admin-inbox-grid">
                <section className="admin-comment-section">
                  <div className="admin-list-title"><strong>文章讨论</strong><span>{adminCommentItems.length} 条</span></div>
                  {adminCommentItems.length > 0 ? adminCommentItems.slice(0, 30).map((item) => (
                    <article className="admin-inbox-item admin-comment-item" key={item.id}>
                      <div><strong>{commentCategoryLabels[item.category] ?? "互动"} · {item.status === "pending" ? "待审核" : item.status === "published" ? "已公开" : "已隐藏"}</strong><time>{item.createdAt}</time></div>
                      <small>{item.contentTitle} · {item.authorName}</small>
                      {item.anchorText && <blockquote>“{item.anchorText}”</blockquote>}
                      <p>{item.message}</p>
                      <div className="admin-comment-actions">
                        {item.status !== "published" && <button type="button" onClick={() => void updateAdminCommentStatus(item.id, "published")}>公开</button>}
                        {item.status !== "hidden" && <button type="button" onClick={() => void updateAdminCommentStatus(item.id, "hidden")}>隐藏</button>}
                      </div>
                      {!item.parentId && <div className="admin-inline-reply"><textarea rows={2} value={adminReplyDrafts[item.id] ?? ""} onChange={(event) => setAdminReplyDrafts((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={item.status === "published" ? "写下回复并公开到原文…" : "先公开原留言，再进行回复"} disabled={item.status !== "published"} /><button type="button" onClick={() => void replyToAdminComment(item)} disabled={item.status !== "published"}>回复并公开</button></div>}
                    </article>
                  )) : <p className="admin-empty">目前还没有文章讨论。</p>}
                </section>
                <section>
                  <div className="admin-list-title"><strong>最新留言</strong><span>{adminFeedbackItems.length} 条</span></div>
                  {adminFeedbackItems.length > 0 ? adminFeedbackItems.slice(0, 20).map((item) => (
                    <article className="admin-inbox-item" key={item.id}>
                      <div><strong>{item.type}</strong><time>{item.createdAt}</time></div>
                      <p>{item.message}</p>
                      <small>{item.userEmail || item.contact || "匿名留言"}</small>
                    </article>
                  )) : <p className="admin-empty">目前还没有留言。</p>}
                </section>
                <section>
                  <div className="admin-list-title"><strong>云端账单</strong><span>{adminBillItems.length} 份</span></div>
                  {adminBillItems.length > 0 ? adminBillItems.slice(0, 20).map((item) => (
                    <article className="admin-inbox-item" key={item.id}>
                      <div><strong>{item.title}</strong><time>{item.createdAt}</time></div>
                      <p>{item.snapshot.currentModelName} · {item.snapshot.currentTrimName} · {formatPrice(item.snapshot.ownershipTotal)}</p>
                      <small>{item.userEmail || "未知账户"}</small>
                    </article>
                  )) : <p className="admin-empty">目前还没有云端账单。</p>}
                </section>
              </div>
            )}
          </aside>
        )}
      </section>}

      <footer className="site-footer">
        <div><strong>周多福个人工作室</strong><span>教程 · 记录 · 开放工具</span></div>
        <p>累计访问 <strong>{visitCount === null ? "—" : new Intl.NumberFormat("zh-CN").format(visitCount)}</strong> 次 · 仅统计总访问次数，不记录访客身份</p>
      </footer>

      {authOpen && (
        <div className="auth-backdrop" role="presentation" onMouseDown={() => setAuthOpen(false)}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-heading" onMouseDown={(event) => event.stopPropagation()}>
            <button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="关闭账户窗口">×</button>
            {authUser ? (
              <div className="account-summary">
                <p className="eyebrow">My account</p>
                <h2 id="auth-dialog-heading">我的账户</h2>
                <div className="account-email"><span>登录邮箱</span><strong>{authUser.email}</strong></div>
                <p>你的账单会保存在云端，登录同一账户即可跨设备查看。你仍然可以逐份删除自己的账单。</p>
                <div className="auth-actions">
                  {authUser.role === "admin" && <button type="button" className="auth-primary" onClick={() => { setAuthOpen(false); goToContact(); void loadAdminInbox(); }}>查看管理员收件箱</button>}
                  <button type="button" className="auth-secondary" onClick={logoutUser}>退出登录</button>
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow">Cloud account</p>
                <h2 id="auth-dialog-heading">{authMode === "login" ? "登录并继续查看账单" : "创建你的云端账户"}</h2>
                <p className="auth-intro">不登录也能使用计算器；只有需要跨设备保存账单时才需要账户。</p>
                <div className="auth-tabs" role="tablist" aria-label="账户操作">
                  <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthStatusText(""); }}>登录</button>
                  <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setAuthStatusText(""); }}>注册</button>
                </div>
                <form className="auth-form" onSubmit={submitAuth}>
                  <label><span>邮箱</span><input required type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="name@example.com" /></label>
                  <label><span>密码</span><input required minLength={8} type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="至少 8 位" /></label>
                  {authMode === "register" && (
                    <div className="service-notice">
                      <strong>注册前请确认</strong>
                      <ul>
                        <li>你主动保存的账单会存入云端，用于跨设备查看和继续计算。</li>
                        <li>网站管理员可以查看账单摘要及你主动提交的留言；文章批注经审核后会公开显示。</li>
                        <li>请不要在账单或留言中填写身份证、银行卡等不必要的敏感信息。</li>
                        <li>你可以随时删除自己的单份账单；账户注销功能将在后续版本提供。</li>
                      </ul>
                      <label className="auth-consent"><input type="checkbox" checked={authConsent} onChange={(event) => setAuthConsent(event.target.checked)} /><span>我已阅读并同意以上服务提示</span></label>
                    </div>
                  )}
                  <button className="auth-primary" type="submit" disabled={authSubmitting}>{authSubmitting ? "正在处理…" : authMode === "login" ? "登录" : "同意并注册"}</button>
                  {authStatusText && <p className="auth-status" role="status">{authStatusText}</p>}
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
