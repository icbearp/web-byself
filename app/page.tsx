"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateAnnualizedIrr } from "./finance-math";

type ModelKey = "l60" | "l80" | "l90";
type PurchaseMode = "vehicle" | "baas";
type ScenarioKey = "commute" | "kids" | "travel" | "parents";
type ColumnKey = "car" | "efficiency" | "information" | "life";
type RecordCategoryKey = "car-info" | "career-growth" | "life-efficiency" | "side-project";
type StageKey = "plan" | "online" | "offline" | "compare" | "experience" | "budget" | "communication" | "order" | "delivery" | "ownership";
type FinanceMode = "equal-payment" | "equal-principal" | "interest-free";
type PurchaseTaxMode = "new-energy" | "regular";
type FinancePlanKey = "nio-five-year" | "nio-seven-year" | "custom";
type WorkspaceKey = "home" | "records" | "car" | "finance" | "life";
type HomeViewKey = "quick" | "about" | "columns";

type Trim = {
  name: string;
  vehiclePrice: number;
  baasPrice: number;
  tag: string;
  bestFor: string;
};

type KnownOption = {
  id: string;
  label: string;
  price: number;
  note: string;
  models: ModelKey[];
  excludedTrim?: string;
};

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

type DailyRecord = {
  id: string;
  date: string;
  category: RecordCategoryKey;
  stage?: StageKey;
  tags: string[];
  title: string;
  paragraphs: string[];
  takeaway: string;
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
  selectedModel: ModelKey;
  selectedTrim: string;
  purchaseMode: PurchaseMode;
  financePlan: FinancePlanKey;
  financeMode: FinanceMode;
  purchaseTaxMode: PurchaseTaxMode;
  manualVehiclePrice: number;
  selectedOptions: string[];
  customBudget: number;
  downPaymentRate: number;
  financeYears: number;
  annualRate: number;
  fiveYearPayoffMonth: number;
  ownershipYears: number;
  vatRate: number;
  insuranceFee: number;
  registrationFee: number;
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
  { key: "home", label: "首页", description: "认识周多福与四个长期栏目" },
  { key: "records", label: "每日记录", description: "按日期、标签和购车阶段回看" },
  { key: "car", label: "购车与车型", description: "乐道车型、家庭场景与官方信息" },
  { key: "finance", label: "金融计算", description: "落地成本、月供、BaaS 与账单" },
  { key: "life", label: "效率生活", description: "职场成长、效率方法与业余沉淀" },
];

