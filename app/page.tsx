"use client";

import { useMemo, useState } from "react";

type ModelKey = "l60" | "l80" | "l90";
type PurchaseMode = "vehicle" | "baas";
type ScenarioKey = "commute" | "kids" | "travel" | "parents";
type ColumnKey = "car" | "efficiency" | "information" | "life";

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

const navItems = [
  { label: "关于我", href: "#about" },
  { label: "每日记录", href: "#daily-record" },
  { label: "四个专栏", href: "#columns" },
  { label: "效率经验", href: "#efficiency" },
  { label: "乐道车型", href: "#models" },
  { label: "联系", href: "#contact" },
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

const dailyRecords = [
  {
    date: "2026-07-24",
    tag: "#买车的初阶段",
    title: "把门店邀约当成服务，而不是催促",
    paragraphs: [
      "其实，只要最近开始了解车，很多车企都会频繁打电话、邀约试驾，后续跟进也会很多。对一些人来说，这会特别反感；但如果把它看成一种服务和出行体验，感受就会完全不一样。",
      "免费的上门接送、试驾安排、礼品和门店陪同，本质上都在帮助你更快把信息补齐。如果还是觉得打扰，直接告诉服务人员，请他们在后台备注，后面通常就不会再继续打扰。",
      "买车的决策周期往往就那么几天，但你不一定要被催着在几天内做决定。真正重要的，不是赶着下单，而是用心把决策做对。",
    ],
    takeaway: "把买车当成一次需要认真完成的决策，而不是一次被动催促的消费。",
  },
  {
    date: "2026-07-26",
    tag: "#电动车用车判断",
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

const purchaseStages = [
  { step: "01", title: "初买车打算", note: "先确认自己为什么要买车，是否真的需要换车或新增一台。" },
  { step: "02", title: "网上了解", note: "看官网、口碑、测评和政策，先建立基础认知。" },
  { step: "03", title: "线下了解", note: "进店看实车、摸材质、问清服务和交付流程。" },
  { step: "04", title: "对比", note: "横向看竞品，把价格、空间、补能和权益放在一起。" },
  { step: "05", title: "体验", note: "试驾、试乘和后排体验，感受它是否真的适合家人。" },
  { step: "06", title: "预算", note: "整车、BaaS、保险、补能和停车一起算总账。" },
  { step: "07", title: "沟通", note: "和顾问确认权益、交期、服务和可能的疑问。" },
  { step: "08", title: "订车", note: "确定版本、颜色和交付节奏，完成下定。" },
  { step: "09", title: "交付", note: "验车、提车、熟悉功能，把车真正接回家。" },
  { step: "10", title: "交付后的生命周期服务", note: "补能、售后、升级、社区和用车问题处理，才是长期体验的开始。" },
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

const scenarios: Record<ScenarioKey, { label: string; title: string; model: ModelKey; story: string; checklist: string[] }> = {
  commute: { label: "通勤 + 接送", title: "工作日像闹钟一样准时，车要帮你省心。", model: "l60", story: "每天固定路线上下班、接孩子、买菜，最怕停车难、补能焦虑和车机不好用。这个场景先看 L60，再判断是否需要后排娱乐套装。", checklist: ["车位尺寸", "每日通勤里程", "孩子是否常坐后排", "附近补能是否方便"] },
  kids: { label: "二孩家庭", title: "不只多一个座位，而是少很多家庭摩擦。", model: "l90", story: "两个安全座椅、老人同乘、婴儿车和书包一起上车，L90 的六座或七座布局会比纸面参数更有说服力。试驾时一定要模拟真实座位分配。", checklist: ["6 座或 7 座", "第三排进出", "安全座椅位置", "满员后备厢"] },
  travel: { label: "长途旅行", title: "长途不是拼忍耐，是让每个人都还有余量。", model: "l90", story: "一年有几次跨城、露营或返乡，车就不能只服务驾驶者。L90 的重点是满载空间、前备舱、二三排舒适和补能路线。", checklist: ["满载行李", "老人乘坐时长", "高速补能规划", "露营 / 运动装备"] },
  parents: { label: "带父母出行", title: "好车感，往往来自上下车和坐久了不累。", model: "l80", story: "父母不一定关心智驾和算力，但会立刻感受到座椅、车内安静和上下车姿态。L80/L90 都值得看，先由车位和预算决定。", checklist: ["上下车便利", "第二排坐姿", "晕车敏感度", "空调和座椅舒适"] },
};

const formatPrice = (value: number) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(value);

export default function Home() {
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | "all">("all");
  const [articleQuery, setArticleQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>("car-fit");
  const [expandedEfficiency, setExpandedEfficiency] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelKey>("l60");
  const [selectedTrim, setSelectedTrim] = useState("Max");
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("vehicle");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customBudget, setCustomBudget] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("commute");

  const filteredArticles = useMemo(() => {
    const query = articleQuery.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesColumn = selectedColumn === "all" || article.column === selectedColumn;
      const text = `${article.title} ${article.excerpt} ${article.body}`.toLowerCase();
      return matchesColumn && (!query || text.includes(query));
    });
  }, [articleQuery, selectedColumn]);

  const currentModel = models[selectedModel];
  const currentTrim = currentModel.trims.find((trim) => trim.name === selectedTrim) ?? currentModel.trims[0];
  const visibleOptions = knownOptions.filter((option) => option.models.includes(selectedModel));
  const optionTotal = useMemo(() => visibleOptions.reduce((total, option) => option.excludedTrim === currentTrim.name || !selectedOptions.includes(option.id) ? total : total + option.price, 0), [currentTrim.name, selectedOptions, visibleOptions]);
  const basePrice = purchaseMode === "vehicle" ? currentTrim.vehiclePrice : currentTrim.baasPrice;
  const estimateTotal = basePrice + optionTotal + customBudget;
  const scenario = scenarios[selectedScenario];

  function chooseModel(modelKey: ModelKey) {
    setSelectedModel(modelKey);
    setSelectedTrim(models[modelKey].trims[1]?.name ?? models[modelKey].trims[0].name);
    setSelectedOptions([]);
    setCustomBudget(0);
  }

  function toggleOption(option: KnownOption) {
    if (option.excludedTrim === currentTrim.name) return;
    setSelectedOptions((current) => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]);
  }

  return (
    <main>
      <header className="site-header" aria-label="主导航">
        <a className="brand" href="#top" aria-label="周多福首页">
          <span className="brand-mark">周</span>
          <span><strong>周多福</strong><small>乐道购车顾问 · 经验工作室</small></span>
        </a>
        <nav>{navItems.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}</nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A practical personal studio</p>
          <h1>把买车、效率和生活经验，整理成真正能用的东西。</h1>
          <p className="hero-text">我是周多福。这里不是一张名片，也不是把信息堆在一起的网页，而是一间会持续更新的工作室：你可以读专栏、看效率经验、算乐道预算，也可以带着自己的生活问题来找答案。</p>
          <div className="hero-actions"><a className="primary-action" href="#columns">先看四个专栏</a><a className="secondary-action" href="#calculator">直接算购车预算</a></div>
          <div className="hero-proof"><span>更新方向</span><strong>真诚、实用、可复用</strong><small>从生活场景出发，慢慢把答案做得更好。</small></div>
        </div>
        <div className="hero-panel"><img src="/images/home-hero.png" alt="家庭出行准备场景" /><div className="signal-card"><span>我的判断标准</span><strong>不急着成交，先把问题问对。</strong></div></div>
      </section>

      <section className="intro-band"><p>这里的每一块内容都有一个去处：先认识我，再读专栏；想提高效率，就看方法；准备买车，就进入场景和计算器。</p></section>

      <section className="section daily-record-section" id="daily-record">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Daily record</p>
            <h2>今天的记录，先写成可以反复引用的一段话。</h2>
          </div>
          <p className="section-lead">日期、标签、观点和购车阶段，一次整理清楚，后面就能持续积累。</p>
        </div>

        <div className="daily-layout">
          <div className="daily-entry-list">
            {dailyRecords.map((entry) => (
              <article className="daily-entry" key={entry.date}>
                <div className="daily-meta">
                  <span>{entry.date}</span>
                  <span>{entry.tag}</span>
                </div>
                <h3>{entry.title}</h3>
                {entry.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <div className="daily-takeaway">
                  <span>记录结论</span>
                  <strong>{entry.takeaway}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="daily-sidebar">
            <section className="timeline-card" id="journey">
              <p className="eyebrow">Buyer's journey</p>
              <h3>买车阶段时间线</h3>
              <ol className="journey-list">
                {purchaseStages.map((item) => (
                  <li key={item.step}>
                    <span>{item.step}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.note}</p>
                    </div>
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
      </section>

      <section className="section profile-section" id="about">
        <div className="profile-card">
          <div className="profile-mark">周</div>
          <div><p className="eyebrow">About the person behind the page</p><h2>{profile.name}</h2><p className="profile-role">{profile.role}</p><p>{profile.intro}</p><a className="text-link" href="mailto:otafukuchau@gmail.com">发邮件聊聊 →</a></div>
        </div>
        <div className="profile-notes"><p className="eyebrow">个人信息维护</p><h3>让访客知道为什么可以信任这里的内容。</h3><ul>{profile.promise.map((item) => <li key={item}>{item}</li>)}</ul><p className="muted-note">这个区域以后可以继续维护个人经历、服务城市、预约方式和最新状态，主页结构已经预留好位置。</p></div>
      </section>

      <section className="section columns-section" id="columns">
        <div className="section-heading"><div><p className="eyebrow">Four long-term columns</p><h2>四个长期栏目，回答不同的生活问题。</h2></div><p className="section-lead">不追热点，不把复杂事情说得更复杂。每个栏目都从一个真实问题开始，慢慢积累可以回看的答案。</p></div>
        <div className="column-grid">{columns.map((column) => <button type="button" className={selectedColumn === column.key ? "column-card active" : "column-card"} key={column.key} onClick={() => setSelectedColumn(column.key)}><img src={column.image} alt="" /><span>{column.label}</span><h3>{column.title}</h3><p>{column.copy}</p><b>查看这个专栏 ↓</b></button>)}</div>
      </section>

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

      <section className="section model-section" id="models"><div className="section-heading"><div><p className="eyebrow">ONVO buyer guide</p><h2>乐道车型，放回你的家庭生活里选择。</h2></div><p className="section-lead">车型信息和价格会持续更新，先用场景理解差别，再用计算器把预算边界算清楚。</p></div><div className="model-grid">{(Object.keys(models) as ModelKey[]).map((modelKey) => { const model = models[modelKey]; return <article className="model-card" key={model.name}><div className="model-visual"><img src={model.image} alt="" /><span>{model.visualNote}</span><strong>{model.name}</strong></div><div className="model-card-body"><span>{model.subtitle}</span><h3>{model.name}</h3><p>{model.headline}</p><div className="price-row"><strong>{formatPrice(model.trims[0].vehiclePrice)} 起</strong><small>BaaS {formatPrice(model.trims[0].baasPrice)} 起</small></div><button type="button" onClick={() => { chooseModel(modelKey); document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" }); }}>放入计算器</button></div></article> })}</div></section>

      <section className="section calculator-section" id="calculator"><div className="calculator-copy"><p className="eyebrow">Price calculator</p><h2>先把预算边界算清楚，再决定试驾哪一台。</h2><p>估算按当前整理的乐道官网公开价格计算。已过期限时权益不计入总价；未披露单项价格的个性化配置，可以用自定义预算单独填写。</p></div><div className="calculator-shell"><div className="calculator-controls"><div className="control-group"><span className="control-label">车型</span><div className="segmented">{(Object.keys(models) as ModelKey[]).map((modelKey) => <button type="button" className={selectedModel === modelKey ? "active" : ""} key={modelKey} onClick={() => chooseModel(modelKey)}>{models[modelKey].name}</button>)}</div></div><div className="control-group"><span className="control-label">版本</span><div className="trim-grid">{currentModel.trims.map((trim) => <button type="button" className={currentTrim.name === trim.name ? "trim-card active" : "trim-card"} key={trim.name} onClick={() => { setSelectedTrim(trim.name); setSelectedOptions([]); }}><span>{trim.tag}</span><strong>{trim.name}</strong><small>{trim.bestFor}</small></button>)}</div></div><div className="control-group"><span className="control-label">购买方式</span><div className="segmented"><button type="button" className={purchaseMode === "vehicle" ? "active" : ""} onClick={() => setPurchaseMode("vehicle")}>整车购买</button><button type="button" className={purchaseMode === "baas" ? "active" : ""} onClick={() => setPurchaseMode("baas")}>BaaS 电池租用</button></div></div><div className="control-group"><span className="control-label">选装配置</span>{visibleOptions.length > 0 ? <div className="option-list">{visibleOptions.map((option) => { const disabled = option.excludedTrim === currentTrim.name; const selected = selectedOptions.includes(option.id) && !disabled; return <button type="button" className={selected ? "option-row active" : "option-row"} key={option.id} disabled={disabled} onClick={() => toggleOption(option)}><span><strong>{option.label}</strong><small>{disabled ? "当前版本已包含" : option.note}</small></span><b>{disabled ? "标配" : `+${formatPrice(option.price)}`}</b></button> })}</div> : <p className="muted-note">官网未公开当前可选单项的完整价格，可以把颜色、轮圈、踏板或其他个性化配置预算填在下方。</p>}<label className="budget-input"><span>自定义选装预算</span><input min="0" step="1000" type="number" value={customBudget} onChange={(event) => setCustomBudget(Math.max(0, Number(event.target.value) || 0))} /></label></div></div><aside className="estimate-panel"><span className="estimate-kicker">{currentModel.name} {currentTrim.name}</span><strong className="estimate-total">{formatPrice(estimateTotal)}</strong><dl><div><dt>基础价格</dt><dd>{formatPrice(basePrice)}</dd></div><div><dt>已选官方选装</dt><dd>{formatPrice(optionTotal)}</dd></div><div><dt>自定义选装</dt><dd>{formatPrice(customBudget)}</dd></div></dl><p>{purchaseMode === "baas" ? "BaaS 会降低购车门槛，但要结合电池租金、持有年限和换车计划再判断。" : "整车购买适合希望一次性确认资产边界、长期持有和保值预期的人。"}</p><a href={currentModel.officialUrl} target="_blank" rel="noreferrer">查看乐道官网 →</a></aside></div></section>

      <section className="section scenario-section" id="scenarios"><div className="section-heading"><div><p className="eyebrow">Lifestyle match</p><h2>按家庭和生活方式，而不是按参数表开始。</h2></div></div><div className="scenario-layout"><div className="scenario-tabs">{(Object.keys(scenarios) as ScenarioKey[]).map((key) => <button type="button" className={selectedScenario === key ? "active" : ""} key={key} onClick={() => { setSelectedScenario(key); chooseModel(scenarios[key].model); }}>{scenarios[key].label}</button>)}</div><article className="scenario-story"><span>推荐重点看 {models[scenario.model].name}</span><h3>{scenario.title}</h3><p>{scenario.story}</p><ul>{scenario.checklist.map((item) => <li key={item}>{item}</li>)}</ul></article></div></section>

      <section className="section highlights-section" id="highlights"><div className="section-heading"><div><p className="eyebrow">Model highlights</p><h2>车型亮点要讲成家人能听懂的话。</h2></div></div><div className="highlight-grid">{(Object.keys(models) as ModelKey[]).map((modelKey) => <article className="highlight-card" key={modelKey}><span>{models[modelKey].name}</span><h3>{models[modelKey].lifestyle}</h3><ul>{models[modelKey].highlights.map((item) => <li key={item}>{item}</li>)}</ul><p>{models[modelKey].advisorNote}</p></article>)}</div></section>

      <section className="section source-section"><div><p className="eyebrow">Sources</p><h2>价格和车型信息从官网来，判断从真实生活来。</h2></div><ul>{(Object.keys(models) as ModelKey[]).map((modelKey) => <li key={modelKey}><a href={models[modelKey].officialUrl} target="_blank" rel="noreferrer">{models[modelKey].name}</a><span>{models[modelKey].sourceLabel}</span></li>)}<li><a href="https://www.onvo.cn/news" target="_blank" rel="noreferrer">乐道官网新闻</a><span>用于核对上市、价格、权益和车型定位。</span></li></ul></section>

      <section className="contact-section" id="contact"><div><p className="eyebrow">Contact</p><h2>想看车、试驾，或者想把一个生活问题聊清楚，可以从这里开始。</h2></div><div className="contact-methods">{contactMethods.map((method) => <a className="contact-method" href={method.href} key={method.label} target={method.label === "小红书号" ? "_blank" : undefined} rel={method.label === "小红书号" ? "noreferrer" : undefined}><span>{method.label}</span><strong>{method.value}</strong></a>)}</div></section>
    </main>
  );
}