const profile = {
  name: "周多福",
  role: "乐道购车顾问 / 生活方式记录者",
  intro:
    "我把真实的工作经验、购车判断和日常效率整理成容易使用的内容。这里不急着说服你，而是帮你把问题问清楚，再做适合自己的选择。",
  promise: ["讲清楚价格和边界", "尊重每个家庭的生活方式", "把能复用的方法留下来"],
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
    label: "职场成长",
    title: "把销售、沟通和长期信任做成可复用的方法",
    intro: "沉淀顾问式销售、用户关系、表达方式、复盘习惯和个人成长，服务自己的职业积累。",
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

const dailyRecords: DailyRecord[] = [
  {
    id: "2026-07-29-content-collections",
    date: "2026-07-29",
    category: "career-growth",
    tags: ["#网站整理", "#内容集合", "#长期积累"],
    title: "内容不是越堆越多，而是要慢慢长成清晰的集合",
    paragraphs: [
      "今天重新看这个独立站，我意识到每日记录不能只是往下堆。前两篇记录一多，页面就会变长；以后如果持续更新几十篇、上百篇，访客反而更难找到真正需要的内容。",
      "所以网站需要从“流水账”变成“内容集合”：按日期能回看当天记录，按话题能看同一类经验，按买车阶段能直接进入当前最相关的问题。这样首页保持简洁，但内容不会被折叠到没人看见。",
      "这件事也很像做用户服务。用户不需要我把所有信息一次性倒给他，而是需要在合适的阶段看到合适的内容。好的整理，本质上是在降低对方理解和决策的成本。",
    ],
    takeaway: "长期内容要有分类、有路径、有入口；不是让页面显得很多，而是让用户更快找到对自己有用的那一篇。",
  },
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
    key: "car",
    label: "乐道 / 蔚来购车",
    title: "从用车场景出发，而不是从配置表出发",
    copy: "把通勤、家庭、预算、补能和保值预期放在一起，讲清楚适合与不适合。",
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
    id: "car-fit",
    column: "car",
    title: "怎样判断一辆车是否适合你的真实生活？",
    excerpt: "先不看配置表，先把每天的路线、停车、家庭成员和长途频率列出来。",
    body: "车不是一张参数成绩单，而是每天都要参与生活的工具。判断一台车，先从最常发生的场景开始，再看空间、补能、舒适和预算能不能一起成立。",
    points: ["先记录一周真实出行，而不是凭想象买车", "把最常坐车的人放进决策中心", "把整车购买、BaaS 和长期用车成本分开算"],
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

const models: Record<
  ModelKey,
  {
    name: string;
    subtitle: string;
    headline: string;
    image: string;
    visualNote: string;
    officialUrl: string;
    sourceLabel: string;
    trims: Trim[];
    highlights: string[];
    lifestyle: string;
    advisorNote: string;
  }
> = {
  l60: {
    name: "乐道 L60",
    subtitle: "家庭智能电动 SUV",
    headline: "适合把通勤、接送、周末出游放在同一辆车里解决的家庭。",
    image: "/images/home-hero.png",
    visualNote: "家庭出行场景参考",
    officialUrl: "https://www.onvo.cn/l60",
    sourceLabel: "官网车型页与焕新信息",
    trims: [
      { name: "Pro", vehiclePrice: 192800, baasPrice: 135800, tag: "入门够用", bestFor: "预算清晰、主要城市通勤和短途家庭出行。" },
      { name: "Max", vehiclePrice: 202800, baasPrice: 145800, tag: "均衡推荐", bestFor: "想要更完整舒适体验，又不追求一步到顶。" },
      { name: "Ultra", vehiclePrice: 222800, baasPrice: 165800, tag: "配置拉满", bestFor: "经常带家人长途，重视后排陪伴和娱乐体验。" },
    ],
    highlights: ["全系基于 900V 高压架构，主打更高效的补能和能耗表现。", "后排舒享娱乐套装在 Ultra 版标配，Pro/Max 可按需求选装。", "更像一台日常家用车：重点不是炫参数，而是接送、购物、露营都少折腾。"],
    lifestyle: "如果你每天在城市里跑固定路线，周末偶尔带孩子去近郊，L60 是最容易解释预算的一台。",
    advisorNote: "先把停车位、常坐人数、后排娱乐需求问清楚，再决定 Pro、Max 或选装。",
  },
  l80: {
    name: "乐道 L80",
    subtitle: "智能双舱大五座旗舰 SUV",
    headline: "给重视空间、装载和舒适体验的五口之家准备的大五座方案。",
    image: "/images/family-planning.png",
    visualNote: "家庭装载场景参考",
    officialUrl: "https://www.onvo.cn/l80",
    sourceLabel: "官网车型页与上市信息",
    trims: [
      { name: "Pro", vehiclePrice: 242800, baasPrice: 156800, tag: "大五座入门", bestFor: "刚需大五座空间，但预算仍希望可控。" },
      { name: "Max", vehiclePrice: 259800, baasPrice: 173800, tag: "家庭主力", bestFor: "多数家庭最值得重点试驾的版本。" },
      { name: "Ultra", vehiclePrice: 279800, baasPrice: 193800, tag: "高配舒适", bestFor: "老人孩子常坐第二排，长途舒适优先。" },
    ],
    highlights: ["官方定位智能双舱大五座旗舰 SUV，重点解决空间与装载的日常痛点。", "双舱空间适合家庭采购、亲子出行、骑行和露营装备。", "BaaS 方案门槛明显下降，适合先算首付压力再看长期用车成本。"],
    lifestyle: "L80 不只是变大，而是把婴儿车、骑行装备、露营用品和日常采购都装得更从容。",
    advisorNote: "试驾时重点体验前备舱、后备舱、二排舒适度和装载灵活性，模拟一次真实家庭出行。",
  },
  l90: {
    name: "乐道 L90",
    subtitle: "家庭旗舰大三排 SUV",
    headline: "适合把车当成家庭移动客厅，也在意体面、空间和长途效率的人。",
    image: "/images/family-planning.png",
    visualNote: "多人出行场景参考",
    officialUrl: "https://www.onvo.cn/l90",
    sourceLabel: "官网车型页与上市信息",
    trims: [
      { name: "Pro", vehiclePrice: 265800, baasPrice: 179800, tag: "旗舰门槛", bestFor: "想要 L90 空间气场，预算也要稳住。" },
      { name: "Max", vehiclePrice: 289800, baasPrice: 193800, tag: "高频推荐", bestFor: "大家庭长途频率高，希望舒适和智能都更完整。" },
      { name: "Ultra", vehiclePrice: 299800, baasPrice: 213800, tag: "一步到位", bestFor: "第二排体验、座舱氛围和家人满意度优先。" },
    ],
    highlights: ["官方强调“6 人 10 箱”和 240L 智能电动前备舱，适合多人满载旅行。", "提供六座或七座布局，适合二孩家庭、三代同堂和长途出行。", "更适合把全家人的舒适都放进决策，而不是只看驾驶者一个人的感受。"],
    lifestyle: "如果你经常全家出远门，L90 会把座位、行李、老人舒适和孩子路上体验这些争论变少。",
    advisorNote: "看 L90 时别只问最低价，要问满员满载是否舒服、停车是否有压力。",
  },
};

const knownOptions: KnownOption[] = [
  { id: "l60-rear-entertainment", label: "后排舒享娱乐套装", price: 10000, note: "该套装价格为 10,000 元；L60 Ultra 已标配。", models: ["l60"], excludedTrim: "Ultra" },
];

const financePresets: Array<{
  key: FinancePlanKey;
  label: string;
  note: string;
  badge: string;
  downPaymentRate?: number;
  termYears?: number;
  annualRate?: number;
  mode?: FinanceMode;
}> = [
  {
    key: "nio-five-year",
    label: "官方 5 年免 3 年利息",
    note: "前 3 年年化费率 0%，后 2 年年化费率 3%，满 3 年可申请一次性还清。",
    badge: "0% / 3%",
    downPaymentRate: 0,
    termYears: 5,
    annualRate: 3,
  },
  {
    key: "nio-seven-year",
    label: "官方 7 年超低息",
    note: "年化费率 0.99%，三个月后可申请一次性还清。",
    badge: "0.99%",
    downPaymentRate: 20,
    termYears: 7,
    annualRate: 0.99,
  },
  {
    key: "custom",
    label: "高自由度自定义",
    note: "自己填首付、年限、费率、月供方式，适合做个人测算。",
    badge: "自由填写",
    downPaymentRate: 30,
    termYears: 5,
    annualRate: 3.5,
    mode: "equal-payment",
  },
];

const scenarios: Record<ScenarioKey, { label: string; title: string; model: ModelKey; story: string; checklist: string[] }> = {
  commute: { label: "通勤 + 接送", title: "工作日像闹钟一样准时，车要帮你省心。", model: "l60", story: "每天固定路线上下班、接孩子、买菜，最怕停车难、补能焦虑和车机不好用。这个场景先看 L60，再判断是否需要后排娱乐套装。", checklist: ["车位尺寸", "每日通勤里程", "孩子是否常坐后排", "附近补能是否方便"] },
  kids: { label: "二孩家庭", title: "不只多一个座位，而是少很多家庭摩擦。", model: "l90", story: "两个安全座椅、老人同乘、婴儿车和书包一起上车，L90 的六座或七座布局会比纸面参数更有说服力。试驾时一定要模拟真实座位分配。", checklist: ["6 座或 7 座", "第三排进出", "安全座椅位置", "满员后备厢"] },
  travel: { label: "长途旅行", title: "长途不是拼忍耐，是让每个人都还有余量。", model: "l90", story: "一年有几次跨城、露营或返乡，车就不能只服务驾驶者。L90 的重点是满载空间、前备舱、二三排舒适和补能路线。", checklist: ["满载行李", "老人乘坐时长", "高速补能规划", "露营 / 运动装备"] },
  parents: { label: "带父母出行", title: "好车感，往往来自上下车和坐久了不累。", model: "l80", story: "父母不一定关心智驾和算力，但会立刻感受到座椅、车内安静和上下车姿态。L80/L90 都值得看，先由车位和预算决定。", checklist: ["上下车便利", "第二排坐姿", "晕车敏感度", "空调和座椅舒适"] },
};

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

function calculateFlatFeeLoan(principal: number, months: number, annualFeeRate: number, years: number): LoanQuote {
  const safeMonths = Math.max(1, Math.round(months));
  const balanceStart = Math.max(0, principal);
  const totalInterest = balanceStart * (annualFeeRate / 100) * years;
  const monthlyPrincipal = balanceStart / safeMonths;
  const monthlyFee = totalInterest / safeMonths;
  let balance = balanceStart;
  const remainingPrincipalByMonth = [balanceStart];
  const principalPayments: number[] = [];
  const monthlyPayments = Array.from({ length: safeMonths }, () => {
    balance = Math.max(0, balance - monthlyPrincipal);
    principalPayments.push(monthlyPrincipal);
    remainingPrincipalByMonth.push(balance);
    return monthlyPrincipal + monthlyFee;
  });

  return {
    monthlyRate: annualFeeRate / 100 / 12,
    monthlyPayments,
    principalPayments,
    remainingPrincipalByMonth,
    totalPayment: balanceStart + totalInterest,
    totalInterest,
    firstPayment: monthlyPayments[0] ?? 0,
    lastPayment: monthlyPayments[safeMonths - 1] ?? 0,
  };
}

function calculateNioFiveYearQuote(principal: number): LoanQuote {
  const safePrincipal = Math.max(0, principal);
  const months = 60;
  const freeMonths = 36;
  const lowRateMonths = 24;
  const monthlyPrincipal = safePrincipal / months;
  const remainingAfterFree = safePrincipal - monthlyPrincipal * freeMonths;
  const lowInterestTotal = remainingAfterFree * 0.03 * 2;
  const lowMonthlyFee = lowInterestTotal / lowRateMonths;
  let balance = safePrincipal;
  const remainingPrincipalByMonth = [safePrincipal];
  const principalPayments: number[] = [];
  const monthlyPayments = Array.from({ length: months }, (_, index) => {
    balance = Math.max(0, balance - monthlyPrincipal);
    principalPayments.push(monthlyPrincipal);
    remainingPrincipalByMonth.push(balance);
    return index < freeMonths ? monthlyPrincipal : monthlyPrincipal + lowMonthlyFee;
  });

  return {
    monthlyRate: 0,
    monthlyPayments,
    principalPayments,
    remainingPrincipalByMonth,
    totalPayment: safePrincipal + lowInterestTotal,
    totalInterest: lowInterestTotal,
    firstPayment: monthlyPayments[0] ?? 0,
    lastPayment: monthlyPayments[months - 1] ?? 0,
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

function buildCsv(snapshot: FinanceBillSnapshot) {
  const rows = [
    ["分类", "项目", "金额（元）", "说明"],
    ["概要", "称呼", snapshot.customerName, snapshot.billTitle],
    ["概要", "车型", `${snapshot.currentModelName} / ${snapshot.currentTrimName}`, snapshot.purchaseMode === "baas" ? "BaaS 租电" : "整车购买"],
    ["概要", "金融方案", snapshot.financePlan, snapshot.planDescription],
    ["概要", "生成时间", snapshot.generatedAt, snapshot.billNote],
    ["一次性", "车辆小计", String(Math.round(snapshot.vehicleSubtotal)), "车辆成交价、官方选装、自定义预算"],
    ["一次性", "首付现金", String(Math.round(snapshot.downPaymentAmount)), `首付比例 ${snapshot.downPaymentRate}%`],
    ["一次性", "购置税", String(Math.round(snapshot.purchaseTax)), snapshot.purchaseTaxMode === "new-energy" ? "新能源减半口径" : "普通车辆 10% 口径"],
    ["一次性", "首年保险", String(Math.round(snapshot.insuranceFee)), "按实际报价替换"],
    ["一次性", "上牌登记", String(Math.round(snapshot.registrationFee)), "临牌、登记、代办等"],
    ["一次性", "金融服务费", String(Math.round(snapshot.financeServiceFee)), "如无则为 0"],
    ["每月", "金融月供", String(Math.round(snapshot.loanQuote.firstPayment)), snapshot.financeMode === "equal-principal" ? "首月月供，后续递减" : snapshot.financeMode === "interest-free" ? "免息分期" : "等额本息"],
    ["每月", "BaaS 月租", String(Math.round(snapshot.batteryRentMonthly)), snapshot.purchaseMode === "baas" ? "租电方案月费" : "未启用 BaaS"],
    ["每月", "充电 / 换电", String(Math.round(snapshot.chargingMonthly)), "按个人里程估算"],
    ["每月", "停车", String(Math.round(snapshot.parkingMonthly)), "车位或临停"],
    ["每月", "保养及杂费", String(Math.round(snapshot.maintenanceMonthly)), "洗车、耗材、轮胎等"],
    ["汇总", "贷款本金", String(Math.round(snapshot.loanPrincipal)), "扣除首付后的贷款金额"],
    ["汇总", "结清前已付利息", String(Math.round(snapshot.interestPaidThroughSettlement)), "按选择的结清期数估算"],
    ["汇总", "综合年化融资成本（IRR）", formatIrr(snapshot.loanIrrPercent), "含用户填写的金融服务费，按实际现金流估算"],
    ["汇总", "整车购置成本", String(Math.round(snapshot.vehicleCost)), "整车成交价 + 购置税 + 上牌登记"],
    ["汇总", "融资相关成本", String(Math.round(snapshot.financingCost)), "利息 + 金融服务费，不含贷款本金"],
    ["汇总", "使用年限成本", String(Math.round(snapshot.usageCost)), `保险、BaaS 和用车支出（${snapshot.ownershipYears} 年）`],
    ["汇总", "结清期数", String(snapshot.settlementMonth), "按当前方案估算的结清时间"],
    ["汇总", "结清金额", String(Math.round(snapshot.settlementAmount)), "结清期剩余本金参考"],
    ["汇总", `${snapshot.ownershipYears} 年总支出`, String(Math.round(snapshot.ownershipTotal)), "整车购置成本 + 融资相关成本 + 使用年限成本"],
  ];

  return rows.map((row) => row.map(makeCsvValue).join(",")).join("\n");
}

function buildBillDocument(snapshot: FinanceBillSnapshot) {
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
          <p class="lead">${escapeHtml(snapshot.customerName)} 的购车金融账单，生成于 ${escapeHtml(snapshot.generatedAt)}。车型：${escapeHtml(snapshot.currentModelName)} / ${escapeHtml(snapshot.currentTrimName)}。${escapeHtml(snapshot.planDescription)} ${escapeHtml(snapshot.billNote)}</p>
        </div>
        <div class="badge">${escapeHtml(snapshot.purchaseMode === "baas" ? "BaaS 租电方案" : "整车购买方案")}</div>
      </div>
      <div class="metrics">
        <div class="metric"><span>整车购置成本</span><strong>${formatPrice(snapshot.vehicleCost)}</strong></div>
        <div class="metric"><span>融资相关成本</span><strong>${formatPrice(snapshot.financingCost)}</strong></div>
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
        <p class="note">这份文档适合作为个人账单、家庭讨论页或销售沟通页使用。</p>
      </section>
    </div>
    <p class="footer">周多福 · 购车金融账单</p>
  </div>
</body>
</html>`;
}

export default function Home() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>("home");
  const [homeView, setHomeView] = useState<HomeViewKey>("quick");
  const [selectedRecordCategory, setSelectedRecordCategory] = useState<RecordCategoryKey | "all">("all");
  const [selectedStage, setSelectedStage] = useState<StageKey | "all">("all");
  const [selectedDailyId, setSelectedDailyId] = useState("2026-07-29-content-collections");
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | "all">("all");
  const [articleQuery, setArticleQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>("car-fit");
  const [expandedEfficiency, setExpandedEfficiency] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelKey>("l60");
  const [selectedTrim, setSelectedTrim] = useState("Max");
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("vehicle");
  const [manualVehiclePrice, setManualVehiclePrice] = useState(202800);
  const [financePlan, setFinancePlan] = useState<FinancePlanKey>("nio-five-year");
  const [financeMode, setFinanceMode] = useState<FinanceMode>("equal-payment");
  const [purchaseTaxMode, setPurchaseTaxMode] = useState<PurchaseTaxMode>("new-energy");
  const [downPaymentRate, setDownPaymentRate] = useState(20);
  const [financeYears, setFinanceYears] = useState(5);
  const [annualRate, setAnnualRate] = useState(3.5);
  const [fiveYearPayoffMonth, setFiveYearPayoffMonth] = useState(36);
  const [ownershipYears, setOwnershipYears] = useState(5);
  const [vatRate, setVatRate] = useState(13);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customBudget, setCustomBudget] = useState(0);
  const [insuranceFee, setInsuranceFee] = useState(5500);
  const [registrationFee, setRegistrationFee] = useState(800);
  const [financeServiceFee, setFinanceServiceFee] = useState(0);
  const [batteryRentMonthly, setBatteryRentMonthly] = useState(599);
  const [chargingMonthly, setChargingMonthly] = useState(300);
  const [parkingMonthly, setParkingMonthly] = useState(0);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("commute");
  const [financeTab, setFinanceTab] = useState<"summary" | "details">("summary");
  const [customerName, setCustomerName] = useState("周先生");
  const [billTitle, setBillTitle] = useState("乐道购车金融账单");
  const [billNote, setBillNote] = useState("用于家庭讨论、试驾沟通和长期预算确认。");
  const [savedBills, setSavedBills] = useState<SavedFinanceBill[]>([]);
  const [savedBillsLoaded, setSavedBillsLoaded] = useState(false);

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
      const matchesCategory = selectedRecordCategory === "all" || record.category === selectedRecordCategory;
      const matchesStage = selectedStage === "all" || record.stage === selectedStage;
      return matchesCategory && matchesStage;
    });
  }, [selectedRecordCategory, selectedStage]);

  const selectedDailyRecord = filteredDailyRecords.find((record) => record.id === selectedDailyId) ?? filteredDailyRecords[0] ?? dailyRecords[0];
  const activeCollection = selectedRecordCategory === "all" ? null : recordCollections.find((collection) => collection.key === selectedRecordCategory);

  const currentModel = models[selectedModel];
  const currentTrim = currentModel.trims.find((trim) => trim.name === selectedTrim) ?? currentModel.trims[0];
  const visibleOptions = knownOptions.filter((option) => option.models.includes(selectedModel));
  const optionTotal = useMemo(() => visibleOptions.reduce((total, option) => option.excludedTrim === currentTrim.name || !selectedOptions.includes(option.id) ? total : total + option.price, 0), [currentTrim.name, selectedOptions, visibleOptions]);
  const basePrice = manualVehiclePrice;
  const scenario = scenarios[selectedScenario];
  const vehicleSubtotal = basePrice + optionTotal + customBudget;
  const purchaseTax = calculatePurchaseTax(vehicleSubtotal, purchaseTaxMode, vatRate);
  const downPaymentAmount = (vehicleSubtotal * downPaymentRate) / 100;
  const loanPrincipal = Math.max(0, vehicleSubtotal - downPaymentAmount);
  const customLoanTermMonths = Math.max(1, Math.round(financeYears * 12));
  const loanTermMonths = financePlan === "nio-five-year" ? 60 : financePlan === "nio-seven-year" ? 84 : customLoanTermMonths;
  const ownershipMonths = Math.max(1, Math.round(ownershipYears * 12));
  const customLoanQuote = calculateLoanQuote(loanPrincipal, annualRate, customLoanTermMonths, financeMode);
  const officialFiveYearQuote = calculateNioFiveYearQuote(loanPrincipal);
  const officialSevenYearQuote = calculateFlatFeeLoan(loanPrincipal, 84, 0.99, 7);
  const loanQuote =
    financePlan === "nio-five-year"
      ? officialFiveYearQuote
      : financePlan === "nio-seven-year"
        ? officialSevenYearQuote
        : customLoanQuote;
  const displayedRateLabel =
    financePlan === "nio-five-year"
      ? "前 36 期 0% / 后 24 期 3%"
      : financePlan === "nio-seven-year"
        ? "0.99%"
        : formatPercent(annualRate);
  const selectedFinancePlan = financePresets.find((preset) => preset.key === financePlan) ?? financePresets[0];
  const earlyPayoffEligibleMonth = financePlan === "nio-five-year" ? 36 : financePlan === "nio-seven-year" ? 3 : 0;
  const earlyPayoffAmount =
    earlyPayoffEligibleMonth > 0
      ? loanQuote.remainingPrincipalByMonth[Math.min(earlyPayoffEligibleMonth, loanQuote.remainingPrincipalByMonth.length - 1)] ?? 0
      : 0;
  const settlementMonth =
    financePlan === "nio-five-year"
      ? Math.min(loanTermMonths, Math.max(36, Math.round(fiveYearPayoffMonth)))
      : Math.min(loanTermMonths, ownershipMonths);
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
  const planDescription =
    financePlan === "nio-five-year"
      ? `5 年 60 期：前 36 期年化费率 0%，后 24 期年化费率 3%；按第 ${settlementMonth} 期结清，金额约 ${formatPrice(settlementAmount)}。`
      : financePlan === "nio-seven-year"
        ? "7 年 84 期：按年化费率 0.99% 估算；满 3 期后可申请一次性结清。"
        : `自定义 ${financeYears || 0} 年 ${customLoanTermMonths} 期，按你输入的年化利率和还款方式估算。`;
  const monthlyLoanPayment = loanQuote.monthlyPayments[0] ?? 0;
  const loanPaymentsThroughSettlement = loanQuote.monthlyPayments.slice(0, settlementMonth).reduce((sum, payment) => sum + payment, 0);
  const batteryMonths = purchaseMode === "baas" ? ownershipMonths : 0;
  const batteryRentTotal = batteryRentMonthly * batteryMonths;
  const monthlyRunningCost = chargingMonthly + parkingMonthly + maintenanceMonthly;
  const vehicleCost = vehicleSubtotal + purchaseTax + registrationFee;
  const financingCost = Math.max(0, loanPaymentsThroughSettlement + settlementAmount - loanPrincipal + financeServiceFee);
  const interestPaidThroughSettlement = Math.max(0, financingCost - financeServiceFee);
  const usageCost = insuranceFee + batteryRentTotal + monthlyRunningCost * ownershipMonths;
  const ownershipTotal = vehicleCost + financingCost + usageCost;
  const repaymentSamples = loanQuote.monthlyPayments.slice(0, Math.min(12, loanQuote.monthlyPayments.length));
  const repaymentChartMax = Math.max(...repaymentSamples, 1);
  const upfrontFeeItems = [
    { label: "车辆成交价", amount: vehicleSubtotal, note: "裸车价、官方选装和自定义配置预算" },
    { label: "首付现金", amount: downPaymentAmount, note: `按车辆成交价的 ${formatPercent(downPaymentRate)} 估算` },
    { label: "购置税", amount: purchaseTax, note: purchaseTaxMode === "new-energy" ? "新能源车 2026-2027 减半口径，单车减免有上限" : "普通车辆按 10% 购置税口径估算" },
    { label: "首年保险", amount: insuranceFee, note: "交强险、商业险等，按实际报价替换" },
    { label: "上牌登记", amount: registrationFee, note: "上牌、临牌、登记或代办费用" },
    { label: "金融服务费", amount: financeServiceFee, note: "如方案没有该项，可保持为 0" },
  ];
  const monthlyFeeItems = [
    { label: "金融月供", amount: monthlyLoanPayment, note: financePlan === "nio-five-year" ? "前 36 期免息月供，后 24 期会变化" : financePlan === "nio-seven-year" ? "7 年超低息方案估算月供" : financeMode === "equal-principal" ? "等额本金首月最高，后续递减" : financeMode === "interest-free" ? "免息分期，本金平均摊还" : "等额本息，每月基本一致" },
    { label: "后段月供", amount: loanQuote.lastPayment, note: financePlan === "nio-five-year" ? "第 37-60 期参考月供" : "当前方案末期月供参考" },
    { label: "结清金额参考", amount: settlementAmount, note: financePlan === "nio-five-year" ? `按第 ${settlementMonth} 期结清估算` : payoffAtOwnership > 0 ? `按持有 ${ownershipYears || 0} 年后一次结清估算` : earlyPayoffEligibleMonth > 0 ? `满 ${earlyPayoffEligibleMonth} 期可申请，具体以金融机构确认为准` : "持有期短于分期期限时显示" },
    { label: "BaaS 电池月租", amount: purchaseMode === "baas" ? batteryRentMonthly : 0, note: "仅选择租电方案时计入，按你的合同月租填写" },
    { label: "充电 / 换电", amount: chargingMonthly, note: "按个人通勤里程和补能习惯估算" },
    { label: "停车", amount: parkingMonthly, note: "车位、临停或单位停车费用" },
    { label: "保养及杂费", amount: maintenanceMonthly, note: "洗车、耗材、轮胎、保养等长期支出" },
  ];
  const currentBillSnapshot: FinanceBillSnapshot = {
    selectedModel,
    selectedTrim,
    purchaseMode,
    financePlan,
    financeMode,
    purchaseTaxMode,
    manualVehiclePrice,
    selectedOptions,
    customBudget,
    downPaymentRate,
    financeYears,
    annualRate,
    fiveYearPayoffMonth,
    ownershipYears,
    vatRate,
    insuranceFee,
    registrationFee,
    financeServiceFee,
    batteryRentMonthly,
    chargingMonthly,
    parkingMonthly,
    maintenanceMonthly,
    customerName,
    billTitle,
    billNote,
    generatedAt: new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeStyle: "short" }).format(new Date()),
    currentModelName: currentModel.name,
    currentTrimName: currentTrim.name,
    vehicleSubtotal,
    purchaseTax,
    downPaymentAmount,
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

  function chooseModel(modelKey: ModelKey) {
    setSelectedModel(modelKey);
    setSelectedTrim(models[modelKey].trims[1]?.name ?? models[modelKey].trims[0].name);
    setSelectedOptions([]);
    setCustomBudget(0);
    setManualVehiclePrice(purchaseMode === "vehicle" ? models[modelKey].trims[1]?.vehiclePrice ?? models[modelKey].trims[0].vehiclePrice : models[modelKey].trims[1]?.baasPrice ?? models[modelKey].trims[0].baasPrice);
  }

  function chooseTrim(trimName: string) {
    const trim = currentModel.trims.find((item) => item.name === trimName) ?? currentModel.trims[0];
    setSelectedTrim(trim.name);
    setSelectedOptions([]);
    setManualVehiclePrice(purchaseMode === "vehicle" ? trim.vehiclePrice : trim.baasPrice);
  }

  function switchPurchaseMode(mode: PurchaseMode) {
    setPurchaseMode(mode);
    setManualVehiclePrice(mode === "vehicle" ? currentTrim.vehiclePrice : currentTrim.baasPrice);
  }

  function toggleOption(option: KnownOption) {
    if (option.excludedTrim === currentTrim.name) return;
    setSelectedOptions((current) => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]);
  }

  function applyFinancePreset(preset: typeof financePresets[number]) {
    setFinancePlan(preset.key);
    if (preset.key === "nio-five-year") setFiveYearPayoffMonth(36);
    if (preset.downPaymentRate !== undefined) setDownPaymentRate(preset.downPaymentRate);
    if (preset.termYears !== undefined) setFinanceYears(preset.termYears);
    if (preset.mode) setFinanceMode(preset.mode);
    if (preset.annualRate !== undefined) setAnnualRate(preset.annualRate);
  }

  function switchToCustomPlan() {
    setFinancePlan("custom");
  }

  function saveCurrentBill() {
    const savedAt = new Date().toISOString();
    const id = `${selectedModel}-${Date.now()}`;
    const snapshot = { ...currentBillSnapshot, generatedAt: new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeStyle: "short" }).format(new Date()) };
    setSavedBills((current) => [
      {
        id,
        createdAt: savedAt,
        snapshot,
      },
      ...current.slice(0, 11),
    ]);
  }

  function loadSavedBill(item: SavedFinanceBill) {
    const form = item.snapshot;
    setSelectedModel(form.selectedModel);
    setSelectedTrim(form.selectedTrim);
    setPurchaseMode(form.purchaseMode);
    setFinancePlan(form.financePlan);
    setFinanceMode(form.financeMode);
    setPurchaseTaxMode(form.purchaseTaxMode);
    setManualVehiclePrice(form.manualVehiclePrice);
    setSelectedOptions(form.selectedOptions);
    setCustomBudget(form.customBudget);
    setDownPaymentRate(form.downPaymentRate);
    setFinanceYears(form.financeYears);
    setAnnualRate(form.annualRate);
    setFiveYearPayoffMonth(form.fiveYearPayoffMonth ?? 36);
    setOwnershipYears(form.ownershipYears);
    setVatRate(form.vatRate);
    setInsuranceFee(form.insuranceFee);
    setRegistrationFee(form.registrationFee);
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

  function deleteSavedBill(id: string) {
    setSavedBills((current) => current.filter((item) => item.id !== id));
  }

  function chooseRecordCategory(category: RecordCategoryKey | "all") {
    setSelectedRecordCategory(category);
    setSelectedStage("all");
    const nextRecord = dailyRecords.find((record) => category === "all" || record.category === category);
    if (nextRecord) setSelectedDailyId(nextRecord.id);
  }

  function chooseStage(stage: StageKey | "all") {
    setSelectedStage(stage);
    setSelectedRecordCategory("car-info");
    const nextRecord = dailyRecords.find((record) => stage === "all" ? record.category === "car-info" : record.stage === stage);
    if (nextRecord) setSelectedDailyId(nextRecord.id);
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

  return (
    <main>
      <header className="site-header" aria-label="主导航">
        <button className="brand brand-button" type="button" onClick={() => selectWorkspace("home")} aria-label="周多福首页">
          <span className="brand-mark">周</span>
          <span><strong>周多福</strong><small>乐道购车顾问 · 经验工作室</small></span>
        </button>
        <nav className="workspace-nav" aria-label="内容工作区">
          {workspaceTabs.map((tab) => (
            <button type="button" className={activeWorkspace === tab.key ? "active" : ""} key={tab.key} onClick={() => selectWorkspace(tab.key)}>
              {tab.label}
            </button>
          ))}
          <button type="button" onClick={goToContact}>联系</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A practical personal studio</p>
          <h1>把买车、效率和生活经验，整理成真正能用的东西。</h1>
          <p className="hero-text">我是周多福。这里不是一张名片，也不是把信息堆在一起的网页，而是一间会持续更新的工作室：你可以读专栏、看效率经验、算乐道预算，也可以带着自己的生活问题来找答案。</p>
          <div className="hero-actions"><button className="primary-action" type="button" onClick={() => selectWorkspace("life")}>先看四个专栏</button><button className="secondary-action" type="button" onClick={() => selectWorkspace("finance")}>直接算购车预算</button></div>
          <div className="hero-proof"><span>更新方向</span><strong>真诚、实用、可复用</strong><small>从生活场景出发，慢慢把答案做得更好。</small></div>
        </div>
        <div className="hero-panel"><img src="/images/home-hero.png" alt="家庭出行准备场景" /><div className="signal-card"><span>我的判断标准</span><strong>不急着成交，先把问题问对。</strong></div></div>
      </section>

      <section className="intro-band"><p>这里的每一块内容都有一个去处：先认识我，再读专栏；想提高效率，就看方法；准备买车，就进入场景和计算器。</p></section>

      <section className="workspace-switcher" id="workspace-content" aria-label="内容分类">
        <div>
          <p className="eyebrow">Content spaces</p>
          <h2>{workspaceTabs.find((tab) => tab.key === activeWorkspace)?.label}</h2>
          <p>{workspaceTabs.find((tab) => tab.key === activeWorkspace)?.description}</p>
        </div>
        <div className="workspace-tab-list" role="tablist" aria-label="选择内容分类">
          {workspaceTabs.map((tab) => (
            <button type="button" role="tab" aria-selected={activeWorkspace === tab.key} className={activeWorkspace === tab.key ? "active" : ""} key={tab.key} onClick={() => selectWorkspace(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeWorkspace === "records" && <section className="section daily-record-section" id="daily-record">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Daily record</p>
            <h2>今天的记录，先写成可以反复引用的一段话。</h2>
          </div>
          <p className="section-lead">日期、标签、观点和购车阶段，一次整理清楚，后面就能持续积累。</p>
        </div>

        <div className="record-collections" aria-label="每日记录集合分类">
          <button type="button" className={selectedRecordCategory === "all" ? "collection-card active" : "collection-card"} onClick={() => chooseRecordCategory("all")}>
            <span>全部记录</span>
            <strong>按日期回看所有沉淀</strong>
            <p>保留完整时间线，方便快速找到最近写过的内容。</p>
          </button>
          {recordCollections.map((collection) => (
            <button type="button" className={selectedRecordCategory === collection.key ? "collection-card active" : "collection-card"} key={collection.key} onClick={() => chooseRecordCategory(collection.key)}>
              <span>{collection.label}</span>
              <strong>{collection.title}</strong>
              <p>{collection.intro}</p>
            </button>
          ))}
        </div>

        <div className="daily-layout">
          <aside className="record-browser" aria-label="按日期选择每日记录">
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
              {selectedDailyRecord.stage && <span>{purchaseStages.find((stage) => stage.key === selectedDailyRecord.stage)?.title}</span>}
            </div>
            <h3>{selectedDailyRecord.title}</h3>
            <div className="record-tags">
              {selectedDailyRecord.tags.map((tag) => (
                <button type="button" key={tag} onClick={() => setSelectedDailyId(selectedDailyRecord.id)}>{tag}</button>
              ))}
            </div>
            {selectedDailyRecord.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="daily-takeaway">
              <span>记录结论</span>
              <strong>{selectedDailyRecord.takeaway}</strong>
            </div>
          </article>

          <div className="daily-sidebar">
            <section className="timeline-card" id="journey">
              <div className="timeline-head">
                <div>
                  <p className="eyebrow">Buyer journey</p>
                  <h3>买车阶段时间线</h3>
                </div>
                <button type="button" className={selectedStage === "all" ? "filter-chip active" : "filter-chip"} onClick={() => chooseStage("all")}>全部阶段</button>
              </div>
              <ol className="journey-list">
                {purchaseStages.map((item) => (
                  <li key={item.step} className={selectedStage === item.key ? "active" : ""}>
                    <button type="button" onClick={() => chooseStage(item.key)} aria-label={`查看${item.title}阶段的记录`}>
                      <span>{item.step}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.note}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            <section className="delivery-card">
              <p className="eyebrow">Delivery service</p>
              <h3>交付后的用车生命周期服务</h3>
              <p>
                对蔚来这类用户企业来说，交付不是结束，而是长期服务和生态体验的开始。
                重点不只是把车交出去，而是让后面的用车问题、补能、售后和社区体验都能持续被接住。
              </p>
              <ul>
                {deliveryServices.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        {activeCollection && <p className="collection-note">当前集合：{activeCollection.label}。{activeCollection.intro}</p>}
      </section>}

      {activeWorkspace === "home" && <>
      <section className="section compact-home-section" id="home-quick-links">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick access</p>
            <h2>先看你最关心的入口，再细读内容。</h2>
          </div>
          <p className="section-lead">把长页面拆成几个更短的入口，用户可以更快判断自己应该从哪里开始。</p>
        </div>
        <div className="home-quick-grid">
          <button type="button" className="home-quick-card" onClick={() => setHomeView("about")}>
            <span>关于我</span>
            <strong>为什么值得信任这套内容</strong>
            <p>了解我的判断标准、服务心态和长期更新方向。</p>
          </button>
          <button type="button" className="home-quick-card" onClick={() => setHomeView("columns")}>
            <span>内容专栏</span>
            <strong>四个栏目，按问题去看</strong>
            <p>购车、效率、信息和生活建议，按主题快速进入。</p>
          </button>
          <button type="button" className="home-quick-card" onClick={() => selectWorkspace("finance")}>
            <span>购车预算</span>
            <strong>先算落地和月供，再看方案</strong>
            <p>把首付、税费、贷款和长期成本放在一起。</p>
          </button>
          <button type="button" className="home-quick-card" onClick={() => selectWorkspace("records")}>
            <span>每日记录</span>
            <strong>按日期和阶段回看</strong>
            <p>从买车阶段和生活经验里，找到最相关的一段记录。</p>
          </button>
        </div>
      </section>

      <section className="section home-view-section" id="home-view-switcher">
        <div className="home-view-nav" role="tablist" aria-label="主页内容切换">
          <button type="button" role="tab" aria-selected={homeView === "quick"} className={homeView === "quick" ? "active" : ""} onClick={() => setHomeView("quick")}>入口总览</button>
          <button type="button" role="tab" aria-selected={homeView === "about"} className={homeView === "about" ? "active" : ""} onClick={() => setHomeView("about")}>关于我</button>
          <button type="button" role="tab" aria-selected={homeView === "columns"} className={homeView === "columns" ? "active" : ""} onClick={() => setHomeView("columns")}>内容专栏</button>
        </div>

        {homeView === "quick" && (
          <div className="home-view-summary">
            <div className="summary-card">
              <p className="eyebrow">Today’s route</p>
              <h3>适合先做一个小判断，而不是一口气看完全部内容。</h3>
              <p>如果你正准备买车，就从预算和贷款入口开始；如果你只是想了解我，就先看关于我和内容专栏。</p>
            </div>
            <div className="summary-card compact">
              <p className="eyebrow">Why it feels lighter</p>
              <ul>
                <li>每一块内容都只保留最重要的一句话。</li>
                <li>长文内容改成收起/展开，减少一次性视觉负担。</li>
                <li>导航入口更短，帮助访客更快进入最相关的部分。</li>
              </ul>
            </div>
          </div>
        )}

        {homeView === "about" && (
          <div className="home-view-grid">
            <section className="profile-section" id="about">
              <div className="profile-card">
                <div className="profile-mark">周</div>
                <div><p className="eyebrow">About the person behind the page</p><h2>{profile.name}</h2><p className="profile-role">{profile.role}</p><p>{profile.intro}</p><a className="text-link" href="mailto:otafukuchau@gmail.com">发邮件聊聊 →</a></div>
              </div>
              <div className="profile-notes"><p className="eyebrow">个人信息维护</p><h3>让访客知道为什么可以信任这里的内容。</h3><ul>{profile.promise.map((item) => <li key={item}>{item}</li>)}</ul><p className="muted-note">这个区域以后可以继续维护个人经历、服务城市、预约方式和最新状态，主页结构已经预留好位置。</p></div>
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
      <section className="section article-section" id="articles">
        <div className="section-heading"><div><p className="eyebrow">Column answers</p><h2>从一个问题开始，读一篇能带走的回答。</h2></div><div className="article-tools"><label className="search-field"><span>搜索专栏</span><input type="search" placeholder="输入关键词" value={articleQuery} onChange={(event) => setArticleQuery(event.target.value)} /></label><button type="button" className={selectedColumn === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setSelectedColumn("all")}>全部</button></div></div>
        <div className="article-filter">{columns.map((column) => <button type="button" className={selectedColumn === column.key ? "filter-chip active" : "filter-chip"} key={column.key} onClick={() => setSelectedColumn(column.key)}>{column.label}</button>)}</div>
        <div className="article-list">{filteredArticles.map((article) => { const column = columns.find((item) => item.key === article.column)!; const isOpen = expandedArticle === article.id; return <article className={isOpen ? "article-row open" : "article-row"} key={article.id}><div className="article-row-main"><div><span className="article-label">{column.label}</span><h3>{article.title}</h3><p>{article.excerpt}</p></div><button type="button" className="icon-button" aria-label={isOpen ? "收起文章" : "展开文章"} onClick={() => setExpandedArticle(isOpen ? null : article.id)}>{isOpen ? "−" : "+"}</button></div>{isOpen && <div className="article-body"><p>{article.body}</p><ul>{article.points.map((point) => <li key={point}>{point}</li>)}</ul></div>}</article> })}</div>
        {filteredArticles.length === 0 && <p className="empty-state">暂时没有匹配的文章，换一个关键词试试。</p>}
      </section>

      <section className="section efficiency-section" id="efficiency">
        <div className="efficiency-image"><img src="/images/efficiency-desk.png" alt="桌面整理和效率经验场景" /></div>
        <div className="efficiency-copy"><p className="eyebrow">Efficiency experience</p><h2>效率不是把一天塞满，而是把重复消耗变少。</h2><p>这里会持续记录我在工作、资料整理和沟通中真正用过的方法。每一条经验都尽量拆成步骤，方便你判断是否适合自己的节奏。</p><div className="efficiency-list">{efficiencyNotes.map((note) => { const isOpen = expandedEfficiency === note.id; return <article className={isOpen ? "efficiency-item open" : "efficiency-item"} key={note.id}><button type="button" onClick={() => setExpandedEfficiency(isOpen ? null : note.id)}><span>{note.title}</span><b>{isOpen ? "收起" : "展开步骤"}</b></button><p>{note.summary}</p>{isOpen && <ol>{note.steps.map((step) => <li key={step}>{step}</li>)}</ol>}</article> })}</div></div>
      </section>
      </>}

      {activeWorkspace === "car" && <>
      <section className="section model-section" id="models"><div className="section-heading"><div><p className="eyebrow">ONVO buyer guide</p><h2>乐道车型，放回你的家庭生活里选择。</h2></div><p className="section-lead">车型信息和价格会持续更新，先用场景理解差别，再用计算器把预算边界算清楚。</p></div><div className="model-grid">{(Object.keys(models) as ModelKey[]).map((modelKey) => { const model = models[modelKey]; return <article className="model-card" key={model.name}><div className="model-visual"><img src={model.image} alt="" /><span>{model.visualNote}</span><strong>{model.name}</strong></div><div className="model-card-body"><span>{model.subtitle}</span><h3>{model.name}</h3><p>{model.headline}</p><div className="price-row"><strong>{formatPrice(model.trims[0].vehiclePrice)} 起</strong><small>BaaS {formatPrice(model.trims[0].baasPrice)} 起</small></div><button type="button" onClick={() => { chooseModel(modelKey); selectWorkspace("finance"); }}>放入计算器</button></div></article> })}</div></section>

      </>}

      {activeWorkspace === "finance" && <section className="section calculator-section" id="calculator">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Price calculator</p>
            <h2>把落地费用、金融月供和 BaaS 月租放在一张清单里。</h2>
          </div>
          <p className="section-lead">
            先输入成交价和金融条件，再看首付、税费、月供、租电和长期用车成本。这里是估算工具，最终以门店报价、金融审批和合同为准。
          </p>
        </div>

        <div className="finance-presets" aria-label="金融方案快捷填入">
          {financePresets.map((preset) => (
            <button
              type="button"
              className={financePlan === preset.key ? "finance-card active" : "finance-card"}
              key={preset.label}
              onClick={() => applyFinancePreset(preset)}
            >
              <span>{preset.label}</span>
              <strong>{preset.badge}</strong>
              <small>{preset.note}</small>
            </button>
          ))}
        </div>

        <div className="calculator-shell finance-shell">
          <div className="calculator-controls">
            <div className="control-group">
              <span className="control-label">车型</span>
              <div className="segmented">
                {(Object.keys(models) as ModelKey[]).map((modelKey) => (
                  <button type="button" className={selectedModel === modelKey ? "active" : ""} key={modelKey} onClick={() => chooseModel(modelKey)}>
                    {models[modelKey].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">版本</span>
              <div className="trim-grid">
                {currentModel.trims.map((trim) => (
                  <button
                    type="button"
                    className={currentTrim.name === trim.name ? "trim-card active" : "trim-card"}
                    key={trim.name}
                    onClick={() => chooseTrim(trim.name)}
                  >
                    <span>{trim.tag}</span>
                    <strong>{trim.name}</strong>
                    <small>{purchaseMode === "vehicle" ? formatPrice(trim.vehiclePrice) : `BaaS ${formatPrice(trim.baasPrice)}`}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="plan-summary-card">
              <p className="eyebrow">Plan summary</p>
              <h3>{selectedFinancePlan.label}</h3>
              <p>{planDescription}</p>
              <div className="plan-summary-meta">
                <span>分期：{loanTermMonths} 期</span>
                <span>持有：{ownershipYears || 0} 年</span>
                <span>第 {settlementMonth} 期结清：{formatPrice(settlementAmount)}</span>
              </div>
              <p className="input-help">{financePlan === "nio-five-year" ? "分期固定为 5 年；可在第 36–60 期选择结清，使用年限成本则按下方持有年限单独计算。" : "分期年限是贷款合同总期数，持有年限是你计划开多久；持有期结束时会估算剩余本金。"}</p>
            </div>

            {financePlan === "nio-five-year" && (
              <label className="budget-input payoff-month-input">
                <span>免 3 年后结清期数</span>
                <input min="36" max="60" step="1" type="number" value={fiveYearPayoffMonth} onChange={(event) => setFiveYearPayoffMonth(Math.min(60, Math.max(36, Number(event.target.value) || 36)))} />
                <small className="input-help">可填第 36–60 期；36 期结清通常不含后 24 期费用，60 期表示按完整 5 年还完。</small>
              </label>
            )}

            <div className="control-grid">
              <label className="budget-input">
                <span>车辆成交价 / BaaS 车价</span>
                <input min="0" step="1000" type="number" value={manualVehiclePrice === 0 ? "" : manualVehiclePrice} onChange={(event) => setManualVehiclePrice(Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <label className="budget-input">
                <span>自定义选装预算</span>
                <input min="0" step="1000" type="number" value={customBudget === 0 ? "" : customBudget} onChange={(event) => setCustomBudget(Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <label className="budget-input">
                <span>首付比例</span>
                <input min="0" max="100" step="5" type="number" value={downPaymentRate === 0 ? "" : downPaymentRate} onChange={(event) => setDownPaymentRate(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} />
              </label>
              <label className="budget-input">
                <span>分期年限（贷款合同）</span>
                <input min="0" max="8" step="1" type="number" value={financeYears === 0 ? "" : financeYears} onChange={(event) => { switchToCustomPlan(); setFinanceYears(Math.min(8, Math.max(0, Number(event.target.value) || 0))); }} />
                <small className="input-help">例如 5 年 = 60 期，这是贷款合同的总月数。</small>
              </label>
              <label className="budget-input">
                <span>方案标示年化费率</span>
                <input min="0" max="24" step="0.1" type="number" value={annualRate === 0 ? "" : annualRate} onChange={(event) => { switchToCustomPlan(); setAnnualRate(Math.min(24, Math.max(0, Number(event.target.value) || 0))); }} />
              </label>
              <label className="budget-input">
                <span>BaaS 电池月租</span>
                <input min="0" step="50" type="number" value={batteryRentMonthly === 0 ? "" : batteryRentMonthly} onChange={(event) => setBatteryRentMonthly(Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <label className="budget-input">
                <span>持有年限（计划开多久）</span>
                <input min="0" max="10" step="1" type="number" value={ownershipYears === 0 ? "" : ownershipYears} onChange={(event) => setOwnershipYears(Math.min(10, Math.max(0, Number(event.target.value) || 0)))} />
                <small className="input-help">例如持有 3 年后一次结清，系统会估算那一刻还剩多少本金。</small>
              </label>
              <label className="budget-input">
                <span>增值税折算率</span>
                <input min="0" max="20" step="0.5" type="number" value={vatRate === 0 ? "" : vatRate} onChange={(event) => setVatRate(Math.min(20, Math.max(0, Number(event.target.value) || 0)))} />
              </label>
            </div>

            <div className="control-group">
              <span className="control-label">购买方式</span>
              <div className="segmented">
                <button type="button" className={purchaseMode === "vehicle" ? "active" : ""} onClick={() => switchPurchaseMode("vehicle")}>整车购买</button>
                <button type="button" className={purchaseMode === "baas" ? "active" : ""} onClick={() => switchPurchaseMode("baas")}>BaaS 电池租用</button>
              </div>
            </div>

            {financePlan === "custom" && (
              <div className="control-group">
                <span className="control-label">金融方案</span>
                <div className="segmented">
                  <button type="button" className={financeMode === "equal-payment" ? "active" : ""} onClick={() => { switchToCustomPlan(); setFinanceMode("equal-payment"); }}>等额本息</button>
                  <button type="button" className={financeMode === "equal-principal" ? "active" : ""} onClick={() => { switchToCustomPlan(); setFinanceMode("equal-principal"); }}>等额本金</button>
                  <button type="button" className={financeMode === "interest-free" ? "active" : ""} onClick={() => { switchToCustomPlan(); setFinanceMode("interest-free"); setAnnualRate(0); }}>免息分期</button>
                </div>
              </div>
            )}

            <div className="control-group">
              <span className="control-label">购置税口径</span>
              <div className="segmented">
                <button type="button" className={purchaseTaxMode === "new-energy" ? "active" : ""} onClick={() => setPurchaseTaxMode("new-energy")}>新能源减半</button>
                <button type="button" className={purchaseTaxMode === "regular" ? "active" : ""} onClick={() => setPurchaseTaxMode("regular")}>普通车辆 10%</button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">官方选装配置</span>
              {visibleOptions.length > 0 ? (
                <div className="option-list">
                  {visibleOptions.map((option) => {
                    const disabled = option.excludedTrim === currentTrim.name;
                    const selected = selectedOptions.includes(option.id) && !disabled;
                    return (
                      <button type="button" className={selected ? "option-row active" : "option-row"} key={option.id} disabled={disabled} onClick={() => toggleOption(option)}>
                        <span><strong>{option.label}</strong><small>{disabled ? "当前版本已包含" : option.note}</small></span>
                        <b>{disabled ? "标配" : `+${formatPrice(option.price)}`}</b>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="muted-note">当前车型没有录入官方单项选装价格，可在自定义选装预算里单独填写。</p>
              )}
            </div>

            <div className="fee-input-grid">
              <label className="budget-input">
                <span>首年保险</span>
                <input min="0" step="100" type="number" value={insuranceFee === 0 ? "" : insuranceFee} onChange={(event) => setInsuranceFee(Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <label className="budget-input">
                <span>上牌登记</span>
                <input min="0" step="100" type="number" value={registrationFee === 0 ? "" : registrationFee} onChange={(event) => setRegistrationFee(Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <label className="budget-input">
                <span>金融服务费（计入 IRR）</span>
                <input min="0" step="100" type="number" value={financeServiceFee === 0 ? "" : financeServiceFee} onChange={(event) => setFinanceServiceFee(Math.max(0, Number(event.target.value) || 0))} />
                <small className="input-help">默认按放款当期由借款人承担处理；实际收取方式不同，请以合同为准。</small>
              </label>
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

            <div className="bill-form-grid">
              <label className="budget-input">
                <span>用户称呼</span>
                <input type="text" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="例如：周先生 / 王女士" />
              </label>
              <label className="budget-input">
                <span>账单标题</span>
                <input type="text" value={billTitle} onChange={(event) => setBillTitle(event.target.value)} placeholder="例如：L60 购车金融账单" />
              </label>
              <label className="budget-input bill-note">
                <span>账单备注</span>
                <textarea value={billNote} onChange={(event) => setBillNote(event.target.value)} rows={3} placeholder="例如：给家人一起看，主要关注月供和总成本。" />
              </label>
            </div>
          </div>

          <aside className="estimate-panel finance-panel">
            <span className="estimate-kicker">{currentModel.name} {currentTrim.name} · {purchaseMode === "baas" ? "BaaS 租电" : "整车购买"}</span>
            <strong className="estimate-total">{formatPrice(ownershipTotal)}</strong>
            <p>{ownershipYears} 年持有期总支出估算，已拆分整车购置、融资相关和使用年限成本。</p>

            <div className="finance-tab-list" role="tablist" aria-label="金融结果切换">
              <button type="button" role="tab" aria-selected={financeTab === "summary"} className={financeTab === "summary" ? "active" : ""} onClick={() => setFinanceTab("summary")}>摘要</button>
              <button type="button" role="tab" aria-selected={financeTab === "details"} className={financeTab === "details" ? "active" : ""} onClick={() => setFinanceTab("details")}>明细</button>
            </div>

            {financeTab === "summary" ? (
              <>
                <div className="finance-metrics">
                  <div><span>整车购置成本</span><strong>{formatPrice(vehicleCost)}</strong></div>
                  <div><span>融资相关成本</span><strong>{formatPrice(financingCost)}</strong></div>
                  <div><span>使用年限成本</span><strong>{formatPrice(usageCost)}</strong></div>
                  <div><span>贷款本金</span><strong>{formatPrice(loanPrincipal)}</strong></div>
                  <div><span>结清前已付利息</span><strong>{formatPrice(interestPaidThroughSettlement)}</strong></div>
                  <div><span>方案标示费率</span><strong>{displayedRateLabel}</strong></div>
                  <div className="irr-metric"><span>综合年化融资成本（IRR）</span><strong>{formatIrr(loanIrrPercent)}</strong></div>
                  <div><span>{ownershipYears} 年总支出</span><strong>{formatPrice(ownershipTotal)}</strong></div>
                </div>
                <p className="input-help irr-note">IRR 按贷款本金、贷款相关费用与每月还款现金流反推，更适合横向比较不同方案。销售沟通建议先讲月供、总利息和总成本，再把 IRR 作为透明的比较口径；本页仅为估算，最终以金融机构的综合融资成本明示表和合同为准。</p>
              </>
            ) : (
              <div className="finance-details-card">
                <div className="finance-detail-row"><span>贷款期数</span><strong>{loanTermMonths} 期</strong></div>
                <div className="finance-detail-row"><span>结清期数</span><strong>{settlementMonth} 期</strong></div>
                <div className="finance-detail-row"><span>结清金额</span><strong>{formatPrice(settlementAmount)}</strong></div>
                <div className="finance-detail-row"><span>整车购置成本</span><strong>{formatPrice(vehicleCost)}</strong></div>
                <div className="finance-detail-row"><span>融资相关成本</span><strong>{formatPrice(financingCost)}</strong></div>
                <div className="finance-detail-row"><span>使用年限成本</span><strong>{formatPrice(usageCost)}</strong></div>
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

            <a href={currentModel.officialUrl} target="_blank" rel="noreferrer">查看乐道官网 →</a>
            <div className="bill-actions">
              <button type="button" onClick={saveCurrentBill}>保存到账单库</button>
              <button type="button" onClick={() => exportCurrentBill("csv")}>导出表格 CSV</button>
              <button type="button" onClick={() => exportCurrentBill("html")}>导出文档 HTML</button>
            </div>
            <p className="muted-note">保存内容会留在当前浏览器里，导出的表格和文档可直接发给家人、顾问或自己留档。</p>
          </aside>
        </div>

        <div className="cost-checklist">
          <section>
            <p className="eyebrow">Upfront cost</p>
            <h3>一次性落地清单</h3>
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
            <h3>每月使用清单</h3>
            <div className="fee-list">
              {monthlyFeeItems.map((item) => (
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
            <p>购置税估算：含税成交价先按增值税折算率还原为不含税计税价，再按所选税收口径估算。BaaS 月租作为长期月度成本单独展示。</p>
            <p>综合年化融资成本采用 IRR 复利口径，默认把金融服务费视为放款当期由借款人承担的贷款相关费用。<a href="https://xining.pbc.gov.cn/goutongjiaoliu/113456/113469/2025092212551432728/index.html" target="_blank" rel="noreferrer">查看中国人民银行口径 →</a></p>
          </section>
        </div>

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

      {activeWorkspace === "car" && <>
      <section className="section scenario-section" id="scenarios"><div className="section-heading"><div><p className="eyebrow">Lifestyle match</p><h2>按家庭和生活方式，而不是按参数表开始。</h2></div></div><div className="scenario-layout"><div className="scenario-tabs">{(Object.keys(scenarios) as ScenarioKey[]).map((key) => <button type="button" className={selectedScenario === key ? "active" : ""} key={key} onClick={() => { setSelectedScenario(key); chooseModel(scenarios[key].model); }}>{scenarios[key].label}</button>)}</div><article className="scenario-story"><span>推荐重点看 {models[scenario.model].name}</span><h3>{scenario.title}</h3><p>{scenario.story}</p><ul>{scenario.checklist.map((item) => <li key={item}>{item}</li>)}</ul></article></div></section>

      <section className="section highlights-section" id="highlights"><div className="section-heading"><div><p className="eyebrow">Model highlights</p><h2>车型亮点要讲成家人能听懂的话。</h2></div></div><div className="highlight-grid">{(Object.keys(models) as ModelKey[]).map((modelKey) => <article className="highlight-card" key={modelKey}><span>{models[modelKey].name}</span><h3>{models[modelKey].lifestyle}</h3><ul>{models[modelKey].highlights.map((item) => <li key={item}>{item}</li>)}</ul><p>{models[modelKey].advisorNote}</p></article>)}</div></section>

      <section className="section source-section">
        <div>
          <p className="eyebrow">Sources</p>
          <h2>价格、税费和金融口径都尽量从官方来。</h2>
        </div>
        <ul>
          {(Object.keys(models) as ModelKey[]).map((modelKey) => (
            <li key={modelKey}>
              <a href={models[modelKey].officialUrl} target="_blank" rel="noreferrer">
                {models[modelKey].name}
              </a>
              <span>{models[modelKey].sourceLabel}</span>
            </li>
          ))}
          <li>
            <a href="https://www.onvo.cn/news" target="_blank" rel="noreferrer">乐道官网新闻</a>
            <span>用于核对上市、价格、权益和车型定位。</span>
          </li>
          <li>
            <a href="https://hq.mof.gov.cn/tongzhitonggao/202307/t20230704_3894319.htm" target="_blank" rel="noreferrer">新能源车购置税政策</a>
            <span>2026-2027 年新能源乘用车减半征收购置税，每辆减税额不超过 1.5 万元。</span>
          </li>
          <li>
            <a href="https://www.bankofchina.com/pbservice/pb2/200806/t20080625_714_76.htm" target="_blank" rel="noreferrer">汽车贷款还款方式</a>
            <span>等额本息、等额本金等还款方式的常见银行口径参考。</span>
          </li>
          <li>
            <a href="https://www.onvo.cn/testimonials/20250211012" target="_blank" rel="noreferrer">乐道 BaaS 月租参考</a>
            <span>官方社区内容中提到 60 度 599 元/月、85 度 899 元/月的租电参考。</span>
          </li>
        </ul>
      </section>
      </>}

      {activeWorkspace === "home" && <section className="contact-section" id="contact"><div><p className="eyebrow">Contact</p><h2>想看车、试驾，或者想把一个生活问题聊清楚，可以从这里开始。</h2></div><div className="contact-methods">{contactMethods.map((method) => <a className="contact-method" href={method.href} key={method.label} target={method.label === "小红书号" ? "_blank" : undefined} rel={method.label === "小红书号" ? "noreferrer" : undefined}><span>{method.label}</span><strong>{method.value}</strong></a>)}</div></section>}
    </main>
  );
}
